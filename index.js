const Discord = require('discord.js');
const {prefix, token} = require('./config.js');
const {isAsync} = require('./lib/utils');
const commands = require('./plugins');

const client = new Discord.Client();

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

client.on('message', async message => {
    if (message.content.startsWith(prefix) && !message.author.bot) {
        const args = message.content.slice(prefix.length).split(' ');
        const command = args.shift().toLowerCase();

        if (!(command in commands)) {
            return await message.channel.send('Tendi não lek.');
        }

        if (isAsync(commands[command].fn)) {
            await commands[command].fn(message, args, client);
        } else {
            // noinspection ES6MissingAwait
            commands[command].fn(message, args, client);
        }
    }
});

client.login(token);
