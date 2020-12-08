import {Client as BaseClient} from "discord.js";

export default class Client extends BaseClient {
    #categoriesCommands = {};
    #commands = {};
    #aliases = {};

    constructor(options) {
        super(options);
    }

    /**
     *
     * @param {Object<string, Object<string, Command>>} categoriesCommands
     */
    loadCommands(categoriesCommands) {
        this.#categoriesCommands = categoriesCommands;
        this.#commands = Object.keys(this.#categoriesCommands).map(k => this.#categoriesCommands[k]).reduce((a, m) => ({...a, ...m}), {});
        this.#aliases = Object.keys(this.#commands).filter(k => this.#commands[k].alias.length > 0).map(k => ({
            command: k,
            alias: this.#commands[k].alias
        })).reduce((a, {
            command,
            alias
        }) => ({...a, ...(alias.map(a => ({[a]: command}))).reduce((a, mm) => ({...a, ...mm}), {})}), {});
    }

    /**
     *
     * @return {Object<string, Object<string, Command>>}
     */
    get categoriesCommands() {
        return this.#categoriesCommands;
    }

    /**
     *
     * @return {Object<string, Command>}
     */
    get commands() {
        return this.#commands;
    }

    /**
     *
     * @return {Object<string, string>}
     */
    get aliases() {
        return this.#aliases;
    }
}
