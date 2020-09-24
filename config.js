const {requireOrNull} = require('./lib/utils');
const config = requireOrNull('./config.json');

module.exports = {
    prefix: config.prefix || process.env.PREFIX,
    token: config.token || process.env.TOKEN,
    ytapikey: config.ytapikey || process.env.YTAPIKEY,
    scclientID: config.scclientID || process.env.SCCLIENTID,
    adminID: config.adminID || process.env.ADMINID,
    startupTime: new Date(),
};
