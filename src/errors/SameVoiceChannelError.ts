export default class SameVoiceChannelError extends Error {
    constructor(message?: string) {
        super(message);
        this.name = 'SameVoiceChannelError';
    }
}
