export default class FullVoiceChannelError extends Error {
    constructor(message?: string) {
        super(message);
        this.name = 'FullVoiceChannelError';
    }
}
