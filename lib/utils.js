const {google} = require('googleapis');
const youtube = google.youtube('v3');

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

exports.searchVideo = async function searchVideo(q, {key, part = ['id', 'snippet'], maxResults = 10, order = 'relevance', regionCode = 'br', type = 'video'}) {
    return await youtube.search.list({
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

exports.getPlaylistItems = async function getPlaylistItems(playlistId, {key, part = ['id', 'snippet'], maxResults = 50}) {
    let n = 0;

    async function then(response) {
        if (response.status !== 200) {
            return null;
        }

        n += response.data.items.length;
        while (n < response.data.pageInfo.totalResults) {
            response.data.items = response.data.items.concat(await youtube.playlistItems.list({
                key,
                part,
                playlistId,
                maxResults,
                pageToken: response.data.nextPageToken,
            }).then(then));
        }

        return response.data.items;
    }

    return await youtube.playlistItems.list({
        key,
        part,
        playlistId,
        maxResults,
    }).then(then);
}
