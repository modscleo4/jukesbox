import DB from "./DB.js";

export default class ServerConfig {
    #id;
    #guild;
    #prefix;
    #volume;
    #lang;

    /**
     *
     * @param {Object} params
     * @param {number?} params.id
     * @param {string} params.guild
     * @param {string} params.prefix
     * @param {number} params.volume
     * @param {string} params.lang
     */
    constructor({id = null, guild, prefix, volume = 100, lang = 'pt_BR'}) {
        this.#id = id;
        this.#guild = guild;
        this.#prefix = prefix;
        this.#volume = volume;
        this.#lang = lang;
    }

    /**
     *
     * @param {string} database_url
     * @return {Promise<void>}
     */
    async save(database_url) {
        const db = new DB(database_url);

        if (this.#id) {
            await db.query('UPDATE server_configs SET prefix = $2, volume = $3, lang = $4 WHERE id = $1', [this.#id, this.#prefix, this.#volume, this.#lang]);
        } else {
            this.#id = (await db.query('INSERT INTO server_configs (guild, prefix, volume, lang) VALUES ($1, $2, $3, $4) RETURNING id', [this.#guild, this.#prefix, this.#volume, this.#lang])).rows[0].id;
        }
    }

    /**
     *
     * @return {number|null}
     */
    get id() {
        return this.#id;
    }

    /**
     *
     * @return {string}
     */
    get guild() {
        return this.#guild;
    }

    /**
     *
     * @return {string}
     */
    get prefix() {
        return this.#prefix;
    }

    /**
     *
     * @param {string} value
     */
    set prefix(value) {
        this.#prefix = value;
    }

    /**
     *
     * @return {number}
     */
    get volume() {
        return this.#volume;
    }

    /**
     *
     * @param {number} value
     */
    set volume(value) {
        this.#volume = value;
    }

    /**
     *
     * @return {string}
     */
    get lang() {
        return this.#lang;
    }

    /**
     *
     * @param {string} value
     */
    set lang(value) {
        this.#lang = value;
    }
}
