const { google } = require('googleapis');
const youtube = google.youtube('v3');

exports.isValidHttpURL = function isValidHttpURL(string) {
    let url;

    try {
        url = new URL(string);
    } catch (_) {
        return false;
    }

    return url.protocol === "http:" || url.protocol === "https:";
}

exports.isAsync = function isAsync(fn) {
    return fn.constructor.name === 'AsyncFunction';
}

exports.getPlaylistItems = async function getPlaylistItems(plid, key) {
    return await youtube.playlistItems.list({
        key: key,
        part: ['id', 'snippet'],
        playlistId: plid,
        maxResults: 50,
    }).then(response => {
        if (response.status !== 200) {
            return null;
        }

        return response.data.items;
    });
}
