import {Client as BaseClient} from "discord.js";

export default class Client extends BaseClient {
    #categoriesCommands = {};
    #commands = {};

    constructor(options) {
        super(options);
    }

    /**
     * @param {{description: String, only?: String[], fn: Function}[]} commands
     */
    loadCommands(commands) {
        this.#categoriesCommands = commands;
        this.#commands = Object.keys(this.#categoriesCommands).map(k => this.#categoriesCommands[k]).reduce((a, m) => ({...a, ...m}), {});
    }

    get categoriesCommands() {
        return this.#categoriesCommands;
    }

    get commands() {
        return this.#commands;
    }
}
