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
 * @file Moderation plugin
 *
 * @author Dhiego Cassiano Fogaça Barbosa <modscleo4@outlook.com>
 */

'use strict';

import {Message, MessageEmbed} from "discord.js";

import Command from "../lib/Command.js";
import getLocalizedString from "../lang/lang.js";

export const addrole = new Command({
    description: {
        en_US: 'Give one or more roles to a `@member`.',
        pt_BR: 'Adiciona um ou mais cargos a um `@membro`.',
    },
    usage: 'addrole [@member] [role1] [role2]...',

    botPermissions: {
        server: ['MANAGE_ROLES'],
    },

    userPermissions: {
        server: ['MANAGE_ROLES'],
    },

    /**
     *
     * @param {Message} message
     * @param {string[]} args
     * @return {Promise<*>}
     */
    async fn(message, args) {
        if (!message.guild.me.hasPermission('MANAGE_ROLES')) {
            return await message.channel.send('ME AJUDA!');
        }

        if (!message.member.guild.member(message.author).hasPermission('MANAGE_ROLES')) {
            return await message.channel.send('Coé rapaz tá doidão?');
        }

        if (!args[0].match(/\d+/gm)) {
            return await message.channel.send('Informe o @membro.');
        }

        if (args.length < 2) {
            return await message.channel.send('Informe um cargo.');
        }

        const userID = /(?<User>\d+)/gmi.exec(args.shift()).groups.User;
        const user = message.guild.member(userID);
        const roles = args.map(r => message.guild.roles.cache.find(g => g.name === r));

        if (!user) {
            return await message.channel.send('Usuário inválido.');
        }

        if (roles.includes(undefined)) {
            return await message.channel.send(`Cargo \`${args[roles.indexOf(undefined)]}\` não encontrado.`);
        }

        if (roles.find(r => !r.editable)) {
            return message.channel.send(`A Role \`${roles.find(r => !r.editable).name}\` é muito potente.`);
        }

        await user.roles.add(roles);
        await message.channel.send('Cargos adicionados.');
    },
});

export const rmrole = new Command({
    description: {
        en_US: 'Remove one or more roles from a `@member`.',
        pt_BR: 'Remove um ou mais cargos de um `@membro`.',
    },
    usage: 'addrole [@member] [role1] [role2]...',

    botPermissions: {
        server: ['MANAGE_ROLES'],
    },

    userPermissions: {
        server: ['MANAGE_ROLES'],
    },

    /**
     *
     * @param {Message} message
     * @param {string[]} args
     * @return {Promise<*>}
     */
    async fn(message, args) {
        if (!message.guild.me.hasPermission('MANAGE_ROLES')) {
            return await message.channel.send('ME AJUDA!');
        }

        if (!message.member.guild.member(message.author).hasPermission('MANAGE_ROLES')) {
            return await message.channel.send('Coé rapaz tá doidão?');
        }

        if (!args[0].match(/\d+/gm)) {
            return await message.channel.send('Informe o @membro.');
        }

        if (args.length < 2) {
            return await message.channel.send('Informe um cargo.');
        }

        const userID = /(?<User>\d+)/gmi.exec(args.shift()).groups.User;
        const user = message.guild.member(userID);
        const roles = args.map(r => message.guild.roles.cache.find(g => g.name === r));

        if (!user) {
            return await message.channel.send('Usuário inválido.');
        }

        if (roles.includes(undefined)) {
            return await message.channel.send(`Cargo \`${args[roles.indexOf(undefined)]}\` não encontrado.`);
        }

        if (roles.find(r => !r.editable)) {
            return message.channel.send(`A Role \`${roles.find(r => !r.editable).name}\` é muito potente.`);
        }

        await user.roles.remove(roles);
        await message.channel.send('Cargos removidos.');
    },
});

export const userinfo = new Command({
    description: {
        en_US: '`@member` information.',
        pt_BR: 'Informações de um `@membro`.',
    },
    usage: 'userinfo [@member]',

    /**
     *
     * @param {Message} message
     * @param {string[]} args
     * @return {Promise<*>}
     */
    async fn(message, args) {
        if (!args[0].match(/\d+/gm)) {
            return await message.channel.send('Informe o @membro.');
        }

        const userID = /(?<User>\d+)/gmi.exec(args.shift()).groups.User;
        const guildMember = message.guild.member(userID);

        if (!guildMember) {
            return await message.channel.send('Usuário inválido.');
        }

        return await message.channel.send(new MessageEmbed({
            title: guildMember.nickname ?? guildMember.user.tag,
            author: {name: message.author.username, iconURL: message.author.avatarURL()},
            color: guildMember.displayHexColor,
            timestamp: new Date(),
            thumbnail: {url: guildMember.user.avatarURL()},
            fields: [
                {name: 'username#tag', value: guildMember.user.tag, inline: true},
                {name: 'ID', value: guildMember.id, inline: true},
                {name: 'Cargos', value: guildMember.roles.cache.map(r => `\`${r.name}\``).join(' '), inline: false},
                {
                    name: 'Entrou',
                    value: new Intl.DateTimeFormat('pt-br', {
                        year: "numeric",
                        month: "numeric",
                        day: "numeric",
                        hour: "numeric",
                        minute: "numeric"
                    }).format(guildMember.joinedAt),
                    inline: true
                },
                {name: 'Bot', value: guildMember.user.bot ? 'Sim' : 'Não', inline: true}
            ],
        }));
    },
});
