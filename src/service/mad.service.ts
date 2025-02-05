import { Configuration } from '../other/interfaces';

export class MadService {
    constructor() {}

    /**
     * Validiert das gegebene Konfigurationsobjekt, um sicherzustellen, dass es die erforderlichen Kriterien erfüllt.
     *
     * @param configuration - Das zu validierende Konfigurationsobjekt.
     * @returns Ein boolescher Wert, der angibt, ob die Konfiguration gültig ist.
     *
     * Die Konfiguration gilt als gültig, wenn:
     * - Es mindestens 2 und höchstens 3 Agenten vom Typ 'Debater' gibt.
     * - Es genau 1 Agent vom Typ 'Judge' gibt.
     * - Die Anzahl der Runden zwischen 1 und 5 liegt (einschließlich).
     * - Der Google API-Schlüssel dem Muster '^[a-zA-Z0-9]{39}$' entspricht.
     * - Der OpenAI API-Schlüssel dem Muster '^sk-proj-[A-Za-z0-9_]+(-[A-Za-z0-9_]+)*$' entspricht.
     *
     * Wenn eine dieser Bedingungen nicht erfüllt ist, wird eine Fehlermeldung in die Konsole protokolliert und die Funktion gibt false zurück.
     */
    checkConfiguration = (configuration: Configuration) => {
        const debateAgents = configuration.agents.filter((agent) => agent.type === 'Debater');
        const judgeAgent = configuration.agents.filter((agent) => agent.type === 'Judge');

        if (debateAgents.length < 2 || debateAgents.length > 3) {
            console.error('Es müssen mindestens 2 und es dürfen maximal 3 Agenten miteinander diskutieren.');
            return false;
        }

        if (judgeAgent.length !== 1) {
            console.error('Es muss und darf nur ein Richter existieren.');
            return false;
        }

        if (configuration.rounds < 1 || configuration.rounds > 5) {
            console.error('Es muss mindestens 1 und es dürfen maximal 5 Diskussionsrunden existieren.');
            return false;
        }

        if (
            !configuration.apiKeys.google.match('^[a-zA-Z0-9]{39}$') ||
            !configuration.apiKeys.openAi.match('^sk-proj-[A-Za-z0-9_]+(-[A-Za-z0-9_]+)*$')
        ) {
            console.error('API Keys stimmen nicht.');
            return false;
        }

        return true;
    };
}
