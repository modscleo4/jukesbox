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
 * @file Discord.js extended Message Class
 *
 * @author Dhiego Cassiano Fogaça Barbosa <modscleo4@outlook.com>
 */

'use strict';

import {Guild, GuildMember, Message as BaseMessage, TextChannel} from "discord.js";

import Client from "./Client.js";

export default class Message extends BaseMessage {
    /**
     * @type {Client}
     */
    client;

    /**
     * @type {TextChannel}
     */
    channel;

    /**
     * @type {GuildMember}
     */
    member;

    /**
     * @type {Guild}
     */
    guild;

    /**
     *
     * @param {Client} client
     * @param {Object} data
     * @param {TextChannel} channel
     */
    constructor(client, data, channel) {
        super(client, data, channel);
    }
}
