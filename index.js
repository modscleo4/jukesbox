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
import {adminID, database_url, prefix, token} from "./config.js";
import {loadServerConfig} from "./lib/utils.js";
import InsufficientBotPermissionsError from "./errors/InsufficientBotPermissionsError.js";
import InsufficientUserPermissionsError from "./errors/InsufficientUserPermissionsError.js";
import NoVoiceChannelError from "./errors/NoVoiceChannelError.js";
import i18n from "./lang/lang.js";

const serverConfig = await loadServerConfig(database_url);
setServerConfig(serverConfig);
console.log(`${serverConfig.size} configuração(ões) carregada(s).`);

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

client.on('message', async message => {
    if (message.author.bot) {
        return;
    }

    if (message.channel.type !== 'text') {
        return;
    }

    const sc = serverConfig.get(message.guild.id);
    const serverPrefix = sc?.prefix ?? prefix;

    if (message.content.startsWith(`<@!${client.user.id}>`)) {
        const command = client.commands.prefix;

        await command.fn(message, []).catch(async e => {
            console.error(e);
            adminID && await (await client.users.fetch(adminID)).send(`Mensagem: ${message}\n\n\`\`\`${e.stack}\`\`\``);
            await message.channel.send('Deu ruim aqui lek.').catch(() => {

            });
        });
    } else if (message.content.startsWith(serverPrefix)) {
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

        await command.fn(message, args).catch(async e => {
            if (e instanceof InsufficientBotPermissionsError) {
                return await message.channel.send(i18n('insufficientBotPermissions', sc?.lang, {permission: e.message}));
            }

            if (e instanceof InsufficientUserPermissionsError) {
                return await message.channel.send(i18n('insufficientUserPermissions', sc?.lang, {permission: e.message}));
            }

            if (e instanceof NoVoiceChannelError) {
                return await message.channel.send(i18n('noVoiceChannel', sc?.lang));
            }

            console.error(e);
            adminID && await (await client.users.fetch(adminID)).send(`Mensagem: ${message}\n\n\`\`\`${e.stack}\`\`\``);
            await message.channel.send(i18n('unhandledException', sc?.lang)).catch(() => {

            });
        });
    }
});

client.loadCommands(await import('./plugins/index.js'));
console.log(`${Object.keys(client.commands).length} comando(s) carregado(s).`);

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
});

process.on('unhandledRejection', async (e, promise) => {
    console.error(e);
    adminID && await (await client.users.fetch(adminID)).send(`Unhandled Promise rejection!\n\n\`\`\`${e.stack}\`\`\``);
});
