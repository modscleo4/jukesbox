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
 * @file ENV vars
 *
 * @author Dhiego Cassiano Fogaça Barbosa <modscleo4@outlook.com>
 */

'use strict';

const {requireOrNull} = require('./lib/utils');
const config = requireOrNull('./config.json');

module.exports = {
    database_url: config.database_url || process.env.DATABASE_URL,
    prefix: config.prefix || process.env.PREFIX,
    highWaterMark: config.highWaterMark || parseInt(process.env.HIGH_WATER_MARK),
    token: config.token || process.env.TOKEN,
    ytapikey: config.ytapikey || process.env.YTAPIKEY,
    scclientID: config.scclientID || process.env.SCCLIENTID,
    spclientID: config.spclientID || process.env.SPCLIENTID,
    spsecret: config.spsecret || process.env.SPSECRET,
    adminID: config.adminID || process.env.ADMINID,
};
