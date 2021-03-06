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

import pg from "pg";

export default class DB {
    /**
     * @type {string}
     */
    #connectionString;

    /**
     * @type {pg.Pool}
     */
    #Pool;

    /**
     *
     * @param {string} connectionString Database connection string
     */
    constructor(connectionString) {
        this.#connectionString = connectionString;
        this.#Pool = new pg.Pool({
            connectionString: this.#connectionString,
            ssl: {
                rejectUnauthorized: false,
            }
        });

        this.#Pool.on('connect', () => {

        });
    }

    /**
     *
     * @param {string} sql
     * @param {Object[]} [params=undefined]
     */
    query(sql, params = undefined) {
        return this.#Pool.query(sql, params);
    }
}
