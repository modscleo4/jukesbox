const {MessageEmbed} = require('discord.js');
const {google} = require('googleapis');
const youtube_v3 = google.youtube('v3');

const DB = require('./DB');

exports.serverConfigConstruct = function serverConfigConstruct(prefix) {
    return {
        prefix,
        volume: 100,
    };
}

exports.queueConstruct = function queueConstruct(message, volume, songs) {
    return {
        textChannel: message.channel,
        voiceChannel: message.member.voice.channel,
        connection: null,
        songs,
        volume,
        playing: true,
        loop: false,
        shufle: false,
        toDelete: null,
        position: 0,
        seek: 0,
        get song() {
            return this.songs[this.position];
        }
    };
}

exports.loadServerConfig = async function loadServerConfig(database_url) {
    const db = new DB(database_url);

    const ret = new Map();
    const result = (await db.query('SELECT * FROM server_configs')).rows;
    result.forEach(r => {
        ret.set(r.guild, {prefix: r.prefix, volume: r.volume});
    });

    return ret;
}

exports.saveServerConfig = async function saveServerConfig(database_url, guild_id, sc) {
    const db = new DB(database_url);

    if ((await db.query('SELECT id FROM server_configs WHERE guild = $1', [guild_id])).rows.length === 0) {
        await db.query('INSERT INTO server_configs (guild, prefix, volume) VALUES ($1, $2, $3)', [guild_id, sc.prefix, sc.volume]);
    } else {
        await db.query('UPDATE server_configs SET prefix = $2, volume = $3 WHERE guild = $1', [guild_id, sc.prefix, sc.volume]);
    }
}

exports.requireOrNull = function requireOrNull(module) {
    try {
        return require(`../${module}`);
    } catch (_) {
        return {};
    }
}

exports.isValidHttpURL = function isValidHttpURL(string) {
    let url;

    try {
        url = new URL(string);
    } catch (_) {
        return false;
    }

    return url.protocol === 'http:' || url.protocol === 'https:';
}

exports.isAsync = function isAsync(fn) {
    return fn.constructor.name === 'AsyncFunction';
}

exports.cutUntil = function cutUntil(str, length) {
    if (str.length <= length) {
        return str;
    }

    return `${str.substr(0, length - 3)}...`;
}

exports.parseISO8601 = function parseISO8601(str) {
    const {Y, M, D, H, m, S} = /P(?!$)((?<Y>\d+)Y)?((?<M>\d+)M)?((?<D>\d+)D)?(T(?!$)((?<H>\d+)H)?((?<m>\d+)M)?((?<S>\d+)S)?)?/gmu.exec(str).groups;

    return {
        years: parseInt(Y) || 0,
        months: parseInt(M) || 0,
        days: parseInt(D) || 0,
        hours: parseInt(H) || 0,
        minutes: parseInt(m) || 0,
        seconds: parseInt(S) || 0,
    }
}

exports.parseMS = function parseMS(ms) {
    ms /= 1000;
    const h = Math.floor(ms / 60 / 60);
    const m = Math.floor((ms / 60 / 60 - h) * 60);
    const s = Math.floor(((ms / 60 / 60 - h) * 60 - m) * 60);

    return {
        hours: h,
        minutes: m,
        seconds: s,
        toString() {
            return `${this.hours || 0}h ${this.minutes || 0}m ${this.seconds || 0}s`
        },
    }
}

/**
 *
 * @param {Message} message
 * @param {String} title
 * @param {String} description
 * @param {{name: String, value: String, inline?: boolean}[]} content
 * @return {Promise<*>}
 */
exports.pageEmbed = async function pageEmbed(message, {title, description = ' '}, content) {
    const maxPerPage = 10;
    const pages = Math.ceil(content.length / maxPerPage);
    let page = 1;

    function buildEmbed(page) {
        return new MessageEmbed()
            .setTitle(title)
            .setDescription(description)
            .setAuthor(message.client.user.username, message.client.user.avatarURL())
            .setTimestamp()
            .addFields(content)
            .spliceFields(0, (page - 1) * maxPerPage)
            .spliceFields(maxPerPage, content.length - page * maxPerPage)
            .setFooter(`Página ${page} de ${pages}`);
    }

    const msg = await message.channel.send(buildEmbed(page));

    async function awaitReactions(msg) {
        const reactions = [];
        if (pages > 1) {
            if (page > 1) {
                reactions.push('⬅️');
            }

            if (page < pages) {
                reactions.push('➡️');
            }
        }

        reactions.map(r => msg.react(r));

        await msg.awaitReactions((r, u) => reactions.includes(r.emoji.name) && u.id === message.author.id, {
            max: 1,
            time: 60000,
            errors: ['time'],
        }).then(async collected => {
            const reaction = collected.first();
            page += reaction.emoji.name === '⬅️' ? -1 : 1;

            await msg.reactions.removeAll();

            await new Promise(r => setTimeout(r, 100));
            await msg.edit(buildEmbed(page));

            await awaitReactions(msg);
        }).catch(() => {

        });
    }

    await awaitReactions(msg);

    if (!msg.deleted) {
        await msg.delete();
    }
}

/**
 *
 * @param {String} q
 * @param {String} key
 * @param {String[]} part
 * @param {number} maxResults
 * @param {String} order
 * @param {String} regionCode
 * @param {String} type
 * @return {Promise<GaxiosResponse<youtube_v3.Schema$SearchListResponse>>}
 */
exports.searchVideo = async function searchVideo(q, {key, part = ['id', 'snippet',], maxResults = 10, order = 'relevance', regionCode = 'br', type = 'video'}) {
    return await youtube_v3.search.list({
        key,
        part,
        q,
        maxResults,
        order,
        regionCode,
        type,
    }).then(response => response.data.items.map(i => ({
        ...i,
        url: (i.id.kind === 'youtube#channel') ? `https://www.youtube.com/channel/${i.id.channelId}` : (i.id.kind === 'youtube#playlist') ? `https://www.youtube.com/playlist?list=${i.id.playlistId}` : `https://www.youtube.com/watch?v=${i.id.videoId}`,
    })));
}

/**
 *
 * @param {String|String[]} id
 * @param {String} key
 * @param {String[]} part
 * @param {number} maxResults
 * @param {String} regionCode
 * @return {Promise<GaxiosResponse<youtube_v3.Schema$VideoListResponse>>}
 */
exports.videoInfo = async function videoInfo(id, {key, part = ['id', 'snippet', 'contentDetails'], maxResults = 50, regionCode = 'br'}) {
    if (typeof id === "string") {
        id = [id];
    }

    let n = 0;
    const len = id.length;

    async function then(response) {
        if (response.status !== 200) {
            throw new Error('Error during fetch video info.');
        }

        n += response.data.items.length;
        while (n < len) {
            response.data.items = response.data.items.concat(await youtube_v3.videos.list({
                key,
                part,
                id: id.splice(0, maxResults),
                maxResults,
                regionCode,
            }).then(then));
        }

        return response.data.items;
    }

    return await youtube_v3.videos.list({
        key,
        part,
        id: id.splice(0, maxResults),
        maxResults,
        regionCode,
    }).then(then).then(videos => videos.map(i => {
        const d = exports.parseISO8601(i.contentDetails.duration);

        return {
            ...i,
            duration: d.hours * 60 * 60 + d.minutes * 60 + d.seconds,
            url: `https://www.youtube.com/watch?v=${i.id}`
        }
    }));
}

/**
 *
 * @param {String} playlistId
 * @param {String} key
 * @param {String} part
 * @param {number} maxResults
 * @return {Promise<GaxiosResponse<youtube_v3.Schema$PlaylistItemListResponse>>}
 */
exports.getPlaylistItems = async function getPlaylistItems(playlistId, {key, part = ['id', 'snippet', 'status'], maxResults = 50}) {
    let n = 0;

    async function then(response) {
        if (response.status !== 200) {
            throw new Error('Error during fetch playlist items.');
        }

        n += response.data.items.length;
        while (n < response.data.pageInfo.totalResults) {
            response.data.items = response.data.items.concat(await youtube_v3.playlistItems.list({
                key,
                part,
                playlistId,
                maxResults,
                pageToken: response.data.nextPageToken,
            }).then(then));
        }

        return response.data.items;
    }

    return await youtube_v3.playlistItems.list({
        key,
        part,
        playlistId,
        maxResults,
    }).then(then).then(items => items.filter(v => ['public', 'unlisted'].includes(v.status.privacyStatus)));
}

/**
 *
 * @param spotifyAPI
 * @param {String} playlistID
 * @return {Promise<*>}
 */
exports.getSpotifyPlaylistItems = async function getSpotifyPlaylistItems(spotifyAPI, playlistID) {
    spotifyAPI.checkToken = async function () {
        if (!spotifyAPI.getAccessToken()) {
            await spotifyAPI.clientCredentialsGrant().then(data => {
                spotifyAPI.setAccessToken(data.body['access_token']);

                setTimeout(() => {
                    spotifyAPI.resetAccessToken();
                }, data.body['expires_in']);
            });
        }
    }

    let n = 0;

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
        album: playlistItem.track.album.name || '',
    })));
}
