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
 * @file Music plugin (play command)
 *
 * @author Dhiego Cassiano Fogaça Barbosa <modscleo4@outlook.com>
 */

'use strict';

import MessageEmbed from "../../lib/MessageEmbed.js";
import { createAudioPlayer, demuxProbe, VoiceConnectionStatus, entersState, createAudioResource, AudioPlayerStatus, NoSubscriberBehavior } from "@discordjs/voice";
import ytdl from "ytdl-core";
import _scdl from "soundcloud-downloader";
import SpotifyWebAPI from "spotify-web-api-node";
import { Converter } from "ffmpeg-stream";

import { queue, serverConfig, voiceConnections } from "../../global.js";
import { options } from "../../config.js";
import {
    getPlaylistItems,
    getSpotifyPlaylistItems,
    isValidHttpURL,
    searchVideo,
    sleep,
    videoInfo
} from "../../lib/utils.js";
import Command, { OptionType } from "../../lib/Command.js";
import Song from "../../lib/Song.js";
import ServerQueue from "../../lib/ServerQueue.js";
import ServerConfig from "../../lib/ServerConfig.js";
import nowplaying from "./nowplaying.js";
import i18n from "../../lang/lang.js";
import CommandExecutionError from "../../errors/CommandExecutionError.js";
import join from "./join.js";

const scdl = _scdl.default;

const spotifyAPI = new SpotifyWebAPI({
    clientId: options.spclientID,
    clientSecret: options.spsecret,
    redirectUri: 'http://www.youtube.com',
});

const MAX_TRIES = 3;

/**
 *
 * @param {import('node:stream').Readable} readableStream
 * @return {Promise<import('@discordjs/voice').AudioResource>}
 */
async function probeAndCreateResource(readableStream) {
    const { stream, type } = await demuxProbe(readableStream);
    return createAudioResource(stream, { inputType: type });
}

/**
 *
 * @param {Object} message
 * @param {import('../../lib/Client.js').default} message.client
 * @param {import('discord.js').Guild} message.guild
 * @param {import('discord.js').TextChannel} message.channel
 * @param {import('discord.js').User} message.author
 * @param {import('discord.js').GuildMember} message.member
 * @param {import('../../lib/Command.js').SendMessageFn} message.sendMessage
 * @param {number} [tries=3]
 * @return {Promise<*>}
 */
async function playSong({ client, guild, channel, author, member, sendMessage }, tries = MAX_TRIES) {
    const sc = serverConfig.get(guild.id);
    const serverQueue = queue.get(guild.id);

    if (!serverQueue) {
        return null;
    }

    await serverQueue.deletePending();

    if (serverQueue.songs.length === 0) {
        serverQueue.connection.removeAllListeners(VoiceConnectionStatus.Disconnected);
        queue.delete(guild.id);
        return null;
    }

    if (serverQueue.song.findOnYT) {
        const msg = await sendMessage({ content: i18n('music.play.searchingYT', sc?.lang) });
        const found = await findOnYT(serverQueue.song);
        await msg.delete().catch(() => { });

        if (!found) {
            serverQueue.toDelete.push(await sendMessage({ content: i18n('music.play.nothingFound', sc?.lang) }));
            serverQueue.next();
            return await playSong({ client, guild, channel, author, member, sendMessage });
        }

        serverQueue.song = found;
    }

    serverQueue.song.stream = await serverQueue.song.fn(serverQueue.song.url, serverQueue.song.options);
    if (!serverQueue.song.stream) {
        await sendMessage({
            embeds: [new MessageEmbed({
                title: i18n('music.play.errorEmbedTitle', sc?.lang),
                author: { name: client.user.username, icon_url: client.user.avatarURL() },
                timestamp: new Date().toUTCString(),
            })]
        });

        serverQueue.next();
        await playSong({ client, guild, channel, author, member, sendMessage });
        return null;
    }

    if (serverQueue.runSeek || serverQueue.startTime > 0) {
        const converter = new Converter();

        serverQueue.song.stream.pipe(converter.createInputStream({
            f: 'webm',
            ss: serverQueue.song.seek,
        }));

        serverQueue.song.stream = converter.createOutputStream({
            f: 'webm',
        });

        converter.run();
    }

    serverQueue.resource = await probeAndCreateResource(serverQueue.song.stream);

    serverQueue.player = createAudioPlayer({ behaviors: { noSubscriber: NoSubscriberBehavior.Stop } });
    voiceConnections.get(guild.id)?.subscribe(serverQueue.player);

    let tm = null;

    serverQueue.player.once(AudioPlayerStatus.Idle, async () => {
        tm = setTimeout(async () => {
            if (!tm) {
                return;
            }

            serverQueue.playing = false;

            serverQueue.song?.stream?.removeAllListeners('error');
            serverQueue.player.removeAllListeners('error');

            if (!serverQueue.runSeek) {
                serverQueue.next();
            }

            await playSong({ client, guild, channel, author, member, sendMessage });
        }, 250);
    });

    let handlingError = false;
    const errorHandler = async e => {
        if (serverQueue.player.listenerCount('error') === 0 || handlingError) {
            console.error(e);
            return null;
        }

        handlingError = true;

        if (tm) {
            clearTimeout(tm);
        }

        if (tries > 0) {
            serverQueue.player.removeAllListeners(AudioPlayerStatus.Idle);

            if (serverQueue.resource.playbackDuration && serverQueue.song) {
                if (!serverQueue.song.seek) {
                    serverQueue.song.seek = 0;
                }

                // If at least 10 seconds have passed since the song last failed
                if (serverQueue.resource.playbackDuration > 10000) {
                    tries = MAX_TRIES + 1;
                }

                serverQueue.song.seek += Math.floor(serverQueue.resource.playbackDuration / 1000);
                serverQueue.lastPlaybackTime = serverQueue.resource.playbackDuration + serverQueue.startTime * 1000;
                serverQueue.runSeek = true;
            }

            await playSong({ client, guild, channel, author, member, sendMessage }, tries - 1);
            return null;
        }

        await sendMessage({
            embeds: [new MessageEmbed({
                title: i18n('music.play.errorEmbedTitle', sc?.lang),
                author: { name: client.user.username, icon_url: client.user.avatarURL() },
                timestamp: new Date().toUTCString(),
                description: i18n('music.play.errorEmbedDescription', sc?.lang, { e, song: serverQueue.song }),
            })]
        });

        serverQueue.next();
        await playSong({ client, guild, channel, author, member, sendMessage });
    };

    serverQueue.song.stream.once('error', errorHandler);
    serverQueue.player.once('error', errorHandler);

    if (!serverQueue.player) {
        await sendMessage({
            embeds: [new MessageEmbed({
                title: i18n('music.play.errorEmbedTitle', sc?.lang),
                author: { name: client.user.username, icon_url: client.user.avatarURL() },
                timestamp: new Date().toUTCString(),
            })]
        });

        serverQueue.next();
        await playSong({ client, guild, channel, author, member, sendMessage });
        return null;
    }

    serverQueue.player.play(serverQueue.resource);
    serverQueue.playing = true;

    serverQueue.runSeek = false;
    serverQueue.lastPlaybackTime = 0;
    serverQueue.toDelete.push(await sendMessage(await nowplaying.fn({ client, guild, channel, author, member, sendMessage }, [])));

    if (serverQueue.song?.uploader.toUpperCase().includes('JUKES') || serverQueue.song?.title.toUpperCase().includes('JUKES')) {
        serverQueue.toDelete.push(await sendMessage({ content: 'Mec.' }));
    }
}

/**
 *
 * @param {Song} song
 * @return {Promise<Song|null>}
 */
async function findOnYT(song) {
    const url = ((await searchVideo(`${song.uploader} - ${song.title} Provided to YouTube by`, {
        keys: options.ytapikeys,
        regionCode: 'us',
        type: 'video',
        part: ['id'],
        videoEmbeddable: true,
    }).catch(e => {
        console.error(e);
        return [null];
    }))[0] ?? { url: null }).url;

    if (!url) {
        return null;
    }

    const { VideoId } = /(\/watch\?v=|youtu.be\/)(?<VideoId>[^?&#]+)/gmu.exec(url).groups;
    const songInfo = (await videoInfo(VideoId, { keys: options.ytapikeys }).catch(e => {
        console.error(e);
        return [null];
    }))[0];

    if (!songInfo) {
        return null;
    }

    return new Song({
        title: songInfo.snippet.title,
        url: songInfo.url,
        uploader: songInfo.snippet.channelTitle,
        thumbnail: songInfo.snippet.thumbnails.high.url,
        duration: songInfo.duration,
        from: song.from,
        addedBy: song.addedBy,
        fn: ytdl,
        options: {
            filter: songInfo.duration === 0 ? null : 'audioonly',
            highWaterMark: options.highWaterMark,
            quality: songInfo.duration === 0 ? null : 'highestaudio',
            dlChunkSize: options.dlChunkSize,
            isHLS: songInfo.duration === 0,
            requestOptions: {
                host: 'www.youtube.com',
                headers: {
                    cookie: options.ytcookies,
                }
            },
        },
    });
}

export default new Command({
    description: {
        en_US: 'Adds a music in the queue.',
        pt_BR: 'Adiciona uma música na fila.',
    },
    options: [
        {
            name: 'youtube_url',
            description: 'YouTube URL or Query String',
            type: OptionType.STRING,
            required: true,
        }
    ],

    aliases: ['p'],

    botPermissions: {
        text: ['EMBED_LINKS'],
        voice: ['CONNECT', 'SPEAK'],
    },

    /**
     *
     * @this {Command}
     * @param {Object} message
     * @param {import('../../lib/Client.js').default} message.client
     * @param {import('discord.js').Guild} message.guild
     * @param {import('discord.js').TextChannel} message.channel
     * @param {import('discord.js').User} message.author
     * @param {import('discord.js').GuildMember} message.member
     * @param {import('../../lib/Command.js').SendMessageFn} message.sendMessage
     * @param {string[]} args
     * @return {Promise<import('../../lib/Command.js').CommandReturn>}
     */
    async fn({ client, guild, channel, author, member, sendMessage }, args) {
        const sc = serverConfig.get(guild.id) ?? new ServerConfig({ guild: guild.id, prefix: options.prefix });
        const serverQueue = queue.get(guild.id);

        await this.checkVoiceChannel({ guild, member });

        await this.checkPermissions({ guild, channel, author, member });

        /**
         * @type {'video'|'playlist'}
         */
        let kind = 'video';
        if (args[-1]) {
            kind = args[-1];

            args[-1] = undefined;
        }

        if (!args[0]) {
            throw new CommandExecutionError({ content: i18n('music.play.noLink', sc?.lang) });
        }

        const songs = [];
        const url = isValidHttpURL(args[0]) ? args[0] : ((await searchVideo(args.join(' '), {
            keys: options.ytapikeys,
            regionCode: 'us',
            type: kind,
            part: ['id'],
            videoEmbeddable: kind === 'video' ? true : 'any',
        }))[0] ?? { url: null }).url;

        if (!url) {
            throw new CommandExecutionError({ content: i18n('music.play.nothingFound', sc?.lang) });
        }

        if (url.match(/youtube.com|youtu.be/gmu)) {
            if (url.match(/([&?])list=[^&#]+/gmu)) {
                const { PlaylistId } = /[&?]list=(?<PlaylistId>[^&#]+)/gmu.exec(url)?.groups ?? {};
                const { Index } = /[&?]index=(?<Index>[^&#]+)/gmu.exec(url)?.groups ?? {};
                const { T } = /[&?]t=(?<T>[^&#]+)/gmu.exec(url)?.groups ?? {};

                if (!PlaylistId.startsWith('PL')) {
                    throw new CommandExecutionError({ content: i18n('music.play.youtubeMix', sc?.lang) });
                }

                const plSongs = await getPlaylistItems(PlaylistId, {
                    keys: options.ytapikeys,
                }).catch(e => {
                    console.error(e);
                    return null;
                });

                if (!plSongs) {
                    throw new CommandExecutionError({ content: i18n('music.play.error', sc?.lang) });
                }

                const songsInfo = await videoInfo(plSongs.map(s => s.snippet.resourceId.videoId), { keys: options.ytapikeys }).catch(e => {
                    console.error(e);
                    return null;
                });

                if (!songsInfo) {
                    throw new CommandExecutionError({ content: i18n('music.play.error', sc?.lang) });
                }

                songsInfo.forEach((songInfo, i) => {
                    const song = new Song({
                        title: songInfo.snippet.title,
                        url: songInfo.url,
                        uploader: songInfo.snippet.channelTitle,
                        thumbnail: songInfo.snippet.thumbnails.high.url,
                        duration: songInfo.duration,
                        from: 'yt',
                        addedBy: author,
                        seek: (i + 1 === (parseInt(Index) || 1) && parseInt(T)) || undefined,
                        fn: ytdl,
                        options: {
                            filter: songInfo.duration === 0 ? null : 'audioonly',
                            highWaterMark: options.highWaterMark,
                            quality: songInfo.duration === 0 ? null : 'highestaudio',
                            dlChunkSize: options.dlChunkSize,
                            isHLS: songInfo.duration === 0,
                            requestOptions: {
                                host: 'www.youtube.com',
                                headers: {
                                    cookie: options.ytcookies,
                                }
                            },
                        },
                    });

                    songs.push(song);
                });
            } else if (url.match(/(\/watch\?v=|youtu.be\/|youtube.com\/shorts\/)/gmu)) {
                const { VideoId } = /(\/watch\?v=|youtu.be\/|youtube.com\/shorts\/)(?<VideoId>[^?&#]+)/gmu.exec(url)?.groups ?? {};
                const { T } = /[&?]t=(?<T>[^&#]+)/gmu.exec(url)?.groups ?? {};
                const songInfo = (await videoInfo(VideoId, { keys: options.ytapikeys }).catch(e => {
                    console.error(e);
                    return [null];
                }))[0];

                if (!songInfo) {
                    throw new CommandExecutionError({ content: i18n('music.play.error', sc?.lang) });
                }

                const song = new Song({
                    title: songInfo.snippet.title,
                    url: songInfo.url,
                    uploader: songInfo.snippet.channelTitle,
                    thumbnail: songInfo.snippet.thumbnails.high.url,
                    duration: songInfo.duration,
                    from: 'yt',
                    addedBy: author,
                    seek: parseInt(T) || undefined,
                    fn: ytdl,
                    options: {
                        // If the song duration is 0s, it's a livestream
                        filter: songInfo.duration === 0 ? null : 'audioonly',
                        highWaterMark: options.highWaterMark,
                        quality: songInfo.duration === 0 ? null : 'highestaudio',
                        dlChunkSize: options.dlChunkSize,
                        isHLS: songInfo.duration === 0,
                        requestOptions: {
                            host: 'www.youtube.com',
                            headers: {
                                cookie: options.ytcookies,
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
                throw new CommandExecutionError({ content: i18n('music.play.error', sc?.lang) });
            }

            const song = new Song({
                title: songInfo.title,
                url: songInfo.permalink_url,
                uploader: songInfo.user.username,
                thumbnail: songInfo.artwork_url,
                duration: songInfo.duration / 1000,
                from: 'sc',
                addedBy: author,
                fn: async (url, options) => await scdl.download(url, options).then(stream => stream),
                options: options.scclientID,
            });

            songs.push(song);
        } else if (url.match(/spotify.com\/playlist\/[^?#]+/gmu)) {
            const { PlaylistId } = /spotify.com\/playlist\/(?<PlaylistId>[^?#]+)/gmu.exec(url)?.groups ?? {};
            const plSongs = (await getSpotifyPlaylistItems(spotifyAPI, PlaylistId).catch(async e => {
                console.error(e);
                return null;
            }));

            if (!plSongs) {
                throw new CommandExecutionError({ content: i18n('music.play.error', sc?.lang) });
            }

            plSongs.forEach(plSong => {
                const song = new Song({
                    title: plSong.name,
                    uploader: plSong.artists,
                    findOnYT: true,
                    from: 'sp',
                    addedBy: author,
                });

                songs.push(song);
            });
        } else {
            throw new CommandExecutionError({ content: i18n('music.play.error', sc?.lang) });
        }

        if (!serverQueue) {
            const q = new ServerQueue({ songs, volume: sc.volume });

            queue.set(guild.id, q);

            try {
                q.connection = client.getVoiceChannel(guild.id);
                if (!q.connection) {
                    q.connection = client.joinVoiceChannel({ channelId: member.voice.channel.id, guildId: guild.id, adapterCreator: guild.voiceAdapterCreator, selfDeaf: true });

                    await new Promise((resolve, reject) => q.connection.on(VoiceConnectionStatus.Ready, resolve));
                }

                q.connection.on(VoiceConnectionStatus.Disconnected, async () => {
                    try {
                        await Promise.race([
                            entersState(q.connection, VoiceConnectionStatus.Signalling, 5_000),
                            entersState(q.connection, VoiceConnectionStatus.Connecting, 5_000),
                        ]);
                    } catch (error) {
                        await q.deletePending();
                        queue.delete(guild.id);

                        client.leaveVoiceChannel(guild.id);
                    }
                });

                await playSong({ client, guild, channel, author, member, sendMessage });
                return { content: i18n('music.play.success', sc?.lang, { songTitle: songs[0].title }) };
            } catch (err) {
                console.error(err);
                queue.delete(guild.id);
                throw new CommandExecutionError({ content: i18n('music.play.error', sc?.lang) });
            }
        } else {
            serverQueue.songs = serverQueue.songs.concat(songs);
            if (songs.length === 1) {
                return {
                    content: i18n('music.play.playingOne', sc?.lang, {
                        songTitle: songs[0].title,
                        position: serverQueue.songs.length
                    })
                };
            }

            return { content: i18n('music.play.playingMany', sc?.lang, { n: songs.length }) };
        }
    },
});
