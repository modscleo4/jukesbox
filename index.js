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
 * @file Bot entry point
 *
 * @author Dhiego Cassiano Fogaça Barbosa <modscleo4@outlook.com>
 */

'use strict';

import Client from "./lib/Client.js";
import { serverConfig, messageAlert } from "./global.js";
import { options } from "./config.js";
import { loadServerConfig } from "./lib/utils.js";
import InsufficientBotPermissionsError from "./errors/InsufficientBotPermissionsError.js";
import InsufficientUserPermissionsError from "./errors/InsufficientUserPermissionsError.js";
import NoVoiceChannelError from "./errors/NoVoiceChannelError.js";
import SameVoiceChannelError from "./errors/SameVoiceChannelError.js";
import FullVoiceChannelError from "./errors/FullVoiceChannelError.js";
import i18n from "./lang/lang.js";
import { MessageEmbed, WebhookClient } from "discord.js";
import Command from "./lib/Command.js";
import CommandExecutionError from "./errors/CommandExecutionError.js";

for (const sc of await loadServerConfig(options.database_url)) {
    serverConfig.set(sc[0], sc[1]);
}

console.log(`${serverConfig.size} configuraç${serverConfig.size > 1 ? 'ões' : 'ão'} carregada${serverConfig.size > 1 ? 's' : ''}.`);

const client = new Client();

client.on('ready', async () => {
    await client.user.setPresence({
        activity: {
            name: 'Jukera carai',
            type: 'WATCHING',
        },

        status: 'online',
    });

    console.log(`Stream do Jukera on.`);
});

client.on('voiceStateUpdate', async (oldState, newState) => {
    if ((!newState.channel || newState.channel !== oldState.channel) && oldState.channel) {
        if (oldState.channel.members.size === 1 && oldState.channel.members.find(m => m.id === client.user.id)) {
            oldState.channel.leave();
        }
    }
});

client.ws.on('INTERACTION_CREATE', async interaction => {
    const guild = await client.guilds.fetch(interaction.guild_id);
    /** @type {import('discord.js').TextChannel} */
    const channel = await client.channels.fetch(interaction.channel_id);
    const author = await client.users.fetch(interaction.member.user.id);
    const member = await guild.members.fetch(author);

    /**
     *
     * @type {import('./lib/Command.js').SendMessageFn}
     */
    async function sendMessage(msgData) {
        if (!msgData) {
            return null;
        }

        if (msgData.type === 1) {
            //
            return null;
        }

        const webhookMsg = await (new WebhookClient(client.user.id, interaction.token).send(msgData.content ?? msgData));
        const msg = await channel.messages.fetch(webhookMsg.id);

        if (msg) {
            if (msgData.reactions) {
                msgData.reactions.map(async r => await msg.react(r).catch(() => { }));

                if (msgData.onReact) {
                    const collector = msg.createReactionCollector((r, u) => msgData.reactions.includes(r.emoji.name) && msgData.lockAuthor ? u.id === author.id : u.id !== client.user.id, {
                        max: Infinity,
                        dispose: true,
                        time: (msgData.timer || 1) * 60 * 1000,
                    }).on('collect', async (reaction, user) => {
                        await msgData.onReact({ reaction, user, message: msg, add: true, stop: () => collector.stop() });
                    }).on('remove', async (reaction, user) => {
                        await msgData.onReact({ reaction, user, message: msg, add: false, stop: () => collector.stop() });
                    }).on('end', async (collected) => {
                        if (msgData.deleteOnEnd && !msg.deleted) {
                            return await msg.delete().catch(() => { });
                        }

                        if (!msgData.onEndReact) {
                            return;
                        }

                        await msgData.onEndReact({ message: msg });
                    });
                }
            }

            if (msgData.deleteAfter) {
                setTimeout(() => {
                    msg.delete().catch(() => { });
                }, msgData.deleteAfter * 1000);
            }
        }

        return msg;
    };

    /**
     * @type {import('./lib/Command.js').SendMessageFn}
     */
    async function sendChannelMessage(msgData) {
        if (!msgData) {
            return null;
        }

        // For Discord.js v12
        if (msgData?.embeds) {
            msgData.embed = msgData.embeds[0];
            msgData.embeds = undefined;
        }

        if (msgData.type === 1) {
            return null;
        }

        return await channel.send(msgData);
    };

    const sc = serverConfig.get(interaction.guild_id);

    switch (interaction.type) {
        case 1:
            client.api.interactions(interaction.id, interaction.token).callback.post({
                data: {
                    type: 1,
                },
            });

            break;

        case 2:
            const response = client.api.interactions(interaction.id, interaction.token).callback.post({
                data: {
                    type: 5,
                },
            });

            const command = client.commands[interaction.data.name];
            const args = interaction.data.options?.map(o => o.value) ?? [];

            try {
                await Command.logUsage(interaction.data.name);
                await sendMessage(await command.fn({ client, guild, channel, author, member, sendMessage: sendChannelMessage }, args));
            } catch (e) {
                if (e instanceof InsufficientBotPermissionsError) {
                    return await sendMessage({ content: i18n('insufficientBotPermissions', sc?.lang, { permission: e.message }) });
                }

                if (e instanceof InsufficientUserPermissionsError) {
                    return await sendMessage({ content: i18n('insufficientUserPermissions', sc?.lang, { permission: e.message }) });
                }

                if (e instanceof NoVoiceChannelError) {
                    return await sendMessage({ content: i18n('noVoiceChannel', sc?.lang) });
                }

                if (e instanceof SameVoiceChannelError) {
                    return await sendMessage({ content: i18n('sameVoiceChannel', sc?.lang) });
                }

                if (e instanceof FullVoiceChannelError) {
                    return await sendMessage({ content: i18n('fullVoiceChannel', sc?.lang) });
                }

                if (e instanceof CommandExecutionError) {
                    return await sendMessage(e.messageContent);
                }

                console.error(e);
                options.production && options.adminID && await (await client.users.fetch(options.adminID)).send(`Comando: ${interaction.data.name}\n\n\`\`\`${e.stack}\`\`\``);
                await sendMessage({ content: i18n('unhandledException', sc?.lang) }).catch(() => { });
            }

            break;
    }
});

client.on('message', async message => {
    /**
     * @type {import('./lib/Command.js').SendMessageFn}
     */
    async function sendMessage(msgData) {
        if (!msgData) {
            return null;
        }

        // For Discord.js v12
        if (msgData?.embeds) {
            msgData.embed = msgData.embeds[0];
            msgData.embeds = undefined;
        }

        if (msgData.type === 1) {
            return null;
        }

        return await message.channel.send(msgData);
    };

    if (message.author.bot) {
        return;
    }

    if (message.channel.type !== 'text') {
        return;
    }

    const sc = serverConfig.get(message.guild.id);
    const serverPrefix = sc?.prefix ?? options.prefix;

    if (message.content.startsWith(serverPrefix)) {
        const args = (message.content.slice(serverPrefix.length).match(/("[^"]*"|\/[^{]+{[^}]*}|\S)+/gmi) ?? ['']).map(a => a.replace(/"/gmi, ''));
        const cmd = args.shift().toLowerCase();

        // Tell commands it was a prefixed message
        args[-1] = message.id;

        if (!(cmd in client.commands) && !(cmd in client.aliases)) {
            return;
        }

        const command = client.commands[cmd] ?? client.commands[client.aliases[cmd]];

        if (command.only && !command.only.includes(message.author.id)) {
            return;
        }

        // DM User if the bot cannot send Messages in the Text Channel
        if (!message.channel.permissionsFor(message.client.user).has('SEND_MESSAGES')) {
            return await message.author.send({ content: i18n('permission.SEND_MESSAGES', sc?.lang) });
        }

        // Check if the Command is restricted in the current Text Channel
        if (sc?.channelDenies[message.channel.id]?.has(client.aliases[cmd] ?? cmd)) {
            return await sendMessage({ content: i18n('commandRestricted', sc?.lang) });
        }

        try {
            await Command.logUsage(cmd);
            const msgData = await command.fn({ client, guild: message.guild, channel: message.channel, author: message.author, member: message.member, sendMessage }, args);

            if (options.messageIntentAlert && !messageAlert.has(message.guild.id)) {
                await sendMessage({ content: i18n('messageIntent', sc?.lang) }).catch(() => { });

                messageAlert.set(message.guild.id, true);
            }

            const msg = await sendMessage(msgData);

            if (msg) {
                if (msgData?.reactions) {
                    msgData.reactions.map(async r => await msg.react(r).catch(() => { }));

                    if (msgData.onReact) {
                        const collector = msg.createReactionCollector((r, u) => msgData.reactions.includes(r.emoji.name) && msgData.lockAuthor ? u.id === message.author.id : u.id !== client.user.id, {
                            max: Infinity,
                            dispose: true,
                            time: (msgData.timer || 1) * 60 * 1000,
                        }).on('collect', async (reaction, user) => {
                            await msgData.onReact({ reaction, user, message: msg, add: true, stop: () => collector.stop() });
                        }).on('remove', async (reaction, user) => {
                            await msgData.onReact({ reaction, user, message: msg, add: false, stop: () => collector.stop() });
                        }).on('end', async (collected) => {
                            if (msgData.deleteOnEnd && !msg.deleted) {
                                return await msg.delete().catch(() => { });
                            }

                            if (!msgData.onEndReact) {
                                return;
                            }

                            await msgData.onEndReact({ message: msg });
                        });
                    }
                }

                if (msgData.deleteAfter) {
                    setTimeout(() => {
                        msg.delete().catch(() => { });
                    }, msgData.deleteAfter * 1000);
                }
            }

            if (command.deleteUserMessage) {
                await message?.delete().catch(() => { });
            }
        } catch (e) {
            if (e instanceof InsufficientBotPermissionsError) {
                return await sendMessage({ content: i18n('insufficientBotPermissions', sc?.lang, { permission: e.message }) });
            }

            if (e instanceof InsufficientUserPermissionsError) {
                return await sendMessage({ content: i18n('insufficientUserPermissions', sc?.lang, { permission: e.message }) });
            }

            if (e instanceof NoVoiceChannelError) {
                return await sendMessage({ content: i18n('noVoiceChannel', sc?.lang) });
            }

            if (e instanceof SameVoiceChannelError) {
                return await sendMessage({ content: i18n('sameVoiceChannel', sc?.lang) });
            }

            if (e instanceof FullVoiceChannelError) {
                return await sendMessage({ content: i18n('fullVoiceChannel', sc?.lang) });
            }

            if (e instanceof CommandExecutionError) {
                return await sendMessage(e.messageContent);
            }

            console.error(e);
            options.production && options.adminID && await (await client.users.fetch(options.adminID)).send(`Mensagem: ${message}\n\n\`\`\`${e.stack}\`\`\``);
            await sendMessage({ content: i18n('unhandledException', sc?.lang) }).catch(() => { });
        }
    }
});

client.loadCommands(await import('./plugins/index.js'));
console.log(`${Object.keys(client.commands).length} comando${Object.keys(client.commands).length > 1 ? 's' : ''} carregado${Object.keys(client.commands).length > 1 ? 's' : ''}.`);

await client.login(options.token);

process.on('SIGTERM', async () => {
    await client.user.setPresence({
        activity: {
            name: 'Atualizando',
            type: 'CUSTOM_STATUS',
        },

        status: 'dnd',
    });

    console.log(`Atualizando.`);
    client.removeAllListeners();

    process.removeAllListeners();
});

process.on('unhandledRejection', async (e, promise) => {
    console.error(e);
    options.production && options.adminID && await (await client.users.fetch(options.adminID)).send(`Unhandled Promise rejection!\n\n\`\`\`${e.stack}\`\`\``);
});

setInterval(async () => {
    messageAlert.clear();

    if (options.periodicallyClearCache) {
        await client.clearCache();
    }
}, 1000 * 60 * 60 * 24);
