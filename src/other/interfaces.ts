type OpenAiModels = 'GPT-4o' | 'GPT-4o-mini';
type GeminiModels = 'gemini-exp-1206' | 'gemini-2.0-flash-exp' | 'gemini-1.5-flash';
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
    keywords: string[];
    rounds: number;
    dynamicRounds: boolean;
};

export type AgentResponse = {
    name: string;
    output: string;
    foundCriteriasCount: number;
    confidence: 'LOW' | 'MEDIUM' | 'HIGH';
};

export type ExtendedAgentResponse = {
    round: number;
    agentResponse: AgentResponse;
};

export type AgentDiscussion = {
    round: number;
    agentResponses: AgentResponse[];
};

export type MADLogChunk = {
    filePath: string;
    discussion: AgentDiscussion[];
};

export type MADLog = {
    timestamp: number;
    fileCount: number;
    codeLineCount: number;
    configuration: Omit<Configuration, 'apiKeys'>;
    madLogChunk: MADLogChunk[];
};

export type CodePrecheck = {
    fileCount: number;
    codeLineCount: number;
    filePaths: string[];
};

export type FileStreamResponse = {
    path: string;
    text: string;
    isLastText: boolean;
};
