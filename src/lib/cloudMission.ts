import { supabase } from "./supabase";

export type AgentStepName = "lead-hunter" | "lead-enricher" | "outreach-strategist" | "campaign-manager";

export interface PlanStep {
  agent: AgentStepName;
  params: Record<string, unknown>;
  rationale?: string;
}
export interface MissionPlan {
  summary: string;
  steps: PlanStep[];
}
export interface ExecutorEvent {
  kind: "plan" | "step_start" | "step_progress" | "step_done" | "step_error" | "mission_done" | "mission_error";
  message: string;
  data?: unknown;
}
export type ExecutorListener = (e: ExecutorEvent) => void;

async function authHeaders(): Promise<Record<string, string>> {
  if (!supabase) throw new Error("Supabase not configured");
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("Not signed in");
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
}

async function postAgent(path: string, body: unknown) {
  const headers = await authHeaders();
  const res = await fetch(path, { method: "POST", headers, body: JSON.stringify(body) });
  const text = await res.text();
  let parsed: any;
  try {
    parsed = text ? JSON.parse(text) : {};
  } catch {
    parsed = { _raw: text };
  }
  if (!res.ok) {
    const err = new Error(parsed.error || `${path} failed (${res.status})`);
    (err as any).response = parsed;
    throw err;
  }
  return parsed;
}

function resolvePlaceholders(params: Record<string, unknown>, ctx: ExecutionContext): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v === "from_previous" && (k === "contactIds" || k === "leadIds")) {
      out[k] = ctx.lastContactIds;
    } else if (v === "from_previous_strategist" && k === "draftsRunId") {
      out[k] = ctx.lastStrategistRunId;
    } else {
      out[k] = v;
    }
  }
  return out;
}

interface ExecutionContext {
  missionId: string;
  lastContactIds: string[];
  lastStrategistRunId: string | null;
  stepResults: any[];
}

export async function planMission(goal: string, listener?: ExecutorListener): Promise<{ missionId: string; runId: string; plan: MissionPlan }> {
  listener?.({ kind: "plan", message: "Asking the orchestrator to plan…" });
  const result = await postAgent("/api/agents/orchestrator", { action: "plan", goal });
  listener?.({ kind: "plan", message: `Plan ready: ${result.plan.summary}`, data: result.plan });
  return result;
}

export async function executePlan(
  missionId: string,
  plan: MissionPlan,
  listener?: ExecutorListener
): Promise<ExecutionContext> {
  const ctx: ExecutionContext = { missionId, lastContactIds: [], lastStrategistRunId: null, stepResults: [] };

  for (let i = 0; i < plan.steps.length; i++) {
    const step = plan.steps[i];
    const params = resolvePlaceholders(step.params, ctx);
    listener?.({ kind: "step_start", message: `Step ${i + 1}/${plan.steps.length} — ${step.agent}`, data: { step, params } });

    try {
      let result: any;
      if (step.agent === "lead-hunter") {
        const start = await postAgent("/api/agents/lead-hunter", {
          action: "start",
          missionId,
          goal: plan.summary,
          ...params,
        });
        const runId = start.runId;
        listener?.({ kind: "step_progress", message: `Apify scraping ${params.persona} in ${params.geography}…` });
        let attempts = 0;
        while (attempts < 60) {
          await new Promise(r => setTimeout(r, 5000));
          const poll = await postAgent("/api/agents/lead-hunter", { action: "poll", runId });
          if (poll.status === "succeeded") {
            result = poll;
            ctx.lastContactIds = poll.newContactIds || [];
            break;
          }
          if (poll.status === "failed") throw new Error("Lead hunter failed");
          attempts++;
          if (attempts % 4 === 0) listener?.({ kind: "step_progress", message: `Still scraping (${attempts * 5}s elapsed)…` });
        }
        if (!result) throw new Error("Lead hunter timed out after 5 minutes");
      } else if (step.agent === "lead-enricher") {
        result = await postAgent("/api/agents/lead-enricher", { missionId, goal: plan.summary, ...params });
        if (Array.isArray(result.enrichedIds) && result.enrichedIds.length > 0) ctx.lastContactIds = result.enrichedIds;
      } else if (step.agent === "outreach-strategist") {
        result = await postAgent("/api/agents/outreach-strategist", { missionId, goal: plan.summary, ...params });
        ctx.lastStrategistRunId = result.runId;
      } else if (step.agent === "campaign-manager") {
        const cmParams: any = { missionId, goal: plan.summary, ...params };
        if (cmParams.draftsRunId === undefined && ctx.lastStrategistRunId) cmParams.draftsRunId = ctx.lastStrategistRunId;
        result = await postAgent("/api/agents/campaign-manager", cmParams);
      } else {
        throw new Error(`Unknown agent: ${step.agent}`);
      }

      ctx.stepResults.push({ step: step.agent, result });
      listener?.({ kind: "step_done", message: `${step.agent} done`, data: result });
    } catch (err: any) {
      listener?.({ kind: "step_error", message: `${step.agent} failed: ${err.message}` });
      await postAgent("/api/agents/orchestrator", {
        action: "complete",
        missionId,
        status: "failed",
        error: err.message,
        summary: { stepResults: ctx.stepResults, failedAt: step.agent },
      });
      throw err;
    }
  }

  await postAgent("/api/agents/orchestrator", {
    action: "complete",
    missionId,
    status: "succeeded",
    summary: {
      stepResults: ctx.stepResults,
      finalContactIds: ctx.lastContactIds,
    },
  });
  listener?.({ kind: "mission_done", message: "Mission complete", data: ctx.stepResults });
  return ctx;
}

export async function runCloudMission(goal: string, listener?: ExecutorListener) {
  try {
    const { missionId, plan } = await planMission(goal, listener);
    await executePlan(missionId, plan, listener);
  } catch (err: any) {
    listener?.({ kind: "mission_error", message: err.message || String(err) });
    throw err;
  }
}
