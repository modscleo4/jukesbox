export default class NoVoiceChannelError extends Error {
    constructor(message) {
        super(message);
        this.name = 'NoVoiceChannelError';
    }
}
