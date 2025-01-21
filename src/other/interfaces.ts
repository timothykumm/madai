type OpenAiModels = 'GPT-4o' | 'GPT-4o-mini';
type GeminiModels = 'gemini-exp-1206' | 'gemini-2.0-flash-exp';
type SuportedModels = OpenAiModels | GeminiModels;

export type Agent = {
    name: string;
    type: 'Debater' | 'Judge';
    model: SuportedModels;
    role: 'assistant' | 'developer' | 'user';
    systemInstruction: string;
};

export type Configuration = {
    apiKeys: {
        openAi: string;
        google: string;
    };
    agents: Agent[];
    rounds: number;
};

export type CodePrecheck = { fileCount: number; codeLineCount: number; filePaths: string[] };
