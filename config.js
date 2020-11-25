const {requireOrNull} = require('./lib/utils');
const config = requireOrNull('./config.json');

module.exports = {
    database_url: config.database_url || process.env.DATABASE_URL,
    prefix: config.prefix || process.env.PREFIX,
    highWaterMark: config.highWaterMark || process.env.HIGH_WATER_MARK,
    token: config.token || process.env.TOKEN,
    ytapikey: config.ytapikey || process.env.YTAPIKEY,
    scclientID: config.scclientID || process.env.SCCLIENTID,
    spclientID: config.spclientID || process.env.SPCLIENTID,
    spsecret: config.spsecret || process.env.SPSECRET,
    adminID: config.adminID || process.env.ADMINID,
};
