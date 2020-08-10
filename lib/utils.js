const {google} = require('googleapis');
const youtube_v3 = google.youtube('v3');

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

exports.parseISO8601 = function parseISO8601(str) {
    const {Y, M, D, H, m, S} = /P(?!$)((?<Y>\d+)Y)?((?<M>\d+)M)?((?<D>\d+)D)?(T(?!$)((?<H>\d+)H)?((?<m>\d+)M)?((?<S>\d+)S)?)?/gmu.exec(str).groups;

    return {
        years: Y,
        months: M,
        days: D,
        hours: H,
        minutes: m,
        seconds: S
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
exports.searchVideo = async function searchVideo(q, {key, part = ['id', 'snippet'], maxResults = 10, order = 'relevance', regionCode = 'br', type = 'video'}) {
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
            duration: `${d.hours || 0}h ${d.minutes || 0}m ${d.seconds || 0}s`,
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
exports.getPlaylistItems = async function getPlaylistItems(playlistId, {key, part = ['id', 'snippet'], maxResults = 50}) {
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
    }).then(then);
}
