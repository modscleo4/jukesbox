export default class Command {
    #description;
    #usage;
    #only;
    #alias;
    #fn;

    /**
     * @param {Object} params
     * @param {Object<string, string>} params.description Command description
     * @param {string} params.usage Example of how to use the command
     * @param {string[]?} params.only Who can use the command (null = @everyone)
     * @param {string[]?} params.alias Command aliases
     * @param {Function|Promise<*>} params.fn The function this command runs when called
     */
    constructor({description, usage, only = null, alias = [], fn}) {
        this.#description = description;
        this.#usage = usage;
        this.#only = only;
        this.#alias = alias;
        this.#fn = fn;
    }

    /**
     *
     * @return {Object<string, string>}
     */
    get description() {
        return this.#description;
    }

    /**
     *
     * @return {string}
     */
    get usage() {
        return this.#usage;
    }

    /**
     *
     * @return {string[]|null}
     */
    get only() {
        return this.#only;
    }

    /**
     *
     * @return {string[]}
     */
    get alias() {
        return this.#alias;
    }

    /**
     *
     * @return {Function|Promise<*>}
     */
    get fn() {
        return this.#fn;
    }
}