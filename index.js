const Discord = require('discord.js');
const {prefix, token, adminID} = require('./config.js');
const {isAsync} = require('./lib/utils');
const commands = require('./plugins');

const client = new Discord.Client();
client.commands = [];

/**
 *
 * @param {{description: String, only?: String[], fn: Function}[]} commands
 */
client.loadCommands = function (commands) {
    this.commands = commands;
}

client.on('ready', () => {
    client.user.setPresence({
        activity: {
            name: 'Jukera carai',
            type: 'WATCHING',
        },

        status: 'online',
    }).then(() => {
        console.log(`Stream do Jukera on.`);
    });
});

client.on('voiceStateUpdate', async (oldState, newState) => {
    if (!newState.channel && oldState.channel) {
        if (oldState.channel.members.size === 1 && oldState.channel.members.find(m => m.id === client.user.id)) {
            await oldState.channel.leave();
        }
    }
});

client.on('message', async message => {
    if (message.content.startsWith(prefix) && !message.author.bot) {
        const args = message.content.slice(prefix.length).split(' ');
        const cmd = args.shift().toLowerCase();

        if (!(cmd in client.commands)) {
            return;
        }

        const command = client.commands[cmd];

        if (command.only && !command.only.includes(message.author.id)) {
            return;
        }

        try {
            if (isAsync(command.fn)) {
                await command.fn(message, args);
            } else {
                command.fn(message, args);
            }
        } catch (e) {
            console.error(e);
            await message.channel.send('Deu ruim aqui lek.');
        }
    }
});

client.login(token).then(() => {
    client.loadCommands(commands);
});
