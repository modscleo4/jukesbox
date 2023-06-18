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
 * @file Discord.js extended MessageEmbed Class
 *
 * @author Dhiego Cassiano Fogaça Barbosa <modscleo4@outlook.com>
 */

'use strict';

import { MessageEmbed as BaseMessageEmbed } from "discord.js";

export default class MessageEmbed extends BaseMessageEmbed {
    /**
     * Normalizes field input and resolves strings.
     * @param {...import('discord.js').EmbedFieldData|import('discord.js').EmbedFieldData[]} fields Fields to normalize
     * @returns {import('discord.js').EmbedField[]}
     */
    static normalizeFields(...fields) {
        return fields
            .flat(2)
            .map(field =>
                this.normalizeField(field.name, field.value.toString(), typeof field.inline === 'boolean' ? field.inline : false),
            );
    }
}
