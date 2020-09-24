const Discord = require('discord.js');
const {prefix, token, adminID} = require('./config.js');
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
        const command = args.shift().toLowerCase();

        if (!(command in commands)) {
            return;
        }

        if (commands[command].only && !commands[command].only.includes(message.author.id)) {
            return;
        }

        const fn = commands[command].fn;

        try {
            if (isAsync(fn)) {
                await fn(message, args, client);
            } else {
                fn(message, args, client);
            }
        } catch (e) {
            console.error(e);
            await message.channel.send('Deu ruim aqui lek.');
        }
    }
});

client.login(token).then(() => {
});
