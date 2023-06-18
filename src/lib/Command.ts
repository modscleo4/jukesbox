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

import InsufficientBotPermissionsError from "../errors/InsufficientBotPermissionsError.js";
import InsufficientUserPermissionsError from "../errors/InsufficientUserPermissionsError.js";
import NoVoiceChannelError from "../errors/NoVoiceChannelError.js";
import SameVoiceChannelError from "../errors/SameVoiceChannelError.js";
import FullVoiceChannelError from "../errors/FullVoiceChannelError.js";
import { options } from "../config.js";
import DB from "./DB.js";
import { Guild, GuildMember, Message, EmbedData, BaseMessageOptions, MessageReaction, PermissionsString, TextChannel, User, APIEmbed } from "discord.js";
import Client from "./Client.js";
import { langs } from "src/lang/lang.js";


export type Permissions = {
    server?: PermissionsString[];
    text?: PermissionsString[];
    voice?: PermissionsString[];
};

export enum OptionType {
    SUB_COMMAND = 1,
    SUB_COMMAND_GROUP = 2,
    STRING = 3,
    INTEGER = 4,
    BOOLEAN = 5,
    USER = 6,
    CHANNEL = 7,
    ROLE = 8,
};

export type Option = {
    type: OptionType;
    name: string;
    description: string;
    required?: boolean;
    choices?: { name: string, value: string | number; }[];
    options?: Option[];
};

export type CommandReturnOptions = {
    content?: string;
    embeds?: APIEmbed[];
    lockAuthor?: boolean;
    reactions?: string[];
    onReact?: (params: { reaction: MessageReaction, user: User, message: Message<boolean>, add: boolean, stop: () => void; }) => Promise<void>;
    onEndReact?: (params: { message: Message<boolean>; }) => Promise<void>;
    deleteOnEnd?: boolean;
    timer?: number;
    deleteAfter?: number;
};

export type CommandReturn = BaseMessageOptions | CommandReturnOptions;
export type SendMessageFn = (msgData: CommandReturn) => Promise<Message | null>;
export type CommandContext = { client: Client, guild: Guild, channel: TextChannel, author: User, member: GuildMember, sendMessage: SendMessageFn; };
export type CommandFunction = (message: CommandContext, args: string[]) => Promise<CommandReturn>;

/**
 * Command Class
 */
export default abstract class Command {
    #description: Record<keyof typeof langs, string>;
    #options: Option[];
    #deleteUserMessage: boolean;
    #only: string[];
    #botPermissions: Permissions;
    #userPermissions: Permissions;
    #aliases: string[];

    constructor({ description, options = [], deleteUserMessage = false, only = [], botPermissions = {}, userPermissions = {}, aliases = [] }: { description: Record<keyof typeof langs, string>; options?: Option[]; deleteUserMessage?: boolean; only?: string[]; botPermissions?: Permissions; userPermissions?: Permissions; aliases?: string[]; }) {
        this.#description = description;
        this.#options = options;
        this.#deleteUserMessage = deleteUserMessage;
        this.#only = only;
        this.#botPermissions = botPermissions;
        this.#userPermissions = userPermissions;
        this.#aliases = aliases;
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

    abstract fn(message: { client: Client, guild: Guild, channel: TextChannel, author: User, member: GuildMember, sendMessage: SendMessageFn; }, args: any[]): Promise<CommandReturn>;

    async checkPermissions({ guild, channel, author, member }: { guild: Guild; channel: TextChannel; author: User; member: GuildMember; }): Promise<any> {
        let missingPermission;

        // Check bot permissions
        if (this.botPermissions) {
            if (this.botPermissions.server) {
                const botServerPermissions = guild.members.me!.permissions!;
                if ((missingPermission = this.botPermissions.server.find(p => !botServerPermissions.has(p)))) {
                    throw new InsufficientBotPermissionsError(missingPermission);
                }
            }

            if (this.botPermissions.text) {
                const botTextPermissions = channel.permissionsFor(guild.members.me!)!;
                if ((missingPermission = this.botPermissions.text.find(p => !botTextPermissions.has(p)))) {
                    throw new InsufficientBotPermissionsError(missingPermission);
                }
            }

            if (this.botPermissions.voice) {
                const botVoicePermissions = member?.voice.channel?.permissionsFor(guild.members.me!)!;
                if ((missingPermission = this.botPermissions.voice.find(p => !botVoicePermissions.has(p)))) {
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

    async checkVoiceChannel({ guild, member }: { guild: Guild, member: GuildMember; }) {
        if (!member?.voice.channel) {
            throw new NoVoiceChannelError();
        }

        if (guild.members.me?.voice.channel && !guild.members.me?.voice.channel.members.find(m => m === member)) {
            throw new SameVoiceChannelError();
        }

        if (!member.voice.channel.members.find(m => m === guild.members.me) && member?.voice.channel?.userLimit && member?.voice.channel?.members.size === member?.voice.channel?.userLimit && !guild.members.me?.permissions.has("MoveMembers")) {
            throw new FullVoiceChannelError();
        }
    }

    static async logUsage(command: string) {
        const db = new DB(options.database_url);

        await db.query('UPDATE command_stats SET used = used + 1 WHERE command = $1', [command]);
        await db.query('INSERT INTO command_stats (command, used) SELECT $1, 1 WHERE NOT EXISTS (SELECT 1 FROM command_stats WHERE command = $2)', [command, command]);

        await db.close();
    }
}
