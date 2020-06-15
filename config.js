const config = requireOrNull('./config.json');

function requireOrNull(module) {
    try {
        return require(module);
    } catch (_) {
        return {};
    }
}

module.exports = {
    prefix: config.prefix || process.env.PREFIX,
    token: config.token || process.env.TOKEN,
    ytapikey: config.ytapikey || process.env.YTAPIKEY,
};
