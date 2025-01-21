import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Agent } from '../other/interfaces';

export class AgentService {
    private openai: OpenAI;
    private genAI: GoogleGenerativeAI;

    constructor(apiKeys: { openAi: string; google: string }) {
        this.openai = new OpenAI({ apiKey: apiKeys.openAi });
        this.genAI = new GoogleGenerativeAI(apiKeys.google);
    }

    askAgent = async (agent: Agent, summarizedConversation: string) => {
        await new Promise((resolve) => setTimeout(resolve, 1000));

        /*switch (agent.model as string) {
            case 'GPT-4o':
            case 'GPT-4o-mini':
                const completion = await this.openai.chat.completions.create({
                    model: agent.model as string,
                    messages: [
                        { role: agent.role, content: agent.systemInstruction },
                        {
                            role: 'user',
                            content: summarizedConversation,
                        },
                    ],
                });

                return completion.choices[0].message.content;

            case 'gemini-exp-1206':
            case 'gemini-2.0-flash-exp':
                const model = this.genAI.getGenerativeModel({ model: agent.model as string, systemInstruction: { role: agent.role, parts: [{ text: agent.systemInstruction }] } });
                const prompt = summarizedConversation;

                const result = await model.generateContent(prompt);
                return result.response.text();
        }*/
        return `${agent.name as string} hat die Konversation gelesen -> ${summarizedConversation}\n`;
    };
}
