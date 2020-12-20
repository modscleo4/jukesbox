import {Message} from "discord.js";

import InsufficientBotPermissionsError from "../errors/InsufficientBotPermissionsError.js";
import InsufficientUserPermissionsError from "../errors/InsufficientUserPermissionsError.js";

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
                const userServerPermissions = message.author.permissions;
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
