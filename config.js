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

/**
 * @typedef {Object} Options
 * @property {String} database_url
 * @property {String} prefix
 * @property {Number} highWaterMark
 * @property {Number} dlChunkSize
 * @property {String} token
 * @property {String[]} ytapikeys
 * @property {String} ytcookies
 * @property {String} scclientID
 * @property {String} spclientID
 * @property {String} spsecret
 * @property {String} geniusToken
 * @property {String} adminID
 * @property {Boolean} production
 * @property {Boolean} periodicallyClearCache
 * @property {Boolean} ignorePermissionsForAdmin
 */

/**
 * @type {Options}
 */
export const options = {};

export const configOptions = [
    {
        name: 'Database URL',
        value: 'database_url',
        envName: 'DATABASE_URL',
        type: 'string',
    },
    {
        name: 'Prefix',
        value: 'prefix',
        envName: 'PREFIX',
        type: 'string',
        default: '.',
    },
    {
        name: 'High Water Mark',
        value: 'highWaterMark',
        envName: 'HIGH_WATER_MARK',
        type: 'number',
        default: 4096,
    },
    {
        name: 'Download Chunk Size',
        value: 'dlChunkSize',
        envName: 'DL_CHUNK_SIZE',
        type: 'number',
        default: 10485760,
    },
    {
        name: 'Token',
        value: 'token',
        envName: 'TOKEN',
        type: 'string',
    },
    {
        name: 'YouTube API Keys',
        value: 'ytapikeys',
        envName: 'YTAPIKEYS',
        type: 'array',
        arrayDelimiter: ';',
    },
    {
        name: 'YouTube Cookies',
        value: 'ytcookies',
        envName: 'YTCOOKIES',
        type: 'string',
        default: null
    },
    {
        name: 'SoundCloud Client ID',
        value: 'scclientID',
        envName: 'SCCLIENTID',
        type: 'string',
    },
    {
        name: 'Spotify Client ID',
        value: 'spclientID',
        envName: 'SPCLIENTID',
        type: 'string',
    },
    {
        name: 'Spotify Secret',
        value: 'spsecret',
        envName: 'SPSECRET',
        type: 'string',
    },
    {
        name: 'Genius Token',
        value: 'geniusToken',
        envName: 'GENIUSTOKEN',
        type: 'string',
    },
    {
        name: 'Admin ID',
        value: 'adminID',
        envName: 'ADMINID',
        type: 'string',
    },
    {
        name: 'Production',
        value: 'production',
        envName: 'PRODUCTION',
        type: 'boolean',
        default: true,
    },
    {
        name: 'Periodically Clear Cache',
        value: 'periodicallyClearCache',
        envName: 'PERIODICALLY_CLEAR_CACHE',
        type: 'boolean',
        default: false,
    },
    {
        name: 'Ignore Permissions For Admin',
        value: 'ignorePermissionsForAdmin',
        envName: 'IGNORE_PERMISSIONS_FOR_ADMIN',
        type: 'boolean',
        default: false,
    },
];

export function reloadConfig() {
    dotenv.config({override: true});

    function parseType(type, value, arrayDelimiter) {
        switch (type) {
            case 'boolean':
                return value === 'true';
            case 'number':
                return Number(value);
            case 'array':
                return value.split(arrayDelimiter);
        }

        return value;
    }

    configOptions.forEach(option => {
        options[option.value] = parseType(option.type, process.env[option.envName] ?? option.default, option.arrayDelimiter);
    });
}

reloadConfig();
