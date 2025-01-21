import { Readable } from 'stream';
import { Agent, Configuration } from '../other/interfaces';
import { AgentService } from '../service/agent.service';

export class MadStream extends Readable {
    private agentService: AgentService;
    private agents: Agent[] = [];
    private rounds: number = 0;
    private summarizedConversation: string;
    private maxRounds = 3;
    private currentRound = 1;
    private currentAgentIndex = 0;

    constructor(configuration: Configuration, summarizedConversation: string) {
        super();
        this.agentService = new AgentService(configuration.apiKeys);
        this.agents = configuration.agents;
        this.rounds = configuration.rounds;
        this.summarizedConversation = summarizedConversation;
    }

    async _read() {
        if (this.currentRound > this.maxRounds || this.currentRound > this.rounds) {
            this.push(null); // Ende des Streams
            return;
        }

        if (this.currentAgentIndex >= this.agents.length) {
            this.currentAgentIndex = 0;
            this.currentRound++;
        }

        if (this.currentRound > this.maxRounds || this.currentRound > this.rounds) {
            this.push(null);
            return;
        }

        const agent = this.agents[this.currentAgentIndex];
        const response = await this.agentService.askAgent(agent, this.summarizedConversation); // Frage hier ggf. anpassen
        this.push(`Runde: ${this.currentRound} ${response}`);

        this.currentAgentIndex++;
    }
}
