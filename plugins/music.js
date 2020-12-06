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
 * @file Music plugin
 *
 * @author Dhiego Cassiano Fogaça Barbosa <modscleo4@outlook.com>
 */

'use strict';

import {Message, MessageEmbed} from "discord.js";
import ytdl from "ytdl-core";
import _scdl from "soundcloud-downloader";
import SpotifyWebAPI from "spotify-web-api-node";

import {queue as Queue, serverConfig} from "../global.js";
import {database_url, highWaterMark, prefix, scclientID, spclientID, spsecret, ytapikey} from "../config.js";
import {
    cutUntil, getPlaylistItems, getSpotifyPlaylistItems,
    isAsync,
    isValidHttpURL, pageEmbed,
    parseMS,
    saveServerConfig, searchVideo,
    serverConfigConstruct, videoInfo
} from "../lib/utils.js";
import Command from "../lib/Command.js";
import Song from "../lib/Song.js";
import ServerQueue from "../lib/ServerQueue.js";

const scdl = _scdl.default;

const spotifyAPI = new SpotifyWebAPI({
    clientId: spclientID,
    clientSecret: spsecret,
    redirectUri: 'http://jukesbox.herokuapp.com',
});

/**
 *
 * @param {Message} message
 * @return {Promise<*>}
 */
async function playSong(message) {
    const serverQueue = Queue.get(message.guild.id);

    if (!serverQueue) {
        return;
    }

    if (serverQueue.toDelete !== null && !serverQueue.toDelete.deleted) {
        await serverQueue.toDelete.delete().catch(e => {
            console.error(e);
        });
        serverQueue.toDelete = null;
    }

    if (serverQueue.songs.length === 0) {
        Queue.delete(message.guild.id);
        return;
    }

    if (serverQueue.song.findOnYT) {
        const msg = await message.channel.send('Procurando no YouTube...');
        const found = await findOnYT(message, serverQueue.song);
        await msg.delete();

        if (!found) {
            serverQueue.toDelete = await message.channel.send('Achei nada lesk.');
            await serverQueue.songs.shift();
            await playSong(message);
        }

        serverQueue.song = found;
    }

    serverQueue.song.stream = isAsync(serverQueue.song.fn) ? await serverQueue.song.fn(serverQueue.song.url, serverQueue.song.options) : serverQueue.song.fn(serverQueue.song.url, serverQueue.song.options);

    serverQueue.connection.play(serverQueue.song.stream, {
        seek: serverQueue.seek,
        volume: serverQueue.volume / 100,
        highWaterMark,
    }).on('finish', async () => {
        if (serverQueue.seek === null) {
            if (!serverQueue.loop) {
                serverQueue.songs.splice(serverQueue.position, 1);
            }

            serverQueue.position = 0;
            if (serverQueue.shuffle) {
                serverQueue.position = Math.floor(Math.random() * serverQueue.songs.length);
            }
        }

        await playSong(message);
    }).on('error', async e => {
        console.error(e);

        await message.channel.send(new MessageEmbed({
            title: 'Eu não consigo clicar velho.',
            author: {name: message.client.user.username, iconURL: message.client.user.avatarURL()},
            timestamp: new Date(),
            description: `Erro: ${e.message}\n\nVídeo: **${serverQueue.song.title}** (${serverQueue.song.url})`,
        }));

        await serverQueue.songs.shift();
        await playSong(message);
    });

    serverQueue.seek = null;
    serverQueue.toDelete = await np.fn(message);
}

/**
 *
 * @param {Message} message
 * @param {Song} song
 * @return {Promise<Song|null>}
 */
async function findOnYT(message, song) {
    const url = ((await searchVideo(`${song.channelTitle} - ${song.title} Provided to Youtube by`, {
        key: ytapikey,
        regionCode: 'us',
        type: 'video',
        part: ['id'],
    }).catch(e => {
        console.error(e);
        return null;
    }))[0] ?? {url: null}).url;

    if (!url) {
        return null;
    }

    const videoId = /(\/watch\?v=|youtu.be\/)(?<VideoId>[^&#]+)/gmu.exec(url).groups.VideoId;
    const songInfo = (await videoInfo(videoId, {key: ytapikey}).catch(e => {
        console.error(e);
        return null;
    }))[0];

    if (!songInfo) {
        return null;
    }

    return new Song({
        title: songInfo.snippet.title,
        url: songInfo.url,
        channelTitle: songInfo.snippet.channelTitle,
        thumbnail: songInfo.snippet.thumbnails.high.url,
        duration: songInfo.duration,
        from: song.from,
        addedBy: song.addedBy,
        fn: ytdl,
        options: {
            filter: 'audioonly',
            highWaterMark,
            quality: 'highestaudio',
            requestOptions: {
                host: 'jukesbox.herokuapp.com',
                headers: {
                    Authorization: `Bearer ${ytapikey}`,
                }
            },
        },
    });
}

export const join = new Command({
    description: 'Entra no canal de voz.',
    usage: 'join',

    /**
     *
     * @param {Message} message
     * @return {Promise<*>}
     */
    fn: async message => {
        const voiceChannel = message.member.voice.channel;

        if (!voiceChannel) {
            return await message.channel.send(`Tá solo né filha da puta.`);
        }

        const permissions = voiceChannel.permissionsFor(message.client.user);
        if (!permissions.has('CONNECT') || !permissions.has('SPEAK')) {
            return await message.channel.send('ME AJUDA!');
        }

        await voiceChannel.join();
        return await message.channel.send(new MessageEmbed({
            title: 'Salve salve Yodinha!',
            author: {name: message.client.user.username, iconURL: message.client.user.avatarURL()},
            timestamp: new Date(),
            description: 'Conectado a um canal de voz',
            fields: [
                {name: 'Canal de voz', value: voiceChannel.name, inline: true},
                {name: 'Canal de texto', value: message.channel.name, inline: true}
            ],
        }));
    },
});

export const leave = new Command({
    description: 'Sai do canal de voz.',
    usage: 'leave',

    /**
     *
     * @param {Message} message
     * @return {Promise<*>}
     */
    fn: async message => {
        const voiceChannel = message.member.voice.channel;
        const serverQueue = Queue.get(message.guild.id);

        if (!voiceChannel) {
            return await message.channel.send(`Tá solo né filha da puta.`);
        }

        if (serverQueue) {
            serverQueue.songs = [];
            serverQueue.connection.dispatcher.end();
            serverQueue.playing = false;
        }

        await voiceChannel.leave();
        await message.channel.send('Sai Minerva filha da puta.');
    },
});

export const search = new Command({
    description: 'Procura por uma música/playlist. `/playlist` para procurar por playlists.',
    usage: 'search [/playlist] [q]',

    /**
     *
     * @param {Message} message
     * @param {string[]} args
     * @return {Promise<*>}
     */
    fn: async (message, args) => {
        const voiceChannel = message.member.voice.channel;

        if (!voiceChannel) {
            return await message.channel.send(`Tá solo né filha da puta.`);
        }

        const permissions = voiceChannel.permissionsFor(message.client.user);
        if (!permissions.has('CONNECT') || !permissions.has('SPEAK')) {
            return await message.channel.send('ME AJUDA!');
        }

        let kind = 'video';
        switch (args[0]) {
            case '/playlist':
                args.shift();
                kind = 'playlist';
                break;

            case '/video':
                args.shift();
                kind = 'video';
                break;

            default:
                break;
        }

        if (!args[0]) {
            return await message.channel.send('Sem meu link eu não consigo.');
        }

        const results = await searchVideo(args.join(' '), {
            key: ytapikey,
            regionCode: 'us',
            type: kind,
        });

        const reactions = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'].splice(0, results.length);

        const msg = await message.channel.send(new MessageEmbed({
            title: 'Achei isso aqui lek',
            author: {name: message.client.user.username, iconURL: message.client.user.avatarURL()},
            timestamp: new Date(),
            description: results.map((r, i) => `**${i + 1}** - [${r.snippet.title}](${r.url}) | ${r.snippet.channelTitle}`).join('\n\n'),
        }));

        reactions.map(async r => await msg.react(r).catch(() => {

        }));

        await msg.awaitReactions((r, u) => reactions.includes(r.emoji.name) && u.id === message.author.id, {
            max: 1,
            time: 60000,
            errors: ['time'],
        }).then(async collected => {
            const reaction = collected.first();
            await play.fn(message, [results[reactions.indexOf(reaction.emoji.name)].url]);
        });

        if (!msg.deleted) {
            await msg.delete();
        }
    },
});

export const videoinfo = new Command({
    description: 'Mostra informações de um vídeo do YouTube',
    usage: 'videoinfo [youtube_url]',

    /**
     *
     * @param {Message} message
     * @param {string[]} args
     * @return {Promise<*>}
     */
    fn: async (message, args) => {
        if (!isValidHttpURL(args[0]) || !args[0].match(/(\/watch\?v=|youtu.be\/)/gmu)) {
            return await message.channel.send('URL inválida.');
        }

        const videoId = /(\/watch\?v=|youtu.be\/)(?<VideoId>[^&#]+)/gmu.exec(args[0]).groups.VideoId;
        const songInfo = (await videoInfo(videoId, {
            key: ytapikey,
            part: ['id', 'snippet', 'contentDetails', 'statistics'],
        }).catch(e => {
            console.error(e);
            return null;
        }))[0];

        if (!songInfo) {
            return await message.channel.send('Eu não consigo clicar velho.');
        }

        return await message.channel.send(new MessageEmbed({
            title: 'Informações do vídeo',
            url: songInfo.url,
            author: {name: message.client.user.username, iconURL: message.client.user.avatarURL()},
            timestamp: new Date(),
            thumbnail: {url: songInfo.snippet.thumbnails.high.url},
            description: songInfo.snippet.title,
            fields: [
                {name: 'Canal', value: songInfo.snippet.channelTitle, inline: true},
                {name: 'Duração', value: parseMS(songInfo.duration * 1000).toString(), inline: true},
                {name: 'Descrição', value: cutUntil(songInfo.snippet.description, 1024) ?? '(Sem descrição)'},
                {name: '👁‍ Views', value: songInfo.statistics.viewCount, inline: true},
                {name: '👍 Likes', value: songInfo.statistics.likeCount, inline: true},
                {name: '👎 Dislikes', value: songInfo.statistics.dislikeCount, inline: true},
            ],
        }));
    },
});

export const play = new Command({
    description: 'Adiciona uma música/playlist na fila. `/playlist` para procurar por playlists.',
    usage: 'play [/playlist] [youtube_url|q]',

    alias: ['p'],

    /**
     *
     * @param {Message} message
     * @param {string[]} args
     * @return {Promise<*>}
     */
    fn: async (message, args) => {
        const voiceChannel = message.member.voice.channel;
        const serverQueue = Queue.get(message.guild.id);

        if (!voiceChannel) {
            return await message.channel.send(`Tá solo né filha da puta.`);
        }

        const permissions = voiceChannel.permissionsFor(message.client.user);
        if (!permissions.has('CONNECT') || !permissions.has('SPEAK')) {
            return await message.channel.send('ME AJUDA!');
        }

        let kind = 'video';
        switch (args[0]) {
            case '/playlist':
                args.shift();
                kind = 'playlist';
                break;

            case '/video':
                args.shift();
                kind = 'video';
                break;

            default:
                break;
        }

        if (!args[0]) {
            return await message.channel.send('Sem meu link eu não consigo.');
        }

        const songs = [];
        const url = isValidHttpURL(args[0]) ? args[0] : ((await searchVideo(args.join(' '), {
            key: ytapikey,
            regionCode: 'us',
            type: kind,
            part: ['id'],
        }))[0] ?? {url: null}).url;

        if (!url) {
            return await message.channel.send('Achei nada lesk.');
        }

        if (url.match(/youtube.com|youtu.be/gmu)) {
            if (url.match(/([&?])list=[^&#]+/gmu)) {
                const playlistId = /[&?]list=(?<PlaylistId>[^&#]+)/gmu.exec(url).groups.PlaylistId;
                if (!playlistId.startsWith('PL')) {
                    return await message.channel.send('Coé lek YouTube Mix é mole.');
                }

                const plsongs = await getPlaylistItems(playlistId, {
                    key: ytapikey,
                }).catch(e => {
                    console.error(e);
                    return null;
                });

                if (!plsongs) {
                    return await message.channel.send('Eu não consigo clicar velho.');
                }

                const songsInfo = await videoInfo(plsongs.map(s => s.snippet.resourceId.videoId), {key: ytapikey}).catch(e => {
                    console.error(e);
                    return null;
                });

                if (!songsInfo) {
                    return await message.channel.send('Eu não consigo clicar velho.');
                }

                songsInfo.forEach(songInfo => {
                    const song = new Song({
                        title: songInfo.snippet.title,
                        url: songInfo.url,
                        channelTitle: songInfo.snippet.channelTitle,
                        thumbnail: songInfo.snippet.thumbnails.high.url,
                        duration: songInfo.duration,
                        from: 'yt',
                        addedBy: message.author,
                        fn: ytdl,
                        options: {
                            filter: 'audioonly',
                            highWaterMark,
                            quality: 'highestaudio',
                            requestOptions: {
                                host: 'jukesbox.herokuapp.com',
                                headers: {
                                    Authorization: `Bearer ${ytapikey}`,
                                }
                            },
                        },
                    });

                    songs.push(song);
                });
            } else if (url.match(/(\/watch\?v=|youtu.be\/)/gmu)) {
                const videoId = /(\/watch\?v=|youtu.be\/)(?<VideoId>[^&#]+)/gmu.exec(url).groups.VideoId;
                const songInfo = (await videoInfo(videoId, {key: ytapikey}).catch(e => {
                    console.error(e);
                    return null;
                }))[0];

                if (!songInfo) {
                    return await message.channel.send('Eu não consigo clicar velho.');
                }

                const song = new Song({
                    title: songInfo.snippet.title,
                    url: songInfo.url,
                    channelTitle: songInfo.snippet.channelTitle,
                    thumbnail: songInfo.snippet.thumbnails.high.url,
                    duration: songInfo.duration,
                    from: 'yt',
                    addedBy: message.author,
                    fn: ytdl,
                    options: {
                        filter: 'audioonly',
                        highWaterMark,
                        quality: 'highestaudio',
                        requestOptions: {
                            host: 'jukesbox.herokuapp.com',
                            headers: {
                                Authorization: `Bearer ${ytapikey}`,
                            }
                        },
                    },
                });

                songs.push(song);
            }
        } else if (url.match(/soundcloud.com\//gmu)) {
            const songInfo = await scdl.getInfo(url).catch(e => {
                console.error(e);
                return null;
            });

            if (!songInfo) {
                return await message.channel.send('Eu não consigo clicar velho.');
            }

            const song = new Song({
                title: songInfo.title,
                url: songInfo.permalink_url,
                channelTitle: songInfo.user.username,
                thumbnail: songInfo.artwork_url,
                duration: songInfo.duration / 1000,
                from: 'sc',
                addedBy: message.author,
                fn: async (url, options) => await scdl.download(url, options).then(stream => stream),
                options: scclientID,
            });

            songs.push(song);
        } else if (url.match(/spotify.com\/playlist\/[^?#]+/gmu)) {
            const playlistId = /spotify.com\/playlist\/(?<PlaylistId>[^?#]+)/gmu.exec(url).groups.PlaylistId;
            (await getSpotifyPlaylistItems(spotifyAPI, playlistId).catch(async e => {
                console.error(e);
                return null;
            })).forEach(plSong => {
                const song = new Song({
                    title: plSong.name,
                    url: null,
                    channelTitle: plSong.artists,
                    thumbnail: null,
                    duration: null,
                    findOnYT: true,
                    from: 'sp',
                    addedBy: message.author,
                    fn: ytdl,
                    options: {
                        filter: 'audioonly',
                        highWaterMark,
                        quality: 'highestaudio',
                        requestOptions: {
                            host: 'jukesbox.herokuapp.com',
                            headers: {
                                Authorization: `Bearer ${ytapikey}`,
                            }
                        },
                    },
                });

                songs.push(song);
            });
        } else {
            return await message.channel.send('Eu não consigo clicar velho.');
        }

        if (!serverQueue) {
            const sc = serverConfig.get(message.guild.id) ?? serverConfigConstruct(prefix);
            const q = new ServerQueue({message, songs, volume: sc.volume});

            Queue.set(message.guild.id, q);

            try {
                q.connection = await voiceChannel.join();
                q.connection.on('disconnect', async () => {
                    Queue.delete(message.guild.id);
                });

                await playSong(message);
            } catch (err) {
                console.error(err);
                Queue.delete(message.guild.id);
                return await message.channel.send('Eu não consigo clicar velho.');
            }
        } else {
            serverQueue.songs = serverQueue.songs.concat(songs);
            if (songs.length === 1) {
                return await message.channel.send(`**${songs[0].title}** tá na fila, posição ${serverQueue.songs.length}.`);
            }

            return await message.channel.send(`${songs.length} músicas na fila.`);
        }
    },
});

export const np = new Command({
    description: 'Mostra a música que está tocando.',
    usage: 'np',

    /**
     *
     * @param {Message} message
     * @return {Promise<*>}
     */
    fn: async message => {
        const serverQueue = Queue.get(message.guild.id);

        if (!serverQueue) {
            await message.channel.send('Tá limpo vei.');
            return null;
        }

        return await message.channel.send(new MessageEmbed({
            title: 'Que porra de música é essa que tá tocando caraio!',
            url: serverQueue.song.url,
            author: {name: serverQueue.song.addedBy.username, iconURL: serverQueue.song.addedBy.avatarURL()},
            color: {yt: 'RED', sc: 'ORANGE', sp: 'GREEN'}[serverQueue.song.from],
            timestamp: new Date(),
            thumbnail: {url: serverQueue.song.thumbnail},
            description: serverQueue.song.title,
            fields: [
                {name: 'Canal', value: serverQueue.song.channelTitle},
                {name: 'Posição na fila', value: serverQueue.position + 1, inline: true},
                {name: 'Duração', value: parseMS(serverQueue.song.duration * 1000).toString(), inline: true},
            ],
        }));
    },
});

export const pause = new Command({
    description: 'Pausa a música.',
    usage: 'pause',

    /**
     *
     * @param {Message} message
     * @return {Promise<*>}
     */
    fn: async message => {
        const voiceChannel = message.member.voice.channel;
        const serverQueue = Queue.get(message.guild.id);

        if (!voiceChannel) {
            return await message.channel.send('Tá solo né filha da puta.');
        }

        if (!serverQueue) {
            return await message.channel.send('Tá limpo vei.');
        }

        serverQueue.connection.dispatcher.pause();
        serverQueue.playing = false;
        return await message.channel.send(`Vai gankar quem caralho.`);
    },
});

export const resume = new Command({
    description: 'Continua a reprodução da música.',
    usage: 'resume',

    /**
     *
     * @param {Message} message
     * @return {Promise<*>}
     */
    fn: async message => {
        const voiceChannel = message.member.voice.channel;
        const serverQueue = Queue.get(message.guild.id);

        if (!voiceChannel) {
            return await message.channel.send('Tá solo né filha da puta.');
        }

        if (!serverQueue) {
            return await message.channel.send('Tá limpo vei.');
        }

        serverQueue.connection.dispatcher.resume();
        serverQueue.playing = true;
        return await message.channel.send(`Solta o filha da puta pra eu da um tiro na cabeça dele.`);
    },
});

export const seek = new Command({
    description: 'Altera a posição da música. Formato em `segundos`.',
    usage: 'seek [s]',

    /**
     *
     * @param {Message} message
     * @param {string} args
     * @return {Promise<*>}
     */
    fn: async (message, args) => {
        const serverQueue = Queue.get(message.guild.id);

        if (!serverQueue) {
            return await message.channel.send('Tá limpo vei.');
        }

        if (args.length === 0) {
            return await message.channel.send('Sem meu tempo eu não consigo.');
        }

        let s = (Number.isInteger(parseInt(args[0])) && parseInt(args[0]) >= 0) ? parseInt(args[0]) : 0;
        if (s > serverQueue.song.duration) {
            s = serverQueue.song.duration;
        }

        serverQueue.seek = s;
        await serverQueue.connection.dispatcher.end();
    },
});

export const stop = new Command({
    description: 'Limpa a fila e para de tocar.',
    usage: 'stop',

    /**
     *
     * @param {Message} message
     * @return {Promise<*>}
     */
    fn: async message => {
        const voiceChannel = message.member.voice.channel;
        const serverQueue = Queue.get(message.guild.id);

        if (!voiceChannel) {
            return await message.channel.send('Tá solo né filha da puta.');
        }

        if (!serverQueue) {
            return await message.channel.send('Tá limpo vei.');
        }

        serverQueue.songs = [];
        serverQueue.connection.dispatcher.end();
        serverQueue.playing = false;
        return await message.channel.send(`Caralho filha da puta morre logo.`);
    },
});

export const skip = new Command({
    description: 'Pula {n} músicas.',
    usage: 'skip [n]',

    alias: ['next'],

    /**
     *
     * @param {Message} message
     * @param {string[]} args
     * @return {Promise<*>}
     */
    fn: async (message, args) => {
        const voiceChannel = message.member.voice.channel;
        const serverQueue = Queue.get(message.guild.id);

        if (!voiceChannel) {
            return await message.channel.send('Tá solo né filha da puta.');
        }

        if (!serverQueue) {
            return await message.channel.send('Tá limpo vei.');
        }

        let skips = (args.length > 0 && Number.isInteger(parseInt(args[0])) && parseInt(args[0]) > 0) ? parseInt(args[0]) : 1;
        if (skips > serverQueue.songs.length) {
            skips = serverQueue.songs.length;
            serverQueue.playing = false;
        }

        serverQueue.songs.splice(serverQueue.position, skips - 1);
        if (serverQueue.loop) {
            await serverQueue.songs.shift();
        }

        serverQueue.connection.dispatcher.end();

        return await message.channel.send('Pode passar jovi.');
    },
});

export const loop = new Command({
    description: 'Liga ou desliga o modo Repetição.',
    usage: 'loop',

    alias: ['repeat'],

    /**
     *
     * @param {Message} message
     * @return {Promise<*>}
     */
    fn: async message => {
        const serverQueue = Queue.get(message.guild.id);

        if (!serverQueue) {
            return await message.channel.send('Tá limpo vei.');
        }

        serverQueue.loop = !serverQueue.loop;

        if (serverQueue.loop) {
            return await message.channel.send(`Ah Yoda vai toma no cu caraio 2 vezes seguidas.`);
        } else {
            return await message.channel.send(`Tu cancelou o auto ataque vei.`);
        }
    },
});

export const shuffle = new Command({
    description: 'Liga/desliga o modo Aleatório.',
    usage: 'shuffle',

    /**
     *
     * @param {Message} message
     * @return {Promise<*>}
     */
    fn: async message => {
        const serverQueue = Queue.get(message.guild.id);

        if (!serverQueue) {
            return await message.channel.send('Tá limpo vei.');
        }

        serverQueue.shuffle = !serverQueue.shuffle;

        if (serverQueue.shuffle) {
            return await message.channel.send(`Tu vai jogar igual um Deus brother, igual o Faker... Opa.`);
        } else {
            return await message.channel.send(`Voltamos ao assunto, quer jogar igual o Faker...`);
        }
    },
});

export const remove = new Command({
    description: 'Remove uma música da fila.',
    usage: 'remove',

    /**
     *
     * @param {Message} message
     * @param {string[]} args
     * @return {Promise<*>}
     */
    fn: async (message, args) => {
        const serverQueue = Queue.get(message.guild.id);

        if (!serverQueue) {
            return await message.channel.send('Tá limpo vei.');
        }

        let toRemove = (args.length > 0 && Number.isInteger(parseInt(args[0])) && parseInt(args[0]) > 0) ? parseInt(args[0]) : 1;
        if (toRemove >= serverQueue.songs.length) {
            toRemove = serverQueue.songs.length - 1;
        }

        if (toRemove === 0) {
            return await skip.fn(message, ['1']);
        }

        serverQueue.songs.splice(toRemove, 1);

        return await message.channel.send('Cospe esse filha da puta porra.');
    },
});

export const volume = new Command({
    description: 'Mostra/altera o volume (0-100).',
    usage: 'volume [v]',

    /**
     *
     * @param {Message} message
     * @param {string[]} args
     * @return {Promise<*>}
     */
    fn: async (message, args) => {
        const serverQueue = Queue.get(message.guild.id);
        const sc = serverConfig.get(message.guild.id) ?? serverConfigConstruct(prefix);

        if (args.length === 0) {
            return await message.channel.send(`Volume: ${sc.volume}`);
        }

        let volume = (args.length > 0 && Number.isInteger(parseInt(args[0])) && parseInt(args[0]) >= 0) ? parseInt(args[0]) : 0;
        if (volume > 100) {
            volume = 100;
        }

        if (serverQueue) {
            serverQueue.volume = volume;
            serverQueue.connection.dispatcher.setVolume(serverQueue.volume / 100);
        }

        sc.volume = volume;
        serverConfig.set(message.guild.id, sc);
        await saveServerConfig(database_url, message.guild.id, sc);

        return await message.channel.send('Aumenta essa porra aí.');
    },
});

export const queue = new Command({
    description: 'Mostra a fila.',
    usage: 'queue',

    /**
     *
     * @param {Message} message
     * @return {Promise<*>}
     */
    fn: async message => {
        const serverQueue = Queue.get(message.guild.id);

        if (!serverQueue) {
            return await message.channel.send('Tá limpo vei.');
        }

        const songs = serverQueue.songs.map((s, i) => {
            return {name: `${i + 1}: [${s.title}](${s.url})`, value: s.channelTitle}
        });

        return await pageEmbed(message, {title: 'Fila tá assim lek', content: songs});
    },
});
