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
        const keywords = this.configuration.keywords.join(',');
        let prompt: string | undefined; // Standardmäßiger Prompt für den ersten Agenten in der ersten Runde

        if (this.currentAgentIndex === 0 && this.currentRound === 1) {
            prompt = `Untersuche den dir vorliegenden Code ausschließlich auf die Aspekte [${keywords}]: "${this.fileStreamResponse.text}"`;
        } else if (agent.type === 'Debater') {
            prompt = `Zu diesem Code:\n"${
                this.fileStreamResponse.text
            }"\n\n gibt es bereits ein Ergebnis von einem anderen Softwareentwickler, der die Aspekte [${keywords}] beurteilt hat:\n\n${this.saveResponses
                .slice(-2)
                .join(
                    '\n\n'
                )}\n\n1. Untersuche den dir vorliegenden Code ausschließlich auf folgende Aspekte [${keywords}]\n 2. Diskutier mit dem anderen Softwareentwickler, falls ihr euch bei etwas uneinig seid`;
        } else if (agent.type === 'Judge') {
            if (this.saveResponses.length > 0) {
                prompt = `Zu diesem Code:\n"${
                    this.fileStreamResponse.text
                }"\n\n gab es von anderen Softwareentwicklern die folgende Diskussion, welche die Aspekte [${keywords}] beurteilt haben:\n\n${this.saveResponses
                    .slice(-2)
                    .join(
                        '\n\n'
                    )}\n\n1. Überprüfe und entscheide welche Erkenntnisse korrekt sind. Beziehe dich ausschließlich auf die Aspekte [${keywords}]\n2. Fasse diese zusammen"`;
            }
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

        // bei hoher Zuversicht die Debatte beenden
        if (agent.type === 'Judge' && this.configuration.dynamicRounds && agentResponse.confidence === 'HIGH') {
            return this.exit();
        }

        this.currentAgentIndex++;
    }

    exit = () => {
        this.push(null); // Ende des Streams
    };
}
