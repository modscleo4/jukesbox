export default class Command {
    #description;
    #usage;
    #only;
    #alias;
    #fn;

    /**
     * @param {object} params
     * @param {string} params.description Command description
     * @param {string} params.usage Example of how to use the command
     * @param {string[]?} params.only Who can use the command (null = @everyone)
     * @param {string[]} params.alias Command aliases
     * @param {Function|Promise<*>} params.fn The function this command runs when called
     */
    constructor({description, usage, only = null, alias = [], fn}) {
        this.#description = description;
        this.#usage = usage;
        this.#only = only;
        this.#alias = alias;
        this.#fn = fn;
    }

    get description() {
        return this.#description;
    }

    get usage() {
        return this.#usage;
    }

    get only() {
        return this.#only;
    }

    get alias() {
        return this.#alias;
    }

    get fn() {
        return this.#fn;
    }
}