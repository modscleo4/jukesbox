export default class InsufficientUserPermissionsError extends Error {
    constructor(message) {
        super(message);
        this.name = 'InsufficientUserPermissionsError';
    }
}
