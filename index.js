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
import {setServerConfig} from "./global.js";
import {adminID, database_url, prefix, token, production, periodicallyClearCache} from "./config.js";
import {loadServerConfig} from "./lib/utils.js";
import InsufficientBotPermissionsError from "./errors/InsufficientBotPermissionsError.js";
import InsufficientUserPermissionsError from "./errors/InsufficientUserPermissionsError.js";
import NoVoiceChannelError from "./errors/NoVoiceChannelError.js";
import SameVoiceChannelError from "./errors/SameVoiceChannelError.js";
import FullVoiceChannelError from "./errors/FullVoiceChannelError.js";
import i18n from "./lang/lang.js";
import {MessageEmbed, WebhookClient} from "discord.js";

const serverConfig = await loadServerConfig(database_url);
setServerConfig(serverConfig);
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
    const channel = await client.channels.fetch(interaction.channel_id);
    const author = await client.users.fetch(interaction.member.user.id);
    const member = await guild.members.fetch(author);

    async function sendMessage(msgData) {
        if (!msgData) {
            return;
        }

        let data = msgData;

        if (typeof msgData === 'string') {
            //
        } else if (msgData instanceof MessageEmbed) {
            //
        } else if (typeof msgData === 'object') {
            if (msgData.type === 1) {
                //
                return;
            } else {
                data = msgData.embed;

                //
            }
        }

        const webhookMsg = await (new WebhookClient(client.user.id, interaction.token).send(data));
        const msg = await channel.messages.fetch(webhookMsg.id);

        if (msgData.reactions) {
            msgData.reactions.map(async r => await msg.react(r).catch(() => {

            }));

            if (msgData.onReact && msgData.timer) {
                const collector = msg.createReactionCollector((r, u) => msgData.reactions.includes(r.emoji.name) && msgData.lockAuthor ? u.id === author.id : u.id !== client.user.id, {
                    max: Infinity,
                    dispose: true,
                    time: (msgData.timer || 1) * 60 * 1000,
                }).on('collect', async (reaction, user) => {
                    await msgData.onReact({reaction, user, message: msg, add: true, stop: () => collector.stop()});
                }).on('remove', async (reaction, user) => {
                    await msgData.onReact({reaction, user, message: msg, add: false, stop: () => collector.stop()});
                }).on('end', async (collected) => {
                    if (msgData.deleteAfter && !msg.deleted) {
                        return await msg.delete().catch(() => {

                        });
                    }

                    if (!msgData.onEndReact) {
                        return;
                    }

                    await msgData.onEndReact({message: msg});
                });
            }
        }

        return msg;
    }

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
                await sendMessage(await command.fn({client, guild, channel, author, member, sendMessage}, args));
            } catch (e) {
                if (e instanceof InsufficientBotPermissionsError) {
                    return await sendMessage(i18n('insufficientBotPermissions', sc?.lang, {permission: e.message}));
                }

                if (e instanceof InsufficientUserPermissionsError) {
                    return await sendMessage(i18n('insufficientUserPermissions', sc?.lang, {permission: e.message}));
                }

                if (e instanceof NoVoiceChannelError) {
                    return await sendMessage(i18n('noVoiceChannel', sc?.lang));
                }

                if (e instanceof SameVoiceChannelError) {
                    return await sendMessage(i18n('sameVoiceChannel', sc?.lang));
                }

                if (e instanceof FullVoiceChannelError) {
                    return await sendMessage(i18n('fullVoiceChannel', sc?.lang));
                }

                console.error(e);
                production && adminID && await (await client.users.fetch(adminID)).send(`Comando: ${interaction.data.name}\n\n\`\`\`${e.stack}\`\`\``);
                await sendMessage(i18n('unhandledException', sc?.lang)).catch(() => {

                });
            }

            break;
    }
});

client.on('message', async message => {
    if (message.author.bot) {
        return;
    }

    if (message.channel.type !== 'text') {
        return;
    }

    const sc = serverConfig.get(message.guild.id);
    const serverPrefix = sc?.prefix ?? prefix;

    if (message.content.startsWith(serverPrefix)) {
        const args = (message.content.slice(serverPrefix.length).match(/("[^"]*"|\/[^{]+{[^}]*}|\S)+/gmi) ?? ['']).map(a => a.replace(/"/gmi, ''));
        const cmd = args.shift().toLowerCase();

        if (!(cmd in client.commands) && !(cmd in client.aliases)) {
            return;
        }

        const command = client.commands[cmd] ?? client.commands[client.aliases[cmd]];

        if (command.only && !command.only.includes(message.author.id)) {
            return;
        }

        // DM User if the bot cannot send Messages in the Text Channel
        if (!message.channel.permissionsFor(message.client.user).has('SEND_MESSAGES')) {
            return await message.author.send(i18n('permission.SEND_MESSAGES', sc?.lang));
        }

        // Check if the Command is restricted in the current Text Channel
        if (sc?.channelDenies[message.channel.id]?.has(client.aliases[cmd] ?? cmd)) {
            return await message.channel.send(i18n('commandRestricted', sc?.lang));
        }

        try {
            message.sendMessage = async (data) => message.channel.send(data);

            const msgData = await command.fn(message, args);

            let msg;

            if (typeof msgData === 'string') {
                msg = await message.channel.send(msgData);
            } else if (msgData instanceof MessageEmbed) {
                msg = await message.channel.send(msgData);
            } else if (typeof msgData === 'object') {
                if (msgData.type === 1) {

                } else {
                    msg = await message.channel.send(msgData.embed);

                    if (msgData.reactions) {
                        msgData.reactions.map(async r => await msg.react(r).catch(() => {

                        }));

                        if (msgData.onReact && msgData.timer) {
                            const collector = msg.createReactionCollector((r, u) => msgData.reactions.includes(r.emoji.name) && msgData.lockAuthor ? u.id === message.author.id : u.id !== client.user.id, {
                                max: Infinity,
                                dispose: true,
                                time: (msgData.timer || 1) * 60 * 1000,
                            }).on('collect', async (reaction, user) => {
                                await msgData.onReact({reaction, user, message: msg, add: true, stop: () => collector.stop()});
                            }).on('remove', async (reaction, user) => {
                                await msgData.onReact({reaction, user, message: msg, add: false, stop: () => collector.stop()});
                            }).on('end', async (collected) => {
                                if (msgData.deleteAfter && !msg.deleted) {
                                    return await msg.delete().catch(() => {

                                    });
                                }

                                if (!msgData.onEndReact) {
                                    return;
                                }

                                await msgData.onEndReact({message: msg});
                            });
                        }
                    }
                }
            }

            if (command.deleteUserMessage) {
                await message?.delete().catch(() => {

                });
            }
        } catch (e) {
            if (e instanceof InsufficientBotPermissionsError) {
                return await message.channel.send(i18n('insufficientBotPermissions', sc?.lang, {permission: e.message}));
            }

            if (e instanceof InsufficientUserPermissionsError) {
                return await message.channel.send(i18n('insufficientUserPermissions', sc?.lang, {permission: e.message}));
            }

            if (e instanceof NoVoiceChannelError) {
                return await message.channel.send(i18n('noVoiceChannel', sc?.lang));
            }

            if (e instanceof SameVoiceChannelError) {
                return await message.channel.send(i18n('sameVoiceChannel', sc?.lang));
            }

            if (e instanceof FullVoiceChannelError) {
                return await message.channel.send(i18n('fullVoiceChannel', sc?.lang));
            }

            console.error(e);
            production && adminID && await (await client.users.fetch(adminID)).send(`Mensagem: ${message}\n\n\`\`\`${e.stack}\`\`\``);
            await message.channel.send(i18n('unhandledException', sc?.lang)).catch(() => {

            });
        }
    }
});

client.loadCommands(await import('./plugins/index.js'));
console.log(`${Object.keys(client.commands).length} comando${Object.keys(client.commands).length > 1 ? 's' : ''} carregado${Object.keys(client.commands).length > 1 ? 's' : ''}.`);

await client.login(token);

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
    client.destroy();

    process.removeAllListeners();
});

process.on('unhandledRejection', async (e, promise) => {
    console.error(e);
    production && adminID && await (await client.users.fetch(adminID)).send(`Unhandled Promise rejection!\n\n\`\`\`${e.stack}\`\`\``);
});

setInterval(async () => {
    if (!periodicallyClearCache) {
        return;
    }

    await client.clearCache();
}, 1000 * 60 * 60 * 24);
