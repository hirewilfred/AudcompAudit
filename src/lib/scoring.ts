import { AUDIT_QUESTIONS } from './audit-questions';

export function calculateAuditResults(answers: Record<string, number>) {
    const categories = {
        strategy: { score: 0, total: 0, count: 0 },
        data: { score: 0, total: 0, count: 0 },
        technical: { score: 0, total: 0, count: 0 },
        governance: { score: 0, total: 0, count: 0 },
        operational: { score: 0, total: 0, count: 0 },
    };

    AUDIT_QUESTIONS.forEach(q => {
        const value = answers[q.id] || 0;
        categories[q.category].score += value;
        categories[q.category].total += 10; // Max per question is 10
        categories[q.category].count += 1;
    });

    const categoryScores = Object.entries(categories).map(([name, data]) => ({
        category: name,
        score: data.total > 0 ? Math.round((data.score / data.total) * 100) : 0,
        fullMark: 100,
    }));

    const overallScore = Math.round(
        categoryScores.reduce((acc, curr) => acc + curr.score, 0) / categoryScores.length
    );

    return { categoryScores, overallScore };
}
