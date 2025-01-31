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

    getLastAgentResponses(logChunks: MADLogChunk[]): AgentResponse[] {
        return logChunks
            .map((chunk) => {
                // Letzte Diskussion holen
                const lastDiscussion = chunk.discussion.at(-1);
                if (!lastDiscussion) {
                    return null;
                }

                // Letzte AgentResponse aus der Diskussion holen
                const lastAgentResponse = lastDiscussion.agentResponses.at(-1);
                return lastAgentResponse || null;
            })
            .filter((response): response is AgentResponse => response !== null); // Null-Werte entfernen
    }

    filterAndSortAgents = (agents: Agent[]) => {
        const debater = agents.filter((agent) => agent.type === 'Debater');
        const judge = agents.filter((agent) => agent.type === 'Judge');

        return [...debater, ...judge];
    };

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
