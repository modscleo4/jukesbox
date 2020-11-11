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
