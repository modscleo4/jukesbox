import { CommandReturn } from "src/lib/Command.js";

export default class CommandExecutionError extends Error {
    messageContent: CommandReturn;

    constructor(messageContent: CommandReturn) {
        super((messageContent.content ?? ('toJSON' in messageContent.embeds![0] ? messageContent.embeds![0].toJSON() : messageContent.embeds![0]).description) ?? undefined);
        this.messageContent = messageContent;
        this.name = 'CommandExecutionError';
    }
}
