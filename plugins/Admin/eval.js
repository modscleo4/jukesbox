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
 * @file Admin plugin (eval command)
 *
 * @author Dhiego Cassiano Fogaça Barbosa <modscleo4@outlook.com>
 */

'use strict';

import * as config from "../../config.js";
import Message from "../../lib/Message.js";
import Command, {OptionType} from "../../lib/Command.js";
import * as global from "../../global.js";
import i18n from "../../lang/lang.js";

export default new Command({
    description: {
        en_US: 'Runs pure JS.',
        pt_BR: 'Roda JS puro.',
    },
    options: [
        {
            name: 'js',
            description: 'JavaScript code.',
            type: OptionType.STRING,
            required: true,
        }
    ],

    only: [config.adminID],

    /**
     *
     * @this {Command}
     * @param {Object} message
     * @param {import('../../lib/Client.js').default} message.client
     * @param {import('discord.js').Guild} message.guild
     * @param {import('discord.js').TextChannel} message.channel
     * @param {import('discord.js').User} message.author
     * @param {import('discord.js').GuildMember} message.member
     * @param {Function} message.sendMessage
     * @param {string[]} args
     * @return {Promise<{content?: string, embeds?: import('discord.js').MessageEmbed[], lockAuthor?: boolean, reactions?: string[], onReact?: Function, onEndReact?: Function, timer?: number, deleteAfter?: boolean}>}{Promise<string|import('discord.js').MessageEmbed|{embed: import('discord.js').MessageEmbed, reactions: string[]}>}
     */
    async fn({client, guild, channel, author, member, sendMessage}, args) {
        const sc = global.serverConfig.get(guild.id);

        if (args.length === 0) {
            return {content: i18n('admin.eval.noArgs', sc?.lang)};
        }

        try {
            return {content: `\`\`\`js\n${JSON.stringify(eval(args[0]), null, 2)}\n\`\`\``};
        } catch (e) {
            return {content: `\`\`\`\n${e.stack}\n\`\`\``};
        }
    },
});
