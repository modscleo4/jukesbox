import {Client as BaseClient} from "discord.js";

export default class Client extends BaseClient {
    #commands = [];

    constructor(options) {
        super(options);
    }

    /**
     * @param {{description: String, only?: String[], fn: Function}[]} commands
     */
    loadCommands(commands) {
        this.#commands = commands;
    }

    get commands() {
        return this.#commands;
    }
}
