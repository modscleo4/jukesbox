const Discord = require('discord.js');
const {prefix, token, adminID} = require('./config.js');
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
        const args = message.content.slice(prefix.length).match(/("[^"]*"|\/[^{]+{[^}]*}|\S)+/gmi) || [];
        const cmd = args.shift().toLowerCase();

        if (!(cmd in client.commands)) {
            return;
        }

        const command = client.commands[cmd];

        if (command.only && !command.only.includes(message.author.id)) {
            return;
        }

        await command.fn(message, args).catch(async e => {
            console.error(e);
            adminID && await (await client.users.fetch(adminID)).send(`Mensagem: ${message}\n\n\`\`\`${e.stack}\`\`\``);
            await message.channel.send('Deu ruim aqui lek.');
        });
    }
});

client.login(token).then(() => {
    client.loadCommands(commands);
});
