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

import {MessageEmbed} from "discord.js";
import ytdl from "ytdl-core";
import _scdl from "soundcloud-downloader";
import SpotifyWebAPI from "spotify-web-api-node";

import {queue, serverConfig} from "../../global.js";
import {prefix, highWaterMark, dlChunkSize, scclientID, spclientID, spsecret, ytapikeys, ytcookies} from "../../config.js";
import {
    getPlaylistItems,
    getSpotifyPlaylistItems,
    isValidHttpURL,
    searchVideo,
    videoInfo
} from "../../lib/utils.js";
import Message from "../../lib/Message.js";
import Command, {OptionType} from "../../lib/Command.js";
import Song from "../../lib/Song.js";
import ServerQueue from "../../lib/ServerQueue.js";
import ServerConfig from "../../lib/ServerConfig.js";
import nowplaying from "./nowplaying.js";
import i18n from "../../lang/lang.js";

const scdl = _scdl.default;

const spotifyAPI = new SpotifyWebAPI({
    clientId: spclientID,
    clientSecret: spsecret,
    redirectUri: 'http://jukesbox.herokuapp.com',
});

/**
 *
 * @param {Object} message
 * @param {import('../../lib/Client.js').default} message.client
 * @param {import('discord.js').Guild} message.guild
 * @param {import('discord.js').TextChannel} message.channel
 * @param {import('discord.js').User} message.author
 * @param {import('discord.js').GuildMember} message.member
 * @param {Function} message.sendMessage
 * @param {number} [tries=3]
 * @return {Promise<*>}
 */
async function playSong({client, guild, channel, author, member, sendMessage}, tries = 3) {
    const sc = serverConfig.get(guild.id);
    const serverQueue = queue.get(guild.id);

    if (!serverQueue) {
        return null;
    }

    await serverQueue.deletePending();

    if (tries <= 0) {
        serverQueue.songs.shift();
    }

    if (serverQueue.songs.length === 0) {
        serverQueue.connection.removeAllListeners('disconnect');
        queue.delete(guild.id);
        return null;
    }

    if (serverQueue.song.findOnYT) {
        const msg = await sendMessage({content: i18n('music.play.searchingYT', sc?.lang)});
        const found = await findOnYT(serverQueue.song);
        await msg.delete().catch(() => {

        });

        if (!found) {
            serverQueue.toDelete = await sendMessage({content: i18n('music.play.nothingFound', sc?.lang)});
            serverQueue.songs.shift();
            return await playSong({client, guild, channel, author, member, sendMessage});
        }

        serverQueue.song = found;
    }

    serverQueue.playing = true;

    serverQueue.song.stream = await serverQueue.song.fn(serverQueue.song.url, serverQueue.song.options);

    serverQueue.startTime = serverQueue.song.seek ?? 0;

    serverQueue.player = serverQueue.connection.play(serverQueue.song.stream, {
        seek: serverQueue.song.seek,
        volume: serverQueue.volume / 100,
        highWaterMark: 1 << 10,
    }).on('finish', async () => {
        serverQueue.playing = false;

        // Why I didn't write "!serverQueue"? Because 0 is also false, but a valid value from .seek
        if (serverQueue.song?.seek === undefined) {
            if (!serverQueue.loop) {
                serverQueue.songs.splice(serverQueue.position, 1);
            }

            serverQueue.position = 0;
            if (serverQueue.shuffle) {
                serverQueue.position = Math.floor(Math.random() * serverQueue.songs.length);
            }
        }

        await playSong({client, guild, channel, author, member, sendMessage});
    }).on('error', async e => {
        console.error(e);

        if (e.message.includes('Status code: 403')) {
            await playSong({client, guild, channel, author, member, sendMessage}, tries - 1);
            return null;
        }

        await sendMessage({
            embeds: [new MessageEmbed({
                title: i18n('music.play.errorEmbedTitle', sc?.lang),
                author: {name: client.user.username, iconURL: client.user.avatarURL()},
                timestamp: new Date(),
                description: i18n('music.play.errorEmbedDescription', sc?.lang, {e, song: serverQueue.song}),
            })]
        });

        serverQueue.songs.shift();
        await playSong({client, guild, channel, author, member, sendMessage});
    });

    if (!serverQueue.connection.dispatcher) {
        await sendMessage({
            embeds: [new MessageEmbed({
                title: i18n('music.play.errorEmbedTitle', sc?.lang),
                author: {name: client.user.username, iconURL: client.user.avatarURL()},
                timestamp: new Date(),
            })]
        });

        serverQueue.songs.shift();
        await playSong({client, guild, channel, author, member, sendMessage});
    }

    serverQueue.song.seek = undefined;
    serverQueue.toDelete = await sendMessage(await nowplaying.fn({client, guild, channel, author, member, sendMessage}, []));

    if (serverQueue.song?.uploader.toUpperCase().includes('JUKES') || serverQueue.song?.title.toUpperCase().includes('JUKES')) {
        await sendMessage({content: 'Mec.'});
    }
}

/**
 *
 * @param {Song} song
 * @return {Promise<Song|null>}
 */
async function findOnYT(song) {
    const url = ((await searchVideo(`${song.uploader} - ${song.title} Provided to YouTube by`, {
        keys: ytapikeys,
        regionCode: 'us',
        type: 'video',
        part: ['id'],
        videoEmbeddable: true,
    }).catch(e => {
        console.error(e);
        return [null];
    }))[0] ?? {url: null}).url;

    if (!url) {
        return null;
    }

    const {VideoId} = /(\/watch\?v=|youtu.be\/)(?<VideoId>[^?&#]+)/gmu.exec(url).groups;
    const songInfo = (await videoInfo(VideoId, {keys: ytapikeys}).catch(e => {
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
            highWaterMark,
            quality: songInfo.duration === 0 ? null : 'highestaudio',
            dlChunkSize,
            isHLS: songInfo.duration === 0,
            requestOptions: {
                host: 'jukesbox.herokuapp.com',
                headers: {
                    cookie: ytcookies,
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
     * @param {Function} message.sendMessage
     * @param {string[]} args
     * @return {Promise<{content?: string, embeds?: import('discord.js').MessageEmbed[], lockAuthor?: boolean, reactions?: string[], onReact?: Function, onEndReact?: Function, timer?: number, deleteAfter?: boolean}>}
     */
    async fn({client, guild, channel, author, member, sendMessage}, args) {
        const sc = serverConfig.get(guild.id) ?? new ServerConfig({guild: guild.id, prefix});
        const serverQueue = queue.get(guild.id);

        await this.checkVoiceChannel({guild, member});

        await this.checkPermissions({guild, channel, author, member});

        /**
         * @type {'video'|'playlist'}
         */
        let kind = 'video';
        if (args[-1]) {
            kind = args[-1];

            args[-1] = undefined;
        }

        if (!args[0]) {
            return {content: i18n('music.play.noLink', sc?.lang)};
        }

        const songs = [];
        const url = isValidHttpURL(args[0]) ? args[0] : ((await searchVideo(args.join(' '), {
            keys: ytapikeys,
            regionCode: 'us',
            type: kind,
            part: ['id'],
            videoEmbeddable: kind === 'video' ? true : 'any',
        }))[0] ?? {url: null}).url;

        if (!url) {
            return {content: i18n('music.play.nothingFound', sc?.lang)};
        }

        if (url.match(/youtube.com|youtu.be/gmu)) {
            if (url.match(/([&?])list=[^&#]+/gmu)) {
                const {PlaylistId} = /[&?]list=(?<PlaylistId>[^&#]+)/gmu.exec(url)?.groups ?? {};
                const {Index} = /[&?]index=(?<Index>[^&#]+)/gmu.exec(url)?.groups ?? {};
                const {T} = /[&?]t=(?<T>[^&#]+)/gmu.exec(url)?.groups ?? {};

                if (!PlaylistId.startsWith('PL')) {
                    return {content: i18n('music.play.youtubeMix', sc?.lang)};
                }

                const plSongs = await getPlaylistItems(PlaylistId, {
                    keys: ytapikeys,
                }).catch(e => {
                    console.error(e);
                    return null;
                });

                if (!plSongs) {
                    return {content: i18n('music.play.error', sc?.lang)};
                }

                const songsInfo = await videoInfo(plSongs.map(s => s.snippet.resourceId.videoId), {keys: ytapikeys}).catch(e => {
                    console.error(e);
                    return null;
                });

                if (!songsInfo) {
                    return {content: i18n('music.play.error', sc?.lang)};
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
                            highWaterMark,
                            quality: songInfo.duration === 0 ? null : 'highestaudio',
                            dlChunkSize,
                            isHLS: songInfo.duration === 0,
                            requestOptions: {
                                host: 'jukesbox.herokuapp.com',
                                headers: {
                                    cookie: ytcookies,
                                }
                            },
                        },
                    });

                    songs.push(song);
                });
            } else if (url.match(/(\/watch\?v=|youtu.be\/)/gmu)) {
                const {VideoId} = /(\/watch\?v=|youtu.be\/)(?<VideoId>[^?&#]+)/gmu.exec(url)?.groups ?? {};
                const {T} = /[&?]t=(?<T>[^&#]+)/gmu.exec(url)?.groups ?? {};
                const songInfo = (await videoInfo(VideoId, {keys: ytapikeys}).catch(e => {
                    console.error(e);
                    return [null];
                }))[0];

                if (!songInfo) {
                    return {content: i18n('music.play.error', sc?.lang)};
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
                        highWaterMark,
                        quality: songInfo.duration === 0 ? null : 'highestaudio',
                        dlChunkSize,
                        isHLS: songInfo.duration === 0,
                        requestOptions: {
                            host: 'jukesbox.herokuapp.com',
                            headers: {
                                cookie: ytcookies,
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
                return {content: i18n('music.play.error', sc?.lang)};
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
                options: scclientID,
            });

            songs.push(song);
        } else if (url.match(/spotify.com\/playlist\/[^?#]+/gmu)) {
            const {PlaylistId} = /spotify.com\/playlist\/(?<PlaylistId>[^?#]+)/gmu.exec(url)?.groups ?? {};
            const plSongs = (await getSpotifyPlaylistItems(spotifyAPI, PlaylistId).catch(async e => {
                console.error(e);
                return null;
            }));

            if (!plSongs) {
                return {content: i18n('music.play.error', sc?.lang)};
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
            return {content: i18n('music.play.error', sc?.lang)};
        }

        if (!serverQueue) {
            const q = new ServerQueue({songs, volume: sc.volume});

            queue.set(guild.id, q);

            try {
                q.connection = await member.voice.channel.join();
                await q.connection.voice?.setSelfDeaf(true);

                q.connection.on('disconnect', async () => {
                    await q.deletePending();
                    queue.delete(guild.id);
                });

                await playSong({client, guild, channel, author, member, sendMessage});
            } catch (err) {
                console.error(err);
                queue.delete(guild.id);
                return {content: i18n('music.play.error', sc?.lang)};
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

            return {content: i18n('music.play.playingMany', sc?.lang, {n: songs.length})};
        }
    },
});
