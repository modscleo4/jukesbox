/**
 * Copyright 2020 Dhiego Cassiano Fogaça Barbosa

 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at

 *     http://www.apache.org/licenses/LICENSE-2.0

 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @file Bot Command Class
 *
 * @author Dhiego Cassiano Fogaça Barbosa <modscleo4@outlook.com>
 */

'use strict';

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
    /**
     * @type {Object<string, string>}
     */
    #description;

    /**
     * @type {string}
     */
    #usage;

    /**
     * @type {string[]}
     */
    #only;

    /**
     * @type {Permissions}
     */
    #botPermissions;

    /**
     * @type {Permissions}
     */
    #userPermissions;

    /**
     * @type {string[]}
     */
    #alias;

    /**
     * @type {Function}
     */
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

    get description() {
        return this.#description;
    }

    get usage() {
        return this.#usage;
    }

    get only() {
        return this.#only;
    }

    get botPermissions() {
        return this.#botPermissions;
    }

    get userPermissions() {
        return this.#userPermissions;
    }

    get alias() {
        return this.#alias;
    }

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
