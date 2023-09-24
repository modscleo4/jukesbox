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
 * @file Server Configuration Class
 *
 * @author Dhiego Cassiano Fogaça Barbosa <modscleo4@outlook.com>
 */

'use strict';

import { langs } from "../lang/lang.js";
import { prisma } from "./prisma.js";

export default class ServerConfig {
    #id: bigint;
    #guild: string;
    #prefix: string;
    #volume: number;
    #lang: keyof typeof langs;
    #telemetryLevel: number;
    #channelDenies: { [s: string]: Set<string>; };
    #dirty: boolean;
    #channelDeniesDirty: boolean;

    constructor({ id = -1n, guild, prefix = '.', volume = 100, lang = 'pt_BR', telemetry_level = 1, channelDenies = {} }: { id?: bigint; guild: string; prefix?: string; volume?: number; lang?: keyof typeof langs; telemetry_level?: number; channelDenies?: { [s: string]: Set<string>; }; }) {
        this.#id = id;
        this.#guild = guild;
        this.#prefix = prefix;
        this.#volume = volume;
        this.#lang = lang;
        this.#telemetryLevel = telemetry_level;
        this.#channelDenies = channelDenies;

        this.#dirty = false;
        this.#channelDeniesDirty = false;
    }

    /**
     *
     * @param {string} database_url
     * @return {Promise<void>}
     */
    async save(database_url: string): Promise<void> {
        if (this.#id) {
            if (this.#dirty) {
                await prisma.serverConfig.update({
                    where: {
                        id: this.#id,
                    },
                    data: {
                        prefix: this.#prefix,
                        volume: this.#volume,
                        lang: this.#lang,
                        telemetryLevel: this.#telemetryLevel,
                    }
                });
            }

            if (this.#channelDeniesDirty) {
                for (const channel in this.#channelDenies) {
                    await prisma.channelDeny.deleteMany({
                        where: {
                            serverConfigId: this.#id,
                        }
                    });

                    await prisma.channelDeny.createMany({
                        data: Array.from(this.#channelDenies[channel]).map(command => ({
                            serverConfigId: this.#id,
                            channel,
                            command,
                        })),
                    });
                }
            }
        } else {
            this.#id = (await prisma.serverConfig.create({
                data: {
                    guild: this.#guild,
                    prefix: this.#prefix,
                    volume: this.#volume,
                    lang: this.#lang,
                    telemetryLevel: this.#telemetryLevel,
                }
            })).id;

            for (const channel in this.#channelDenies) {
                await prisma.channelDeny.createMany({
                    data: Array.from(this.#channelDenies[channel]).map(command => ({
                        serverConfigId: this.#id,
                        channel,
                        command,
                    })),
                });
            }
        }

        this.#dirty = false;
        this.#channelDeniesDirty = false;
    }

    /**
     *
     * @param {string} database_url
     * @return {Promise<void>}
     */
    async delete(database_url: string): Promise<void> {
        if (!this.#id) {
            return;
        }

        await prisma.channelDeny.deleteMany({
            where: {
                serverConfigId: this.#id,
            }
        });

        await prisma.serverConfig.delete({
            where: {
                id: this.#id,
            }
        });
    }

    get id() {
        return this.#id;
    }

    get guild() {
        return this.#guild;
    }

    get prefix() {
        return this.#prefix;
    }

    set prefix(value) {
        this.#prefix = value;
        this.#dirty = true;
    }

    get volume() {
        return this.#volume;
    }

    set volume(value) {
        this.#volume = value;
        this.#dirty = true;
    }

    get lang() {
        return this.#lang;
    }

    set lang(value) {
        this.#lang = value;
        this.#dirty = true;
    }

    get telemetryLevel() {
        return this.#telemetryLevel;
    }

    set telemetryLevel(value) {
        this.#telemetryLevel = value;
        this.#dirty = true;
    }

    get channelDenies() {
        return this.#channelDenies;
    }

    /**
     *
     * @param {Object} message
     * @param {import('discord.js').TextChannel} message.channel
     * @param {string[]} args
     */
    denyCommands({ channel }: { channel: import('discord.js').TextChannel; }, args: string[]) {
        if (!(channel.id in this.#channelDenies)) {
            this.#channelDenies[channel.id] = new Set();
        }

        args.forEach(c => {
            this.#channelDenies[channel.id].add(c);
        });

        this.#channelDeniesDirty = true;
    }

    /**
     *
     * @param {Object} message
     * @param {import('discord.js').TextChannel} message.channel
     * @param {string[]} args
     */
    allowCommands({ channel }: { channel: import('discord.js').TextChannel; }, args: string[]) {
        if (!(channel.id in this.#channelDenies)) {
            this.#channelDenies[channel.id] = new Set();
        }

        args.forEach(c => {
            this.#channelDenies[channel.id].delete(c);
        });

        this.#channelDeniesDirty = true;
    }
}
