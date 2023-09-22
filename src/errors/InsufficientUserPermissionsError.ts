export default class InsufficientUserPermissionsError extends Error {
    constructor(message?: string) {
        super(message);
        this.name = 'InsufficientUserPermissionsError';
    }
}
