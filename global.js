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
 * @file Global variables
 *
 * @author Dhiego Cassiano Fogaça Barbosa <modscleo4@outlook.com>
 */

'use strict';

import ServerQueue from "./lib/ServerQueue.js";
import ServerConfig from "./lib/ServerConfig.js";

/**
 *
 * @type {Map<string, ServerQueue>}
 */
export const queue = new Map();
export const startupTime = Date.now();

/**
 * @type {Map<string, boolean>}
 */
export const messageAlert = new Map();

/**
 *
 * @type {Map<string, ServerConfig>}
 */
export let serverConfig = new Map();

/**
 *
 * @param {Map<string, ServerConfig>} sc
 */
export function setServerConfig(sc) {
    serverConfig = sc;
}
