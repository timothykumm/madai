type OpenAiModels = 'GPT-4o' | 'GPT-4o-mini';
type GeminiModels = 'gemini-exp-1206' | 'gemini-2.0-flash-exp' | 'gemini-1.5-flash';
type SuportedModels = OpenAiModels | GeminiModels;

export type Agent = {
    name: string;
    type: 'Debater' | 'Judge' | 'Summarizer';
    model: SuportedModels;
    role: 'assistant' | 'developer' | 'user';
    systemInstruction: string;
};

/**
 * Konfigurationsobjekt für die Anwendung.
 *
 * @typedef {Object} Configuration
 * @property {Object} apiKeys - API-Schlüssel für verschiedene Dienste.
 * @property {string} apiKeys.openAi - API-Schlüssel für OpenAI.
 * @property {string} apiKeys.google - API-Schlüssel für Google.
 * @property {Agent[]} agents - Liste der Agenten.
 * @property {string} task - Aufgabe, die ausgeführt werden soll.
 * @property {number} rounds - Anzahl der Runden.
 * @property {boolean} dynamicRounds - Gibt an, ob die Runden dynamisch sind.
 * @property {string} judgePrompt - Eingabeaufforderung für den Richter.
 * @property {boolean} summarizeAllClasses - Gibt an, ob alle Klassen zusammengefasst werden sollen.
 * @property {string} summarizerPrompt - Eingabeaufforderung für den Zusammenfasser.
 */
export type Configuration = {
    apiKeys: {
        openAi: string;
        google: string;
    };
    agents: Agent[];
    task: string;
    rounds: number;
    dynamicRounds: boolean;
    judgePrompt: string;
    summarizeAllClasses: boolean;
    summarizerPrompt: string;
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
    summary: string | null;
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
