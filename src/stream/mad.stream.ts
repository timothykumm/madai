import { Readable } from 'stream';
import { AgentResponse, Configuration, ExtendedAgentResponse, FileStreamResponse } from '../other/interfaces';
import { AgentService } from '../service/agent.service';

export class MadStream extends Readable {
    private agentService: AgentService;
    private configuration: Configuration;
    private fileStreamResponse: FileStreamResponse;
    private maxRounds = 3;
    private currentRound = 1;
    private currentAgentIndex = 0;
    private saveResponses: string[] = [];

    constructor(configuration: Configuration, fileStreamResponse: FileStreamResponse) {
        super();
        this.agentService = new AgentService(configuration.apiKeys);
        this.configuration = configuration;
        this.fileStreamResponse = fileStreamResponse;
    }

    async _read() {
        if (this.currentAgentIndex >= this.configuration.agents.length) {
            this.currentAgentIndex = 0;
            this.currentRound++;
        }

        if (this.currentRound > this.maxRounds || this.currentRound > this.configuration.rounds) {
            return this.exit();
        }

        const agent = this.configuration.agents[this.currentAgentIndex];
        const task = this.configuration.task;
        let prompt: string | undefined;

        if (this.currentAgentIndex === 0 && this.currentRound === 1) {
            // Standardmäßiger Prompt für den ersten Agenten (Debattierer) in der ersten Runde
            prompt = `Untersuche den Code: "${this.fileStreamResponse.text}"\n\n Deine Aufgabe ist ausschließlich: "${task}"`;
        } else if (agent.type === 'Debater') {
            // Standardmäßiger Prompt für alle Debatterienden
            prompt = `Zu diesem Code:\n"${
                this.fileStreamResponse.text
            }"\n\nhatte ein anderer Softwareentwickler ausschließlich die Aufgabe "${task}" und kam zu dem folgenden Ergebnis:\n\n${this.saveResponses
                .slice(-1)
                .join(
                    '\n\n'
                )}\n\n1. Untersuche den vorliegenden Code und erfülle ausschließlich die Aufgabe "${task}"\n2. Diskutiere mit dem anderen Softwareentwickler, falls ihr euch bei etwas uneinig seid`;
        } else if (agent.type === 'Judge') {
            // Standardmäßiger Prompt für alle Richter
            prompt = `Zu diesem Code:\n"${
                this.fileStreamResponse.text
            }"\n\n gab es von anderen Softwareentwicklern die folgenden Sichtweisen:\n\n${this.saveResponses
                .slice(-2)
                .join('\n\n')}\n\n1. Entscheide welche Erkenntnisse korrekt sind und Fasse diese zusammen"`;
        }

        if (!prompt) {
            console.error('Eigentlich sollten alle Entscheidungsfade abgedeckt sein, sodass prompt nicht undefined sein kann');
            return this.exit();
        }

        const response = await this.agentService.askAgent(agent, prompt);

        if (!response) {
            return this.exit();
        }
        this.saveResponses.push(response);

        const agentResponse: AgentResponse = this.agentService.responseToObject(agent.name, response);
        const extendedAgentResponse: ExtendedAgentResponse = { agentResponse, round: this.currentRound };

        const outputBuffer = Buffer.from(JSON.stringify(extendedAgentResponse));
        this.push(outputBuffer);

        // bei hoher Zuversicht (confidence) die Debatte beenden
        if (agent.type === 'Judge' && this.configuration.dynamicRounds && agentResponse.confidence === 'HIGH') {
            return this.exit();
        }

        this.currentAgentIndex++;
    }

    exit = () => {
        this.push(null); // Stream beenden
    };
}
