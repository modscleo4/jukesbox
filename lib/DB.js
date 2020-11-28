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
 * @file Database helper
 *
 * @author Dhiego Cassiano Fogaça Barbosa <modscleo4@outlook.com>
 */

'use strict';

const {Pool} = require('pg');

module.exports = class DB {
    /**
     * @type {String}
     */
    #connectionString;

    /**
     * @type {Pool}
     */
    #Pool;

    constructor(connectionString) {
        this.#connectionString = connectionString;
        this.#Pool = new Pool({
            connectionString: this.#connectionString,
            ssl: {
                rejectUnauthorized: false,
            }
        });

        this.#Pool.on('connect', () => {

        });
    }

    query(sql, params) {
        return this.#Pool.query(sql, params);
    }
}
