export default class InsufficientBotPermissionsError extends Error {
    constructor(message) {
        super(message);
        this.name = 'InsufficientBotPermissionsError';
    }
}
