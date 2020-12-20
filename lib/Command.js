import Message from "./Message.js";
import InsufficientBotPermissionsError from "../errors/InsufficientBotPermissionsError.js";
import InsufficientUserPermissionsError from "../errors/InsufficientUserPermissionsError.js";

/**
 * @typedef {Object} Permissions
 * @property {string[]} [server=null] Guild permissions
 * @property {string[]} [text=null] Current Text Channel permissions
 * @property {string[]} [voice=null] Current Voice Channel permissions
 */

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
     * @param {string[]} [params.only=null] Who can use the command (null = everyone)
     * @param {Permissions} [params.botPermissions=null] The permissions required for the bot client
     * @param {Permissions} [params.userPermissions=null] The permissions required for the user
     * @param {string[]} [params.alias=[]] Command aliases
     * @param {Function} params.fn The function this command runs when called
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
     * @return {Permissions}
     */
    get botPermissions() {
        return this.#botPermissions;
    }

    /**
     *
     * @return {Permissions}
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
     * @return {Function}
     */
    get fn() {
        return this.#fn;
    }

    /**
     * 
     * @param {Message} message 
     * @return {Promise<*>}
     */
    async checkPermissions(message) {
        let missingPermission;

        // Check bot permissions
        if (this.botPermissions) {
            if (this.botPermissions.server) {
                const botServerPermissions = message.guild.me.permissions;
                if ((missingPermission = this.botPermissions.server.find(p => !botServerPermissions.has(p)))) {
                    throw new InsufficientBotPermissionsError(missingPermission);
                }
            }

            if (this.botPermissions.text) {
                const botTextPermissions = message.channel.permissionsFor(message.guild.me);
                if ((missingPermission = this.botPermissions.text.find(p => !botTextPermissions.has(p)))) {
                    throw new InsufficientBotPermissionsError(missingPermission);
                }
            }

            if (this.botPermissions.voice) {
                const botVoicePermissions = message.member.voice.channel.permissionsFor(message.guild.me);
                if ((missingPermission = this.botPermissions.voice.find(p => !botVoicePermissions.has(p)))) {
                    throw new InsufficientBotPermissionsError(missingPermission);
                }
            }
        }

        // Check user permissions
        if (this.userPermissions) {
            if (this.userPermissions.server) {
                const userServerPermissions = message.guild.member(message.author).permissions;
                if ((missingPermission = this.userPermissions.server.find(p => !userServerPermissions.has(p)))) {
                    throw new InsufficientUserPermissionsError(missingPermission);
                }
            }

            if (this.userPermissions.text) {
                const userTextPermissions = message.channel.permissionsFor(message.author);
                if ((missingPermission = this.userPermissions.text.find(p => !userTextPermissions.has(p)))) {
                    throw new InsufficientUserPermissionsError(missingPermission);
                }
            }

            if (this.userPermissions.voice) {
                const userVoicePermissions = message.member.voice.channel.permissionsFor(message.author);
                if ((missingPermission = this.userPermissions.voice.find(p => !userVoicePermissions.has(p)))) {
                    throw new InsufficientUserPermissionsError(missingPermission);
                }
            }
        }
    }
}
