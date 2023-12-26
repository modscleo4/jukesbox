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
import { queue, serverConfig, messageAlert } from "./global.js";
import { options } from "./config.js";
import { prisma } from './lib/prisma.js';
import InsufficientBotPermissionsError from "./errors/InsufficientBotPermissionsError.js";
import InsufficientUserPermissionsError from "./errors/InsufficientUserPermissionsError.js";
import NoVoiceChannelError from "./errors/NoVoiceChannelError.js";
import SameVoiceChannelError from "./errors/SameVoiceChannelError.js";
import FullVoiceChannelError from "./errors/FullVoiceChannelError.js";
import i18n, { langs } from "./lang/lang.js";
import { ActivityType, InteractionType, Message, TextChannel, WebhookClient } from "discord.js";
import Command, { CommandReturn, SendMessageFn } from "./lib/Command.js";
import CommandExecutionError from "./errors/CommandExecutionError.js";
import ServerConfig from "./lib/ServerConfig.js";

await prisma.$connect();

const serverConfigs = await prisma.serverConfig.findMany({
    include: {
        channelDenies: true,
    },
});

for (const sc of serverConfigs) {
    serverConfig.set(
        sc.guild, new ServerConfig(
            {
                ...sc,
                prefix: sc.prefix ?? undefined,
                volume: sc.volume ?? undefined,
                lang: sc.lang as keyof typeof langs ?? undefined,
                channelDenies: sc.channelDenies.reduce((acc, v) => acc, {} as { [s: string]: Set<string>; })
            }
        )
    );
}

console.log(`${serverConfig.size} configuraç${serverConfig.size > 1 ? 'ões' : 'ão'} carregada${serverConfig.size > 1 ? 's' : ''}.`);

const client = new Client();

client.on('ready', async () => {
    client.user!.setPresence({
        activities: [{
            name: 'Jukera carai',
            type: ActivityType.Watching,
        }],

        status: 'online',
    });

    console.log(`Stream do Jukera on.`);
});

client.on('voiceStateUpdate', async (oldState, newState) => {
    if ((!newState.channel || newState.channel !== oldState.channel) && oldState.channel) {
        if (oldState.channel.members.size === 1 && oldState.channel.members.find(m => m.id === client.user!.id)) {
            client.leaveVoiceChannel(oldState.channel.guild.id);
        }
    }
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) {
        return;
    }

    const guild = (await client.guilds.fetch(interaction.guild!.id))!;
    const channel = (await client.channels.fetch(interaction.channel!.id))! as TextChannel;
    const author = (await client.users.fetch(interaction.member!.user.id))!;
    const member = (await guild.members.fetch(author))!;

    async function sendMessage(msgData: CommandReturn): Promise<Message | null> {
        if (!msgData) {
            return null;
        }

        const webhookMsg = await (new WebhookClient({ id: client.user!.id, token: interaction.token }).send(msgData));
        const msg = await interaction.channel!.messages.fetch(webhookMsg.id);

        if (msg) {
            if ('reactions' in msgData && msgData.reactions) {
                msgData.reactions.map(async r => await msg.react(r).catch(() => { }));

                if (msgData.onReact) {
                    const collector = msg.createReactionCollector({
                        filter: (r, u) => msgData.reactions!.includes(r.emoji.name!) && msgData.lockAuthor ? u.id === author.id : u.id !== client.user!.id,
                        max: Infinity,
                        dispose: true,
                        time: (msgData.timer || 1) * 60 * 1000,
                    }).on('collect', async (reaction, user) => {
                        await msgData.onReact!({ reaction, user, message: msg, add: true, stop: () => collector.stop() });
                    }).on('remove', async (reaction, user) => {
                        await msgData.onReact!({ reaction, user, message: msg, add: false, stop: () => collector.stop() });
                    }).on('end', async (collected) => {
                        if (msgData.deleteOnEnd) {
                            return await msg.delete().catch(() => { });
                        }

                        if (!msgData.onEndReact) {
                            return;
                        }

                        await msgData.onEndReact({ message: msg });
                    });
                }
            }

            if ('deleteAfter' in msgData && msgData.deleteAfter) {
                setTimeout(() => {
                    msg.delete().catch(() => { });
                }, msgData.deleteAfter * 1000);
            }
        }

        return msg;
    };

    const sendChannelMessage: SendMessageFn = async (msgData) => {
        if (!msgData) {
            return null;
        }

        return await channel.send(msgData);
    };

    const sc = serverConfig.get(interaction.guild!.id);

    switch (interaction.type) {
        case InteractionType.ApplicationCommand:
            await interaction.deferReply();

            const command = client.commands[interaction.commandName];
            const args = interaction.options?.data.map(o => o.value) ?? [];

            if (command.only && command.only.length > 0 && !command.only.includes(author.id)) {
                await sendMessage({ content: i18n('only', sc?.lang) });
                return;
            }

            try {
                Command.logUsage(interaction.commandName);
                await sendMessage(await command.fn({ client, guild, channel, author, member, sendMessage: sendChannelMessage }, args));
            } catch (e) {
                if (e instanceof InsufficientBotPermissionsError) {
                    await sendMessage({ content: i18n('insufficientBotPermissions', sc?.lang, { permission: e.message }) });
                    return;
                }

                if (e instanceof InsufficientUserPermissionsError) {
                    await sendMessage({ content: i18n('insufficientUserPermissions', sc?.lang, { permission: e.message }) });
                    return;
                }

                if (e instanceof NoVoiceChannelError) {
                    await sendMessage({ content: i18n('noVoiceChannel', sc?.lang) });
                    return;
                }

                if (e instanceof SameVoiceChannelError) {
                    await sendMessage({ content: i18n('sameVoiceChannel', sc?.lang) });
                    return;
                }

                if (e instanceof FullVoiceChannelError) {
                    await sendMessage({ content: i18n('fullVoiceChannel', sc?.lang) });
                    return;
                }

                if (e instanceof CommandExecutionError) {
                    await sendMessage(e.messageContent);
                    return;
                }

                console.error(e);
                if (options.production && options.adminID && e instanceof Error) {
                    await (await client.users.fetch(options.adminID)).send(`Comando: ${interaction.commandName}\n\n\`\`\`${e.stack}\`\`\``);
                }
                await sendMessage({ content: i18n('unhandledException', sc?.lang) }).catch(() => { });
            }

            break;
    }
});

client.loadCommands(await import('./plugins/index.js'));
console.log(`${Object.keys(client.commands).length} comando${Object.keys(client.commands).length > 1 ? 's' : ''} carregado${Object.keys(client.commands).length > 1 ? 's' : ''}.`);

await client.login(options.token);

process.on('SIGTERM', async () => {
    client.user!.setPresence({
        activities: [{
            name: 'Atualizando',
            type: ActivityType.Custom,
        }],

        status: 'dnd',
    });

    console.log(`Atualizando.`);
    client.removeAllListeners();

    process.removeAllListeners();
});

process.on('unhandledRejection', async (e, promise) => {
    console.error(e);

    if (options.production && options.adminID && e instanceof Error) {
        await (await client.users.fetch(options.adminID)).send(`Unhandled Promise rejection!\n\n\`\`\`${e.stack}\`\`\``);
    }
});

setInterval(async () => {
    messageAlert.clear();
}, 1000 * 60 * 60 * 24);
