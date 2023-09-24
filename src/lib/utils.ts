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

import MessageEmbed from "../lib/MessageEmbed.js";
import { google, youtube_v3 } from "googleapis";
import { URL } from "url";
import fetch from 'node-fetch';
import SpotifyWebAPI from "spotify-web-api-node";
import { parseDocument } from "htmlparser2";
import { innerText } from "domutils";
import { selectOne } from "css-select";

import ServerConfig from "./ServerConfig.js";
import { Client, Message, MessageReaction } from "discord.js";

const youtube_api = google.youtube('v3');

export function isValidHttpURL(string: string): boolean {
    try {
        const url = new URL(string);
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch (_) {
        return false;
    }
}

export function isAsync(fn: Function): boolean {
    return fn.constructor.name === 'AsyncFunction';
}

export async function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export function cutUntil(str: string, length: number): string {
    if (str.length <= length) {
        return str;
    }

    return `${str.substring(0, length - 3)}...`;
}

export function parseISO8601(str: string): { years: number; months: number; days: number; hours: number; minutes: number; seconds: number; } {
    const {
        Y,
        M,
        D,
        H,
        m,
        S
    } = /P(?!$)((?<Y>\d+)Y)?((?<M>\d+)M)?((?<D>\d+)D)?(T(?!$)((?<H>\d+)H)?((?<m>\d+)M)?((?<S>\d+)S)?)?/gmu.exec(str)?.groups ?? {};

    return {
        years: parseInt(Y) || 0,
        months: parseInt(M) || 0,
        days: parseInt(D) || 0,
        hours: parseInt(H) || 0,
        minutes: parseInt(m) || 0,
        seconds: parseInt(S) || 0,
    };
}

export function parseMS(ms: number): { hours: number; minutes: number; seconds: number; toString(): string; } {
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

export async function pageEmbed({ client }: { client: Client; }, { title, description = ' ', content, deleteOnEnd = false }: { title: string; description?: string; content: { name: string; value: string; inline?: boolean; }[]; deleteOnEnd?: boolean; }): Promise<any> {
    const maxPerPage = 10;
    const pages = Math.ceil(content.filter(c => c.name !== '__separator').length / maxPerPage);

    function buildEmbed(page: number) {
        return new MessageEmbed({
            title,
            description: `${description}\n\n${content.slice((page - 1) * maxPerPage, page * maxPerPage).map((
                {
                    name,
                    value
                }) => value ? `**${name}** - ${value}` : `\n**${name}**`).join('\n')}`,
            author: { name: client.user!.username, iconURL: client.user!.avatarURL()! },
            timestamp: new Date(),
            footer: pages === 0 ? undefined : { text: `Página ${page} de ${pages}` },
        });
    }

    const msg = buildEmbed(1);

    const reactions = ['⬅️', '➡️'];

    if (pages <= 1) {
        return { embeds: [msg] };
    }

    let page = 1;

    return {
        embeds: [msg],
        reactions,
        lockAuthor: true,
        onReact: async ({ reaction, message }: { reaction: MessageReaction, message: Message; }) => {
            page += reaction.emoji.name === '⬅️' ? -1 : 1;
            if (page < 1) {
                page = pages;
            } else if (page > pages) {
                page = 1;
            }

            await message.edit({ embeds: [buildEmbed(page)] });
        },
        deleteOnEnd,
    };
}

export async function searchVideo(q: string, {
    keys,
    part = ['id', 'snippet',],
    maxResults = 10,
    order = 'relevance',
    regionCode = 'br',
    type = ['video'],
    videoEmbeddable = 'any',
}: { keys: string[]; part?: string[]; maxResults?: number; order?: string; regionCode?: string; type?: ('video' | 'playlist' | 'channel')[]; videoEmbeddable?: 'true' | 'any'; }): Promise<(youtube_v3.Schema$SearchResult & { url: string; })[]> {
    for (const key of keys) {
        const res = await youtube_api.search.list({
            key,
            part,
            q,
            maxResults,
            order,
            regionCode,
            type,
            videoEmbeddable,
        }, {
            userAgentDirectives: []
        }).then(response => response.data.items!.map(i => ({
            ...i,
            url: (i.id!.kind === 'youtube#channel') ? `https://www.youtube.com/channel/${i.id!.channelId}` : (i.id!.kind === 'youtube#playlist') ? `https://www.youtube.com/playlist?list=${i.id!.playlistId}` : `https://www.youtube.com/watch?v=${i.id!.videoId}`,
        }))).catch(e => {
            return null;
        });

        if (res) {
            return res;
        }
    }

    return [];
}

export async function videoInfo(id: string | string[], {
    keys,
    part = ['id', 'snippet', 'contentDetails'],
    maxResults = 50,
    regionCode = 'br'
}: { keys: string[]; part?: string[]; maxResults?: number; regionCode?: string; }): Promise<(youtube_v3.Schema$Video & { duration: number; url: string; })[]> {
    if (typeof id === "string") {
        id = [id];
    }

    let n = 0;
    const len = id.length;

    for (const key of keys) {
        let iid = [...id];

        /**
         *
         * @param {import('gaxios').GaxiosResponse<youtube_v3.Schema$VideoListResponse>} response
         * @return {Promise<youtube_v3.Schema$Video[]>}
         */
        async function then(response: import('gaxios').GaxiosResponse<youtube_v3.Schema$VideoListResponse>): Promise<youtube_v3.Schema$Video[]> {
            if (response.status !== 200) {
                throw new Error('Error during fetch video info.');
            }

            n += response.data.items!.length;
            while (n < len) {
                response.data.items = response.data.items!.concat(await youtube_api.videos.list({
                    key,
                    part,
                    id: iid.splice(0, maxResults),
                    maxResults,
                    regionCode,
                }).then(then));
            }

            return response.data.items!;
        }

        const res = await youtube_api.videos.list({
            key,
            part,
            id: iid.splice(0, maxResults),
            maxResults,
            regionCode,
        }).then(then).then(videos => videos.map(i => {
            const d = parseISO8601(i.contentDetails!.duration!);

            return {
                ...i,
                duration: d.hours * 60 * 60 + d.minutes * 60 + d.seconds,
                url: `https://www.youtube.com/watch?v=${i.id}`
            };
        })).catch(e => {
            return null;
        });

        if (res) {
            return res;
        }
    }

    return [];
}

export async function getPlaylistItems(playlistId: string, { keys, part = ['id', 'snippet', 'status'], maxResults = 50 }: { keys: string[]; part?: string[]; maxResults?: number; }): Promise<youtube_v3.Schema$PlaylistItem[] | null> {
    let items: youtube_v3.Schema$PlaylistItem[] | null = [];

    for (const key of keys) {
        let pageToken = undefined;

        do {
            const res = await youtube_api.playlistItems.list({
                key,
                part,
                playlistId,
                maxResults,
                pageToken,
            }).then(response => {
                if (response.status !== 200) {
                    throw new Error('Error during fetch playlist items.');
                }

                pageToken = response.data.nextPageToken;
                return response.data.items;
            }).catch(e => {
                return null;
            });

            if (res) {
                items = (items ?? []).concat(res);
            } else {
                items = null;
                break;
            }
        } while (pageToken);

        if (items) {
            break;
        }
    }

    return items?.filter(v => ['public', 'unlisted'].includes(v.status!.privacyStatus!)) ?? null;
}

export async function getSpotifyPlaylistItems(spotifyAPI: SpotifyWebAPI, playlistID: string): Promise<{ name: string; artists: string; album: string; }[]> {
    async function checkToken() {
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
    async function then(response: { body: SpotifyApi.PlaylistTrackResponse; statusCode: number; }): Promise<SpotifyApi.PlaylistTrackObject[]> {
        n += response.body.items.length;
        while (n < response.body.total) {
            await checkToken();
            response.body.items = response.body.items.concat(await spotifyAPI.getPlaylistTracks(playlistID, { offset: n }).then(then));
        }

        return response.body.items;
    }

    await checkToken();
    return await spotifyAPI.getPlaylistTracks(playlistID).then(then).then(playlistItems => playlistItems.map(playlistItem => ({
        name: playlistItem.track!.name,
        artists: playlistItem.track!.artists.map(a => a.name).join(', '),
        album: playlistItem.track!.album.name ?? '',
    })));
}

export async function getGeniusLyrics(apiToken: string, q: string): Promise<string | null> {
    const params = new URLSearchParams({ access_token: apiToken, q }).toString();
    const search: any = await fetch(`https://api.genius.com/search?${params}`).then(response => response.json());

    if (search.meta.status !== 200 || search.response.hits.length === 0) {
        return null;
    }

    let el;
    let tries = 3;

    do {
        const lyrics = await fetch(search.response.hits[0].result.url).then(response => response.text());
        const root = parseDocument(lyrics.replace('\n', '').trim());

        el = selectOne('.lyrics', root);
    } while (!el && tries-- > 0);

    if (!el) {
        return null;
    }

    return innerText(el)?.trim();
}
