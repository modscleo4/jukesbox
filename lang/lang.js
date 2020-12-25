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

import en_US from "./en_US.json";
import pt_BR from "./pt_BR.json";

export const langs = {
    //en_US,
    pt_BR,
}

/**
 *
 * @param {string} key
 * @param {string} lang
 * @param {Object<string, string>} [params={}]
 */
export default function getLocalizedString(key, lang, params = {}) {
    if (!(key in langs[lang])) {
        throw new ReferenceError('Invalid key.');
    }

    // Set all params keys to the "this" instance, so eval can catch them.
    for (const k in params) {
        this[k] = params[k];
    }

    return eval(langs[lang][key]);
}
