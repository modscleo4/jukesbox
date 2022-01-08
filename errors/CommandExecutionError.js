export default class CommandExecutionError extends Error {
    /**
     * @type {import("../lib/Command.js").CommandReturn}
     */
    messageContent;

    /**
     *
     * @param {import("../lib/Command.js").CommandReturn} messageContent
     */
    constructor(messageContent) {
        super(messageContent.content ?? messageContent.embeds[0]?.description);
        this.messageContent = messageContent;
        this.name = 'CommandExecutionError';
    }
}
