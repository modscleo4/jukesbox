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
 * @file Parses i18n strings
 *
 * @author Dhiego Cassiano Fogaça Barbosa <modscleo4@outlook.com>
 */

'use strict';

import en_US from "./en_US.json" assert {type: "json"};
import pt_BR from "./pt_BR.json" assert {type: "json"};

export const langs = {
    en_US,
    pt_BR,
};

/**
 *
 * @param {Object<string, Object<string, Object<string, string>|string>|string>} obj
 * @param {string} path
 *
 * @return {string|undefined}
 *
 * @see https://stackoverflow.com/questions/4244896/dynamically-access-object-property-using-variable
 */
function resolve(obj, path) {
    return path.split('.').reduce((prev, curr) => prev ? prev[curr] : undefined, obj);
}

/**
 *
 * @param {string} key
 * @param {string} [lang='pt_BR']
 * @param {Object<string, *>} [params={}]
 * @return {string}
 * @throws {ReferenceError} If the key is invalid (not found)
 */
export default function i18n(key, lang = 'pt_BR', params = {}) {
    const str = resolve(langs[lang], key);

    if (!str) {
        throw new ReferenceError('Invalid key.');
    }

    // Set all params keys to the "globalThis" instance, so eval can catch them.
    for (const k in params) {
        globalThis[k] = params[k];
    }

    const ret = eval(str).replace(/,,,/gmu, '`');

    for (const k in params) {
        globalThis[k] = undefined;
    }

    return ret;
}
