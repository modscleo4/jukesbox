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
import NoVoiceChannelError from "../errors/NoVoiceChannelError.js";
import SameVoiceChannelError from "../errors/SameVoiceChannelError.js";
import FullVoiceChannelError from "../errors/FullVoiceChannelError.js";
import {options} from "../config.js";
import DB from "./DB.js";

/**
 * @typedef {Object} Permissions
 * @property {import('discord.js').PermissionString[]} [server=null] Guild permissions
 * @property {import('discord.js').PermissionString[]} [text=null] Current Text Channel permissions
 * @property {import('discord.js').PermissionString[]} [voice=null] Current Voice Channel permissions
 */

/**
 * @enum {number}
 *
 */
export const OptionType = {
    SUB_COMMAND: 1,
    SUB_COMMAND_GROUP: 2,
    STRING: 3,
    INTEGER: 4,
    BOOLEAN: 5,
    USER: 6,
    CHANNEL: 7,
    ROLE: 8,
};

/**
 * @typedef {Object} Option
 * @property {OptionType} type Option Type
 * @property {string} name Option Name
 * @property {string} description Option Description
 * @property {boolean} [required=false] If the Option is required or not
 * @property {{name: string, value: string|number}[]} [choices=[]] Possible Option Choices
 * @property {Option[]} [options=null] Nested Options
 */

/**
 * @typedef {Object} CommandReturnOptions
 * @property {import('discord.js').MessageEmbed[]?} [embeds]
 * @property {boolean?} [lockAuthor]
 * @property {string[]?} [reactions]
 * @property {Function?} [onReact]
 * @property {Function?} [onEndReact]
 * @property {boolean?} [deleteOnEnd]
 * @property {number?} [timer]
 * @property {number?} [deleteAfter]
 */

/**
 * @typedef {(import('discord.js').MessageOptions|CommandReturnOptions)} CommandReturn
 */

/**
 * @callback SendMessageFn
 * @param {CommandReturn} msgData
 * @return {Promise<import('discord.js').Message|null>}
 */

/**
 * @callback CommandFunction
 * @param {{client: import('./Client.js').default, guild: import('discord.js').Guild, channel: import('discord.js').TextChannel, author: import('discord.js').User, member: import('discord.js').GuildMember, sendMessage: SendMessage}} message
 * @param {string[]} args
 * @return {Promise<CommandReturn>}
 * @throws {InsufficientBotPermissionsError}
 * @throws {InsufficientUserPermissionsError}
 * @throws {NoVoiceChannelError}
 */

/**
 * Command Class
 */
export default class Command {
    /**
     * @type {Object<string, string>}
     */
    #description;

    /**
     * @type {Option[]}
     */
    #options;

    /**
     * @type {boolean}
     */
    #deleteUserMessage;

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
    #aliases;

    /**
     * @type {CommandFunction}
     */
    #fn;

    /**
     * @param {Object} params
     * @param {Object<string, string>} params.description Command description
     * @param {Option[]} [params.options=[]] Command Options
     * @param {boolean} [params.deleteUserMessage=false] Delete User Message
     * @param {string[]} [params.only=null] Who can use the command (null = everyone)
     * @param {Permissions} [params.botPermissions=null] The permissions required for the bot client
     * @param {Permissions} [params.userPermissions=null] The permissions required for the user
     * @param {string[]} [params.aliases=[]] Command aliases
     * @param {CommandFunction} params.fn The function this command runs when called
     */
    constructor({description, options = [], deleteUserMessage = false, only = null, botPermissions = null, userPermissions = null, aliases = [], fn}) {
        this.#description = description;
        this.#options = options;
        this.#deleteUserMessage = deleteUserMessage;
        this.#only = only;
        this.#botPermissions = botPermissions;
        this.#userPermissions = userPermissions;
        this.#aliases = aliases;
        this.#fn = fn;
    }

    get description() {
        return this.#description;
    }

    get options() {
        return this.#options;
    }

    get deleteUserMessage() {
        return this.#deleteUserMessage;
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

    get aliases() {
        return this.#aliases;
    }

    get fn() {
        return this.#fn;
    }

    /**
     *
     * @param {Object} message
     * @param {import('discord.js').Guild} message.guild
     * @param {import('discord.js').TextChannel} message.channel
     * @param {import('discord.js').User} message.author
     * @param {import('discord.js').GuildMember} message.member
     * @return {Promise<*>}
     */
    async checkPermissions({guild, channel, author, member}) {
        let missingPermission;

        // Check bot permissions
        if (this.botPermissions) {
            if (this.botPermissions.server) {
                const botServerPermissions = guild.me?.permissions;
                if ((missingPermission = this.botPermissions.server.find(p => !botServerPermissions.has(p)))) {
                    throw new InsufficientBotPermissionsError(missingPermission);
                }
            }

            if (this.botPermissions.text) {
                const botTextPermissions = channel.permissionsFor(guild.me);
                if ((missingPermission = this.botPermissions.text.find(p => !botTextPermissions?.has(p)))) {
                    throw new InsufficientBotPermissionsError(missingPermission);
                }
            }

            if (this.botPermissions.voice) {
                const botVoicePermissions = member?.voice.channel?.permissionsFor(guild.me);
                if ((missingPermission = this.botPermissions.voice.find(p => !botVoicePermissions?.has(p)))) {
                    throw new InsufficientBotPermissionsError(missingPermission);
                }
            }
        }

        // Check user permissions
        if (this.userPermissions) {
            // Ignore user permissions if the user is Admin
            if (options.ignorePermissionsForAdmin && author.id === options.adminID) {
                return true;
            }

            if (this.userPermissions.server) {
                const userServerPermissions = member?.permissions;
                if ((missingPermission = this.userPermissions.server.find(p => !userServerPermissions?.has(p)))) {
                    throw new InsufficientUserPermissionsError(missingPermission);
                }
            }

            if (this.userPermissions.text) {
                const userTextPermissions = channel.permissionsFor(author);
                if ((missingPermission = this.userPermissions.text.find(p => !userTextPermissions?.has(p)))) {
                    throw new InsufficientUserPermissionsError(missingPermission);
                }
            }

            if (this.userPermissions.voice) {
                const userVoicePermissions = member?.voice.channel?.permissionsFor(author);
                if ((missingPermission = this.userPermissions.voice.find(p => !userVoicePermissions?.has(p)))) {
                    throw new InsufficientUserPermissionsError(missingPermission);
                }
            }
        }
    }

    /**
     *
     * @param {Object} message
     * @param {import('discord.js').Guild} message.guild
     * @param {import('discord.js').GuildMember} message.member
     */
    async checkVoiceChannel({guild, member}) {
        if (!member?.voice.channel) {
            throw new NoVoiceChannelError();
        }

        if (guild.me?.voice.channel && !guild.me?.voice.channel.members.find(m => m === member)) {
            throw new SameVoiceChannelError();
        }

        if (!member.voice.channel.members.find(m => m === guild.me) && member?.voice.channel?.userLimit && member?.voice.channel?.members.size === member?.voice.channel?.userLimit && !guild.me.hasPermission("MOVE_MEMBERS")) {
            throw new FullVoiceChannelError();
        }
    }

    /**
     *
     * @param {string} command
     */
    static async logUsage(command) {
        const db = new DB(options.database_url);

        await db.query('UPDATE command_stats SET used = used + 1 WHERE command = $1', [command]);
        await db.query('INSERT INTO command_stats (command, used) SELECT $1, 1 WHERE NOT EXISTS (SELECT 1 FROM command_stats WHERE command = $2)', [command, command]);

        await db.close();
    }
}
