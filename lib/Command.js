export default class Command {
    #description;
    #usage;
    #only;
    #botPermissions;
    #userPermissions;
    #alias;
    #fn;

    /**
     * @param {Object} params
     * @param {Object<string, string>} params.description Command description
     * @param {string} params.usage Example of how to use the command
     * @param {string[]?} params.only Who can use the command (null = everyone)
     * @param {{server: string[]?, text: string[]?, voice: string[]?}} params.botPermissions The permissions required for the bot client
     * @param {{server: string[]?, text: string[]?, voice: string[]?}} params.userPermissions The permissions required for the user
     * @param {string[]?} params.alias Command aliases
     * @param {Function|Promise<*>} params.fn The function this command runs when called
     */
    constructor({description, usage, only = null, botPermissions = null, userPermissions = null, alias = [], fn}) {
        this.#description = description;
        this.#usage = usage;
        this.#only = only;
        this.#botPermissions = botPermissions;
        this.#userPermissions = userPermissions;
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
     * @return {{server: string[]?, text: string[]?, voice: string[]?}}
     */
    get botPermissions() {
        return this.#botPermissions;
    }

    /**
     *
     * @return {{server: string[]?, text: string[]?, voice: string[]?}}
     */
    get userPermissions() {
        return this.#userPermissions;
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
