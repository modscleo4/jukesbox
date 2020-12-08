import {User} from "discord.js";

export default class Song {
    #title;
    #url;
    #uploader;
    #thumbnail;
    #duration;
    #findOnYT;
    #from;
    #addedBy;
    #fn;
    #options;

    /**
     *
     * @param {Object} params
     * @param {string} params.title
     * @param {string?} params.url
     * @param {string} params.uploader
     * @param {string?} params.thumbnail
     * @param {number?} params.duration
     * @param {boolean?} params.findOnYT
     * @param {('yt'|'sc'|'sp')} params.from
     * @param {User} params.addedBy
     * @param {Function|Promise<*>} params.fn
     * @param {Object} params.options
     */
    constructor({title, url, uploader, thumbnail, duration, findOnYT, from, addedBy, fn, options}) {
        this.#title = title;
        this.#url = url;
        this.#uploader = uploader;
        this.#thumbnail = thumbnail;
        this.#duration = duration;
        this.#findOnYT = findOnYT;
        this.#from = from;
        this.#addedBy = addedBy;
        this.#fn = fn;
        this.#options = options;
    }

    /**
     *
     * @return {string}
     */
    get title() {
        return this.#title;
    }

    /**
     *
     * @return {string|null}
     */
    get url() {
        return this.#url;
    }

    /**
     *
     * @return {string}
     */
    get uploader() {
        return this.#uploader;
    }

    /**
     *
     * @return {string|null}
     */
    get thumbnail() {
        return this.#thumbnail;
    }

    /**
     *
     * @return {number|null}
     */
    get duration() {
        return this.#duration;
    }

    /**
     *
     * @return {boolean|null}
     */
    get findOnYT() {
        return this.#findOnYT;
    }

    /**
     *
     * @return {('yt'|'sc'|'sp')}
     */
    get from() {
        return this.#from;
    }

    /**
     *
     * @return {User}
     */
    get addedBy() {
        return this.#addedBy;
    }

    /**
     *
     * @return {Function|Promise<*>}
     */
    get fn() {
        return this.#fn;
    }

    /**
     *
     * @return {object}
     */
    get options() {
        return this.#options;
    }
}
