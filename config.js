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

dotenv.config();

export function reloadConfig() {
    database_url = process.env.DATABASE_URL;
    prefix = process.env.PREFIX;
    highWaterMark = parseInt(process.env.HIGH_WATER_MARK || '4096');
    dlChunkSize = parseInt(process.env.DL_CHUNK_SIZE || '10485760');
    token = process.env.TOKEN;
    ytapikeys = (process.env.YTAPIKEYS ?? '').split(';');
    scclientID = process.env.SCCLIENTID;
    spclientID = process.env.SPCLIENTID;
    spsecret = process.env.SPSECRET;
    adminID = process.env.ADMINID;
}

export let database_url = process.env.DATABASE_URL;
export let prefix = process.env.PREFIX;
export let highWaterMark = parseInt(process.env.HIGH_WATER_MARK || '4096');
export let dlChunkSize = parseInt(process.env.DL_CHUNK_SIZE || '10485760');
export let token = process.env.TOKEN;
export let ytapikeys = (process.env.YTAPIKEYS ?? '').split(';');
export let scclientID = process.env.SCCLIENTID;
export let spclientID = process.env.SPCLIENTID;
export let spsecret = process.env.SPSECRET;
export let adminID = process.env.ADMINID;
