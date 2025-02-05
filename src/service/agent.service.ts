import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Agent, AgentResponse, MADLogChunk } from '../other/interfaces';

export class AgentService {
    private openai: OpenAI;
    private genAI: GoogleGenerativeAI;

    constructor(apiKeys: { openAi: string; google: string }) {
        this.openai = new OpenAI({ apiKey: apiKeys.openAi });
        this.genAI = new GoogleGenerativeAI(apiKeys.google);
    }

    /**
     * Stellt eine Frage an den angegebenen Agenten und gibt die Antwort zurück.
     *
     * @param agent - Der Agent, dem die Frage gestellt werden soll. Das Agent-Objekt sollte die Eigenschaften model und role enthalten.
     * @param prompt - Die Eingabeaufforderung oder Frage, die dem Agenten gestellt werden soll.
     * @returns Ein Promise, das die Antwort des Agenten als Zeichenkette auflöst.
     * @throws Ein Fehler, wenn das Modell des Agenten nicht unterstützt wird.
     *
     * Die Funktion unterstützt verschiedene Modelle:
     * - Für 'GPT-4o' und 'GPT-4o-mini' wird die OpenAI-API verwendet, um die Antwort zu erhalten.
     * - Für 'gemini-exp-1206', 'gemini-2.0-flash-exp', 'gemini-2.0-flash-thinking-exp-01-21' und 'gemini-1.5-flash' wird die GenAI-API verwendet, um die Antwort zu erhalten.
     */
    askAgent = async (agent: Agent, prompt: string) => {
        switch (agent.model as string) {
            case 'GPT-4o':
            case 'GPT-4o-mini':
                const completion = await this.openai.chat.completions.create({
                    model: agent.model as string,
                    messages: [
                        { role: agent.role, content: agent.systemInstruction },
                        {
                            role: 'user',
                            content: prompt,
                        },
                    ],
                });

                return completion.choices[0].message.content;

            case 'gemini-exp-1206':
            case 'gemini-2.0-flash-exp':
            case 'gemini-2.0-flash-thinking-exp-01-21':
            case 'gemini-1.5-flash':
                const model = this.genAI.getGenerativeModel({
                    model: agent.model as string,
                    systemInstruction: { role: agent.role, parts: [{ text: agent.systemInstruction }] },
                });

                const result = await model.generateContent(prompt);
                return result.response.text();

            default:
                throw new Error(`Model ${agent.model} not supported`);
        }
    };

    /**
     * Ruft die letzten Agentenantworten aus einem Array von Log-Chunks ab.
     *
     * @param logChunks - Ein Array von MADLogChunk-Objekten, die die Log-Daten darstellen.
     * @returns Ein Array von AgentResponse-Objekten, die die letzten Agentenantworten aus jedem Log-Chunk enthalten.
     */
    getLastAgentResponses(logChunks: MADLogChunk[]): AgentResponse[] {
        return logChunks
            .map((chunk) => {
                const lastDiscussion = chunk.discussion.at(-1);
                if (!lastDiscussion) {
                    return null;
                }

                const lastAgentResponse = lastDiscussion.agentResponses.at(-1);
                return lastAgentResponse || null;
            })
            .filter((response): response is AgentResponse => response !== null);
    }

    /**
     * Filtert und sortiert ein Array von Agenten nach ihrem Typ.
     *
     * @param agents - Ein Array von Agent-Objekten, die gefiltert und sortiert werden sollen.
     * @returns Ein Array von Agenten, wobei zuerst die 'Debater' und dann die 'Judge' Agenten erscheinen.
     */
    filterAndSortAgents = (agents: Agent[]): Agent[] => {
        const debater = agents.filter((agent) => agent.type === 'Debater');
        const judge = agents.filter((agent) => agent.type === 'Judge');

        return [...debater, ...judge];
    };

    /**
     * Converts the output string from an agent into an AgentResponse object.
     *
     * This function attempts to extract a JSON block from the provided output string,
     * parse it, and return it as an AgentResponse object. If no JSON block is found
     * or if an error occurs during parsing, a fallback AgentResponse object is returned
     * with default values.
     *
     * @param agentName - The name of the agent.
     * @param output - The output string from the agent which may contain a JSON block.
     * @returns An AgentResponse object containing the parsed data or fallback values.
     */
    responseToObject = (agentName: string, output: string): AgentResponse => {
        try {
            const jsonMatch = output.match(/{[\s\S]*}/);
            if (jsonMatch) {
                const jsonBlock = jsonMatch[0];
                // Parsen des JSON-Blocks
                const agentResponse = JSON.parse(jsonBlock) as AgentResponse;
                return { ...agentResponse, name: agentName };
            }

            console.error('No JSON block found');
        } catch (error) {
            console.error('Error parsing JSON block:', error);
        }

        // Fallback wenn kein JSON gefunden wird
        return { name: agentName, output, confidence: 'LOW', foundCriteriasCount: -1 };
    };
}
