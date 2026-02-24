export interface Question {
    id: string;
    category: 'strategy' | 'data' | 'technical' | 'governance' | 'operational';
    text: string;
    description?: string;
    options: {
        label: string;
        value: number;
        feedback?: string;
    }[];
}

export const AUDIT_QUESTIONS: Question[] = [
    {
        id: 'vision_1',
        category: 'strategy',
        text: "How much does your leadership team prioritize AI in your business plans?",
        options: [
            { label: "We rarely talk about it", value: 1, feedback: "It's hard to move forward without leadership support." },
            { label: "We're interested, but don't have a plan or budget yet", value: 3 },
            { label: "We're testing a few AI tools in specific departments", value: 7 },
            { label: "AI is a top priority and we're investing heavily in it", value: 10, feedback: "Great! Your leadership is ready for the future." }
        ]
    },
    {
        id: 'data_1',
        category: 'data',
        text: "How easy is it to access all your company's information in one place?",
        options: [
            { label: "Very hard—everything is spread out in different systems", value: 1, feedback: "Scattered data is the biggest hurdle for AI." },
            { label: "It's okay, but we often have to manually move data around", value: 4 },
            { label: "Most of our data is connected and easy to find", value: 8 },
            { label: "Everything is perfectly organized and updates automatically", value: 10, feedback: "Excellent foundation for AI tools." }
        ]
    },
    {
        id: 'tech_1',
        category: 'technical',
        text: "Are your teams currently using AI (like ChatGPT) to help with their daily work?",
        options: [
            { label: "No, we haven't started using it yet", value: 1 },
            { label: "A few people are testing it on their own", value: 5 },
            { label: "We have specific AI tools set up for our teams to use", value: 8 },
            { label: "AI is built into almost everything we do", value: 10 }
        ]
    },
    {
        id: 'gov_1',
        category: 'governance',
        text: "Does your company have clear rules for using AI safely and securely?",
        options: [
            { label: "No rules or policies yet", value: 0, feedback: "This can be risky for your company's security." },
            { label: "We have some basic guidelines but nothing official", value: 3 },
            { label: "We have official rules and everyone follows them", value: 7 },
            { label: "We have a dedicated team that monitors AI safety constantly", value: 10 }
        ]
    },
    {
        id: 'op_1',
        category: 'operational',
        text: "How much do your employees know about using AI tools?",
        options: [
            { label: "Most have never used AI", value: 1 },
            { label: "Some have had basic training or used it a little", value: 4 },
            { label: "Many use it regularly and feel comfortable with it", value: 7 },
            { label: "Everyone is an expert and uses AI to be more productive", value: 10 }
        ]
    },
    {
        id: 'data_2',
        category: 'data',
        text: "Is your company's data kept clean, accurate, and up to date?",
        options: [
            { label: "Not really, it's often messy or outdated", value: 2 },
            { label: "It's decent, but requires a lot of manual cleanup", value: 5 },
            { label: "It's generally clean and reliable", value: 8 },
            { label: "Our data is high-quality and verified automatically", value: 10 }
        ]
    },
    {
        id: 'efficiency_1',
        category: 'operational',
        text: "How much time does your team spend on repetitive tasks (like data entry or emails)?",
        options: [
            { label: "Most of the day is spent on manual tasks", value: 1, feedback: "AI can automate 60%+ of these tasks for you." },
            { label: "A few hours a day", value: 5 },
            { label: "We've automated some, but still have manual work", value: 8 },
            { label: "Almost everything is automated; we focus on high-value work", value: 10 }
        ]
    },
    {
        id: 'customer_1',
        category: 'strategy',
        text: "How do you handle customer questions when you're busy or closed?",
        options: [
            { label: "Customers have to wait until we're back", value: 1, feedback: "You could be losing 24/7 lead opportunities." },
            { label: "We have basic auto-replies or FAQs", value: 4 },
            { label: "We use a simple chatbot", value: 7 },
            { label: "We have an AI assistant that handles most inquiries 24/7", value: 10 }
        ]
    },
    {
        id: 'security_2',
        category: 'governance',
        text: "How do you currently keep your client's information safe?",
        options: [
            { label: "We don't have a formal security plan", value: 1, feedback: "Security is non-negotiable for AI growth." },
            { label: "We use basic passwords and hope for the best", value: 4 },
            { label: "We have standard security (Firewalls, VPNs)", value: 8 },
            { label: "We use modern encryption and regular safety audits", value: 10 }
        ]
    },
    {
        id: 'value_1',
        category: 'technical',
        text: "If AI could save you 10+ hours a week, how would that impact your business?",
        options: [
            { label: "It wouldn't matter much", value: 1 },
            { label: "It would be nice, but not a game-changer", value: 4 },
            { label: "It would help us grow significantly", value: 9, feedback: "We can help you reach that target quickly." },
            { label: "It's essential for our survival and scale", value: 10, feedback: "Let's build your AI roadmap immediately." }
        ]
    }
];
