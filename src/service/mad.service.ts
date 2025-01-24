import { Configuration } from '../other/interfaces';

export class MadService {
    constructor() {}

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
