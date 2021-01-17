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
import {prefix, highWaterMark, dlChunkSize, scclientID, spclientID, spsecret, ytapikey} from "../../config.js";
import {
    getPlaylistItems,
    getSpotifyPlaylistItems,
    isAsync,
    isValidHttpURL,
    searchVideo,
    videoInfo
} from "../../lib/utils.js";
import Message from "../../lib/Message.js";
import Command from "../../lib/Command.js";
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
 * @param {Message} message
 * @return {Promise<*>}
 */
async function playSong(message) {
    const sc = serverConfig.get(message.guild.id);
    const serverQueue = queue.get(message.guild.id);

    if (!serverQueue) {
        return;
    }

    await serverQueue.deletePending();

    if (serverQueue.songs.length === 0) {
        serverQueue.connection.removeAllListeners('disconnect');
        queue.delete(message.guild.id);
        return;
    }

    if (serverQueue.song.findOnYT) {
        const msg = await message.channel.send(i18n('music.play.searchingYT', sc?.lang));
        const found = await findOnYT(serverQueue.song);
        await msg.delete().catch(() => {

        });

        if (!found) {
            serverQueue.toDelete = await message.channel.send(i18n('music.play.nothingFound', sc?.lang));
            serverQueue.songs.shift();
            return await playSong(message);
        }

        serverQueue.song = found;
    }

    serverQueue.playing = true;

    serverQueue.song.stream = await serverQueue.song.fn(serverQueue.song.url, serverQueue.song.options);

    serverQueue.player = serverQueue.connection.play(serverQueue.song.stream, {
        seek: serverQueue.seek,
        volume: serverQueue.volume / 100,
        highWaterMark,
    }).on('finish', async () => {
        serverQueue.playing = false;

        // Why I didn't write "!serverQueue"? Because 0 is also false, but a valid value from .seek
        if (serverQueue.seek === undefined) {
            serverQueue.startTime = 0;

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
            title: i18n('music.play.errorEmbedTitle', sc?.lang),
            author: {name: message.client.user.username, iconURL: message.client.user.avatarURL()},
            timestamp: new Date(),
            description: i18n('music.play.errorEmbedDescription', sc?.lang, {e, song: serverQueue.song}),
        }));

        serverQueue.songs.shift();
        await playSong(message);
    });

    if (!serverQueue.connection.dispatcher) {
        await message.channel.send(new MessageEmbed({
            title: i18n('music.play.errorEmbedTitle', sc?.lang),
            author: {name: message.client.user.username, iconURL: message.client.user.avatarURL()},
            timestamp: new Date(),
        }));

        serverQueue.songs.shift();
        await playSong(message);
    }

    serverQueue.seek = undefined;
    serverQueue.toDelete = await nowplaying.fn(message);
}

/**
 *
 * @param {Song} song
 * @return {Promise<Song|null>}
 */
async function findOnYT(song) {
    const url = ((await searchVideo(`${song.uploader} - ${song.title} Provided to YouTube by`, {
        key: ytapikey,
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
    const songInfo = (await videoInfo(VideoId, {key: ytapikey}).catch(e => {
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
                    Authorization: `Bearer ${ytapikey}`,
                }
            },
        },
    });
}

export default new Command({
    description: {
        en_US: 'Adds a music/playlist in the queue. Use `/playlist` to search for playlists.',
        pt_BR: 'Adiciona uma música/playlist na fila. `/playlist` para procurar por playlists.',
    },
    usage: 'play [/playlist] [youtube_url|q]',

    aliases: ['p'],

    botPermissions: {
        text: ['EMBED_LINKS'],
        voice: ['CONNECT', 'SPEAK'],
    },

    /**
     *
     * @this {Command}
     * @param {Message} message
     * @param {string[]} args
     * @return {Promise<*>}
     */
    async fn(message, args) {
        const sc = serverConfig.get(message.guild.id) ?? new ServerConfig({guild: message.guild.id, prefix});
        const serverQueue = queue.get(message.guild.id);

        await this.checkVoiceChannel(message);

        await this.checkPermissions(message);

        /**
         * @type {'video'|'playlist'}
         */
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
            return await message.channel.send(i18n('music.play.noLink', sc?.lang));
        }

        const songs = [];
        const url = isValidHttpURL(args[0]) ? args[0] : ((await searchVideo(args.join(' '), {
            key: ytapikey,
            regionCode: 'us',
            type: kind,
            part: ['id'],
            videoEmbeddable: kind === 'video' ? true : 'any',
        }))[0] ?? {url: null}).url;

        if (!url) {
            return await message.channel.send(i18n('music.play.nothingFound', sc?.lang));
        }

        if (url.match(/youtube.com|youtu.be/gmu)) {
            if (url.match(/([&?])list=[^&#]+/gmu)) {
                const {PlaylistId} = /[&?]list=(?<PlaylistId>[^&#]+)/gmu.exec(url).groups;
                if (!PlaylistId.startsWith('PL')) {
                    return await message.channel.send(i18n('music.play.youtubeMix', sc?.lang));
                }

                const plSongs = await getPlaylistItems(PlaylistId, {
                    key: ytapikey,
                }).catch(e => {
                    console.error(e);
                    return null;
                });

                if (!plSongs) {
                    return await message.channel.send(i18n('music.play.error', sc?.lang));
                }

                const songsInfo = await videoInfo(plSongs.map(s => s.snippet.resourceId.videoId), {key: ytapikey}).catch(e => {
                    console.error(e);
                    return null;
                });

                if (!songsInfo) {
                    return await message.channel.send(i18n('music.play.error', sc?.lang));
                }

                songsInfo.forEach(songInfo => {
                    const song = new Song({
                        title: songInfo.snippet.title,
                        url: songInfo.url,
                        uploader: songInfo.snippet.channelTitle,
                        thumbnail: songInfo.snippet.thumbnails.high.url,
                        duration: songInfo.duration,
                        from: 'yt',
                        addedBy: message.author,
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
                                    Authorization: `Bearer ${ytapikey}`,
                                }
                            },
                        },
                    });

                    songs.push(song);
                });
            } else if (url.match(/(\/watch\?v=|youtu.be\/)/gmu)) {
                const {VideoId} = /(\/watch\?v=|youtu.be\/)(?<VideoId>[^?&#]+)/gmu.exec(url).groups;
                const songInfo = (await videoInfo(VideoId, {key: ytapikey}).catch(e => {
                    console.error(e);
                    return [null];
                }))[0];

                if (!songInfo) {
                    return await message.channel.send(i18n('music.play.error', sc?.lang));
                }

                const song = new Song({
                    title: songInfo.snippet.title,
                    url: songInfo.url,
                    uploader: songInfo.snippet.channelTitle,
                    thumbnail: songInfo.snippet.thumbnails.high.url,
                    duration: songInfo.duration,
                    from: 'yt',
                    addedBy: message.author,
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
                return await message.channel.send(i18n('music.play.error', sc?.lang));
            }

            const song = new Song({
                title: songInfo.title,
                url: songInfo.permalink_url,
                uploader: songInfo.user.username,
                thumbnail: songInfo.artwork_url,
                duration: songInfo.duration / 1000,
                from: 'sc',
                addedBy: message.author,
                fn: async (url, options) => await scdl.download(url, options).then(stream => stream),
                options: scclientID,
            });

            songs.push(song);
        } else if (url.match(/spotify.com\/playlist\/[^?#]+/gmu)) {
            const {PlaylistId} = /spotify.com\/playlist\/(?<PlaylistId>[^?#]+)/gmu.exec(url).groups;
            const plSongs = (await getSpotifyPlaylistItems(spotifyAPI, PlaylistId).catch(async e => {
                console.error(e);
                return null;
            }));

            if (!plSongs) {
                return await message.channel.send(i18n('music.play.error', sc?.lang));
            }

            plSongs.forEach(plSong => {
                const song = new Song({
                    title: plSong.name,
                    uploader: plSong.artists,
                    findOnYT: true,
                    from: 'sp',
                    addedBy: message.author,
                });

                songs.push(song);
            });
        } else {
            return await message.channel.send(i18n('music.play.error', sc?.lang));
        }

        if (!serverQueue) {
            const q = new ServerQueue({songs, volume: sc.volume});

            queue.set(message.guild.id, q);

            try {
                q.connection = await message.member.voice.channel.join();
                q.connection.on('disconnect', async () => {
                    await q.deletePending();
                    queue.delete(message.guild.id);
                });

                await playSong(message);
            } catch (err) {
                console.error(err);
                queue.delete(message.guild.id);
                return await message.channel.send(i18n('music.play.error', sc?.lang));
            }
        } else {
            serverQueue.songs = serverQueue.songs.concat(songs);
            if (songs.length === 1) {
                return await message.channel.send(i18n('music.play.playingOne', sc?.lang, {songTitle: songs[0].title, position: serverQueue.songs.length}));
            }

            return await message.channel.send(i18n('music.play.playingMany', sc?.lang, {n: songs.length}));
        }
    },
});
