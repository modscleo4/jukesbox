import DB from "./DB.js";

export default class ServerConfig {
    #id;
    #guild;
    #prefix;
    #volume;

    /**
     *
     * @param {number|null} id
     * @param {string} guild
     * @param {string} prefix
     * @param {number} volume
     */
    constructor({id = null, guild, prefix, volume = 100}) {
        this.#id = id;
        this.#guild = guild;
        this.#prefix = prefix;
        this.#volume = volume;
    }

    /**
     *
     * @param {string} database_url
     * @return {Promise<void>}
     */
    async save(database_url) {
        const db = new DB(database_url);

        if (this.#id) {
            await db.query('UPDATE server_configs SET prefix = $2, volume = $3 WHERE id = $1', [this.#id, this.#prefix, this.#volume]);
        } else {
            this.#id = (await db.query('INSERT INTO server_configs (guild, prefix, volume) VALUES ($1, $2, $3) RETURNING id', [this.#guild, this.#prefix, this.#volume])).rows[0].id;
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
}
