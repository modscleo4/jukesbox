export default class InsufficientBotPermissionsError extends Error {
    constructor(message?: string) {
        super(message);
        this.name = 'InsufficientBotPermissionsError';
    }
}
