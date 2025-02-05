import { Readable } from 'stream';
import { Agent, AgentResponse, Configuration, ExtendedAgentResponse, FileStreamResponse } from '../other/interfaces';
import { AgentService } from '../service/agent.service';

export class MadStream extends Readable {
    private agentService: AgentService;
    private configuration: Configuration;
    private fileStreamResponse: FileStreamResponse;
    private maxRounds = 3;
    private currentRound = 1;
    private currentAgentIndex = 0;
    private saveResponses: string[] = [];
    private filteredAgents: Agent[] = [];

    constructor(agentService: AgentService, configuration: Configuration, fileStreamResponse: FileStreamResponse) {
        super();
        this.agentService = agentService;
        this.configuration = configuration;
        this.fileStreamResponse = fileStreamResponse;

        this.filteredAgents = agentService.filterAndSortAgents(configuration.agents);
    }

    /**
     * Liest und verarbeitet asynchron die nächste Aufgabe des Agenten in der Debattenrunde.
     *
     * Diese Methode behandelt Folgendes:
     * - Setzt den Agentenindex zurück und erhöht die Runde, wenn alle Agenten verarbeitet wurden.
     * - Beendet die Debatte, wenn die maximale Anzahl an Runden überschritten wird.
     * - Erstellt einen Prompt basierend auf dem Agententyp und der aktuellen Runde.
     * - Sendet den Prompt an den Agentendienst und wartet auf eine Antwort.
     * - Speichert die Antwort des Agenten und schiebt sie in den Ausgabepuffer.
     * - Beendet die Debatte frühzeitig, wenn ein Richter-Agent hohe Zuversicht hat und dynamische Runden aktiviert sind.
     *
     * @returns {Promise<void>} Ein Promise, das aufgelöst wird, wenn der Lesevorgang abgeschlossen ist.
     * @throws Loggt einen Fehler und beendet die Debatte, wenn der Prompt undefiniert ist.
     */
    async _read() {
        if (this.currentAgentIndex >= this.filteredAgents.length) {
            this.currentAgentIndex = 0;
            this.currentRound++;
        }

        if (this.currentRound > this.maxRounds || this.currentRound > this.configuration.rounds) {
            return this.exit();
        }

        const agent = this.filteredAgents[this.currentAgentIndex];
        const task = this.configuration.task;
        let prompt: string | undefined;

        if (this.currentAgentIndex === 0 && this.currentRound === 1) {
            // Standardmäßiger Prompt für den ersten Agenten (Debattierer) in der ersten Runde
            prompt = `Untersuche den Code: "${this.fileStreamResponse.text}". Deine Aufgabe ist ausschließlich: "${task}".`;
        } else if (agent.type === 'Debater') {
            // Standardmäßiger Prompt für alle Debatterienden
            prompt = `Zu diesem Code: "${
                this.fileStreamResponse.text
            }" hatte ein anderer Softwareentwickler ausschließlich die Aufgabe "${task}" und kam zu dem folgenden Ergebnis: "${this.saveResponses
                .slice(-1)
                .join()}". 1. Untersuche den vorliegenden Code und erfülle ausschließlich die Aufgabe "${task}"\n2. Diskutiere mit dem anderen Softwareentwickler, falls ihr euch bei etwas uneinig seid`;
        } else if (agent.type === 'Judge') {
            // Standardmäßiger Prompt für alle Richter
            prompt = `Zu diesem Code: "${
                this.fileStreamResponse.text
            }" gab es von anderen Softwareentwicklern die folgenden Sichtweisen: "${this.saveResponses.slice(-2).join('\n" und "\n')}". ${
                this.configuration.judgePrompt
            }."`;
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
