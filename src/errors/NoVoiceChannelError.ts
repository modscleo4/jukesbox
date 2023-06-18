export default class NoVoiceChannelError extends Error {
    constructor(message?: string) {
        super(message);
        this.name = 'NoVoiceChannelError';
    }
}
