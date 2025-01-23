import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Agent, AgentResponse } from '../other/interfaces';

export class AgentService {
    private openai: OpenAI;
    private genAI: GoogleGenerativeAI;

    constructor(apiKeys: { openAi: string; google: string }) {
        this.openai = new OpenAI({ apiKey: apiKeys.openAi });
        this.genAI = new GoogleGenerativeAI(apiKeys.google);
    }

    askAgent = async (agent: Agent, code: string) => {
        await new Promise((resolve) => setTimeout(resolve, 1000));

        switch (agent.model as string) {
            case 'GPT-4o':
            case 'GPT-4o-mini':
                const completion = await this.openai.chat.completions.create({
                    model: agent.model as string,
                    messages: [
                        { role: agent.role, content: agent.systemInstruction },
                        {
                            role: 'user',
                            content: code,
                        },
                    ],
                });

                return completion.choices[0].message.content;

            case 'gemini-exp-1206':
            case 'gemini-2.0-flash-exp':
            case 'gemini-1.5-flash':
                const model = this.genAI.getGenerativeModel({
                    model: agent.model as string,
                    systemInstruction: { role: agent.role, parts: [{ text: agent.systemInstruction }] },
                });
                const prompt = code;

                const result = await model.generateContent(prompt);
                return result.response.text();

            default:
                throw new Error(`Model ${agent.model} not supported`);
        }
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
