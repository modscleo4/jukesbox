const {requireOrNull} = require('./lib/utils');
const config = requireOrNull('./config.json');

module.exports = {
    prefix: config.prefix || process.env.PREFIX,
    token: config.token || process.env.TOKEN,
    ytapikey: config.ytapikey || process.env.YTAPIKEY,
};
