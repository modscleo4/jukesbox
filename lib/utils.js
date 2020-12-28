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
 * @file Utils and helpers
 *
 * @author Dhiego Cassiano Fogaça Barbosa <modscleo4@outlook.com>
 */

'use strict';

import {MessageEmbed} from "discord.js";
import {google, youtube_v3} from "googleapis";
import {URL} from "url";
import SpotifyWebAPI from "spotify-web-api-node";

import Message from "./Message.js";
import DB from "./DB.js";
import ServerConfig from "./ServerConfig.js";

const youtube_api = google.youtube('v3');

/**
 *
 * @param {string} database_url
 * @return {Promise<Map<string, ServerConfig>>}
 */
export async function loadServerConfig(database_url) {
    const db = new DB(database_url);

    const ret = new Map();
    const result = (await db.query('SELECT * FROM server_configs')).rows;
    result.forEach(r => {
        const sc = new ServerConfig(r);
        ret.set(r.guild, sc);
    });

    return ret;
}

/**
 *
 * @param {string} string
 * @return {boolean}
 */
export function isValidHttpURL(string) {
    let url;

    try {
        url = new URL(string);
    } catch (_) {
        return false;
    }

    return url.protocol === 'http:' || url.protocol === 'https:';
}

export function isAsync(fn) {
    return fn.constructor.name === 'AsyncFunction';
}

/**
 *
 * @param {string} str
 * @param {number} length
 * @return {string}
 */
export function cutUntil(str, length) {
    if (str.length <= length) {
        return str;
    }

    return `${str.substr(0, length - 3)}...`;
}

/**
 *
 * @param {string} str
 * @return {{years: number, months: number, days: number, hours: number, minutes: number, seconds: number}}
 */
export function parseISO8601(str) {
    const {
        Y,
        M,
        D,
        H,
        m,
        S
    } = /P(?!$)((?<Y>\d+)Y)?((?<M>\d+)M)?((?<D>\d+)D)?(T(?!$)((?<H>\d+)H)?((?<m>\d+)M)?((?<S>\d+)S)?)?/gmu.exec(str).groups;

    return {
        years: parseInt(Y) || 0,
        months: parseInt(M) || 0,
        days: parseInt(D) || 0,
        hours: parseInt(H) || 0,
        minutes: parseInt(m) || 0,
        seconds: parseInt(S) || 0,
    };
}

/**
 *
 * @param {number} ms
 * @return {{hours: number, minutes: number, seconds: number}}
 */
export function parseMS(ms) {
    ms /= 1000;
    const h = Math.floor(ms / 60 / 60);
    const m = Math.floor((ms / 60 / 60 - h) * 60);
    const s = Math.floor(((ms / 60 / 60 - h) * 60 - m) * 60);

    return {
        hours: h,
        minutes: m,
        seconds: s,
        toString() {
            return `${this.hours ?? 0}h ${this.minutes ?? 0}m ${this.seconds ?? 0}s`;
        },
    };
}

/**
 *
 * @param {Message} message
 * @param {Object} params
 * @param {string} params.title
 * @param {string} [params.description=' ']
 * @param {{name: string, value: string, inline?: boolean}[]|Object} params.content
 * @param {boolean} [params.deleteAfter=false]
 * @return {Promise<*>}
 */
export async function pageEmbed(message, {title, description = ' ', content, deleteAfter = false}) {
    if (!Array.isArray(content)) {
        content = Object.keys(content).flatMap(k => [{name: k}, ...content[k]]);
    }

    const maxPerPage = 10;
    const pages = Math.ceil(content.filter(c => c.name !== '__separator').length / maxPerPage);

    function buildEmbed(page) {
        return new MessageEmbed({
            title,
            description: `${description}\n\n${content.slice((page - 1) * maxPerPage, page * maxPerPage).map((
                {
                    name,
                    value
                }) => value ? `**${name}** - ${value}` : `\n**${name}**`).join('\n')}`,
            author: {name: message.client.user.username, iconURL: message.client.user.avatarURL()},
            timestamp: new Date(),
            footer: {text: `Página ${page} de ${pages}`},
        });
    }

    const msg = await message.channel.send(buildEmbed(1));

    /**
     *
     * @param {Message} msg
     * @param {number} page
     */
    async function awaitReactions(msg, page) {
        if (pages === 1) {
            return;
        }

        const reactions = ['⬅️', '➡️'];

        reactions.map(async r => await msg.react(r).catch(() => {

        }));

        await msg.awaitReactions((r, u) => reactions.includes(r.emoji.name) && u.id === message.author.id, {
            max: 1,
            time: 60000,
            errors: ['time'],
        }).then(async collected => {
            const reaction = collected.first();
            page += reaction.emoji.name === '⬅️' ? -1 : 1;
            if (page < 1) {
                page = pages;
            } else if (page > pages) {
                page = 1;
            }

            await msg.reactions.removeAll();

            await new Promise(r => setTimeout(r, 100));
            await msg.edit(buildEmbed(page));

            await awaitReactions(msg, page);
        }).catch(() => {

        });
    }

    await awaitReactions(msg, 1);

    if (deleteAfter && !msg.deleted) {
        await msg.delete().catch(() => {

        });
    }
}

/**
 *
 * @param {string} q
 * @param {Object} params
 * @param {string} params.key
 * @param {string[]} [params.part=['id', 'snippet']]
 * @param {number} [params.maxResults=10]
 * @param {string} [params.order='relevance']
 * @param {string} [params.regionCode='br']
 * @param {('video'|'playlist'|'channel')} [params.type='video']
 * @param {('any'|boolean)} [params.videoEmbeddable='any']
 * @return {Promise<(youtube_v3.Schema$SearchResult&{url: string})[]>}
 */
export async function searchVideo(q, {
    key,
    part = ['id', 'snippet',],
    maxResults = 10,
    order = 'relevance',
    regionCode = 'br',
    type = 'video',
    videoEmbeddable = 'any',
}) {
    return await youtube_api.search.list({
        key,
        part,
        q,
        maxResults,
        order,
        regionCode,
        type,
        videoEmbeddable,
    }).then(response => response.data.items.map(i => ({
        ...i,
        url: (i.id.kind === 'youtube#channel') ? `https://www.youtube.com/channel/${i.id.channelId}` : (i.id.kind === 'youtube#playlist') ? `https://www.youtube.com/playlist?list=${i.id.playlistId}` : `https://www.youtube.com/watch?v=${i.id.videoId}`,
    })));
}

/**
 *
 * @param {string|string[]} id
 * @param {Object} params
 * @param {string} params.key
 * @param {string[]} [params.part]
 * @param {number} [params.maxResults]
 * @param {string} [params.regionCode]
 * @return {Promise<(youtube_v3.Schema$Video&{duration: number, url: string})[]>}
 */
export async function videoInfo(id, {
    key,
    part = ['id', 'snippet', 'contentDetails'],
    maxResults = 50,
    regionCode = 'br'
}) {
    if (typeof id === "string") {
        id = [id];
    }

    let n = 0;
    const len = id.length;

    /**
     *
     * @param {import('gaxios').GaxiosResponse<youtube_v3.Schema$VideoListResponse>} response
     * @return {Promise<youtube_v3.Schema$Video[]>}
     */
    async function then(response) {
        if (response.status !== 200) {
            throw new Error('Error during fetch video info.');
        }

        n += response.data.items.length;
        while (n < len) {
            response.data.items = response.data.items.concat(await youtube_api.videos.list({
                key,
                part,
                id: id.splice(0, maxResults),
                maxResults,
                regionCode,
            }).then(then));
        }

        return response.data.items;
    }

    return await youtube_api.videos.list({
        key,
        part,
        id: id.splice(0, maxResults),
        maxResults,
        regionCode,
    }).then(then).then(videos => videos.map(i => {
        const d = parseISO8601(i.contentDetails.duration);

        return {
            ...i,
            duration: d.hours * 60 * 60 + d.minutes * 60 + d.seconds,
            url: `https://www.youtube.com/watch?v=${i.id}`
        };
    }));
}

/**
 *
 * @param {string} playlistId
 * @param {Object} params
 * @param {string} params.key
 * @param {string[]} [params.part=['id', 'snippet', 'status']]
 * @param {number} [params.maxResults=50]
 * @return {Promise<youtube_v3.Schema$PlaylistItem[]>}
 */
export async function getPlaylistItems(playlistId, {key, part = ['id', 'snippet', 'status'], maxResults = 50}) {
    let n = 0;

    /**
     *
     * @param {import('gaxios').GaxiosResponse<youtube_v3.Schema$PlaylistItemListResponse>} response
     * @return {Promise<youtube_v3.Schema$PlaylistItem[]>}
     */
    async function then(response) {
        if (response.status !== 200) {
            throw new Error('Error during fetch playlist items.');
        }

        n += response.data.items.length;
        while (n < response.data.pageInfo.totalResults) {
            response.data.items = response.data.items.concat(await youtube_api.playlistItems.list({
                key,
                part,
                playlistId,
                maxResults,
                pageToken: response.data.nextPageToken,
            }).then(then));
        }

        return response.data.items;
    }

    return await youtube_api.playlistItems.list({
        key,
        part,
        playlistId,
        maxResults,
    }).then(then).then(items => items.filter(v => ['public', 'unlisted'].includes(v.status.privacyStatus)));
}

/**
 *
 * @param {SpotifyWebAPI} spotifyAPI
 * @param {string} playlistID
 * @return {Promise<{name: string, artists: string, album: string}[]>}
 */
export async function getSpotifyPlaylistItems(spotifyAPI, playlistID) {
    spotifyAPI.checkToken = async function () {
        if (!spotifyAPI.getAccessToken()) {
            await spotifyAPI.clientCredentialsGrant().then(data => {
                spotifyAPI.setAccessToken(data.body['access_token']);

                setTimeout(() => {
                    spotifyAPI.resetAccessToken();
                }, data.body['expires_in']);
            });
        }
    };

    let n = 0;

    /**
     *
     * @param {{body: SpotifyApi.PlaylistTrackResponse, statusCode: number}} response
     * @return {Promise<SpotifyApi.PlaylistTrackObject[]>}
     */
    async function then(response) {
        n += response.body.items.length;
        while (n < response.body.total) {
            await spotifyAPI.checkToken();
            response.body.items = response.body.items.concat(await spotifyAPI.getPlaylistTracks(playlistID, {offset: n}).then(then));
        }

        return response.body.items;
    }

    await spotifyAPI.checkToken();
    return await spotifyAPI.getPlaylistTracks(playlistID).then(then).then(playlistItems => playlistItems.map(playlistItem => ({
        name: playlistItem.track.name,
        artists: playlistItem.track.artists.map(a => a.name).join(', '),
        album: playlistItem.track.album.name ?? '',
    })));
}
