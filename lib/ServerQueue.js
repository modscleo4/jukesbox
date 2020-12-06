export default class ServerQueue {
    #textChannel;
    #voiceChannel;
    #connection;
    #songs;
    #volume;
    #playing;
    #loop;
    #shuffle;
    #toDelete;
    #position;
    #seek;

    /**
     *
     * @param {Message} message
     * @param {Song[]} songs
     * @param {number} volume
     */
    constructor({message, songs, volume = 100}) {
        this.#textChannel = message.channel;
        this.#voiceChannel = message.member.voice.channel;
        this.#connection = null;
        this.#songs = songs;
        this.#volume = volume;
        this.#playing = true;
        this.#loop = false;
        this.#shuffle = false;
        this.#toDelete = null;
        this.#position = 0;
        this.#seek = null;
    }

    get textChannel() {
        return this.#textChannel;
    }

    get voiceChannel() {
        return this.#voiceChannel;
    }

    get connection() {
        return this.#connection;
    }

    /**
     *
     * @param {VoiceConnection} value
     */
    set connection(value) {
        this.#connection = value;
    }

    get songs() {
        return this.#songs;
    }

    /**
     *
     * @param {Song[]} value
     */
    set songs(value) {
        this.#songs = value;
    }

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

    get playing() {
        return this.#playing;
    }

    /**
     *
     * @param {boolean} value
     */
    set playing(value) {
        this.#playing = value;
    }

    get loop() {
        return this.#loop;
    }

    /**
     *
     * @param {boolean} value
     */
    set loop(value) {
        this.#loop = value;
    }

    get shuffle() {
        return this.#shuffle;
    }

    /**
     *
     * @param {boolean} value
     */
    set shuffle(value) {
        this.#shuffle = value;
    }

    get toDelete() {
        return this.#toDelete;
    }

    /**
     *
     * @param {Message|null} value
     */
    set toDelete(value) {
        this.#toDelete = value;
    }

    get position() {
        return this.#position;
    }

    /**
     *
     * @param {number} value
     */
    set position(value) {
        this.#position = value;
    }

    get seek() {
        return this.#seek;
    }

    /**
     *
     * @param {number|null} value
     */
    set seek(value) {
        this.#seek = value;
    }

    get song() {
        return this.#songs[this.#position];
    }

    /**
     *
     * @param {Song} song
     */
    set song(song) {
        this.#songs[this.#position] = song;
    }
}
