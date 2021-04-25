export default class FullVoiceChannelError extends Error {
    constructor(message) {
        super(message);
        this.name = 'FullVoiceChannelError';
    }
}
