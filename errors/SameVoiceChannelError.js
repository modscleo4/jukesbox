export default class SameVoiceChannelError extends Error {
    constructor(message) {
        super(message);
        this.name = 'SameVoiceChannelError';
    }
}
