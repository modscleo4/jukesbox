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

import dotenv from "dotenv";

export let database_url;
export let prefix;
export let highWaterMark;
export let dlChunkSize;
export let token;
export let ytapikeys;
export let ytcookies;
export let scclientID;
export let spclientID;
export let spsecret;
export let geniusToken;
export let adminID;
export let production;
export let periodicallyClearCache;
export let ignorePermissionsForAdmin;

export function reloadConfig() {
    delete process.env.DATABASE_URL;
    delete process.env.PREFIX;
    delete process.env.HIGH_WATER_MARK;
    delete process.env.DL_CHUNK_SIZE;
    delete process.env.TOKEN;
    delete process.env.YTAPIKEYS;
    delete process.env.YTCOOKIES;
    delete process.env.SCCLIENTID;
    delete process.env.SPCLIENTID;
    delete process.env.SPSECRET;
    delete process.env.GENIUSTOKEN;
    delete process.env.ADMINID;
    delete process.env.PRODUCTION;
    delete process.env.PERIODICALLY_CLEAR_CACHE;
    delete process.env.IGNORE_PERMISSIONS_FOR_ADMIN;

    dotenv.config();

    database_url = process.env.DATABASE_URL;
    prefix = process.env.PREFIX;
    highWaterMark = parseInt(process.env.HIGH_WATER_MARK || '4096');
    dlChunkSize = parseInt(process.env.DL_CHUNK_SIZE || '10485760');
    token = process.env.TOKEN;
    ytapikeys = (process.env.YTAPIKEYS ?? '').split(';');
    ytcookies = process.env.YTCOOKIES || null;
    scclientID = process.env.SCCLIENTID;
    spclientID = process.env.SPCLIENTID;
    spsecret = process.env.SPSECRET;
    geniusToken = process.env.GENIUSTOKEN;
    adminID = process.env.ADMINID;
    production = process.env.PRODUCTION === 'true';
    periodicallyClearCache = process.env.PERIODICALLY_CLEAR_CACHE === 'true';
    ignorePermissionsForAdmin = process.env.IGNORE_PERMISSIONS_FOR_ADMIN === 'true';
}

reloadConfig();
