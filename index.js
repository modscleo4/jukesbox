const Discord = require('discord.js');
const {prefix, token} = require('./config.js');
const {isAsync} = require('./lib/utils');

const bot = new Discord.Client();

const musicCommands = require('./plugins/music');
const commands = {...musicCommands};

bot.on('ready', () => {
    bot.user.setActivity('Jukera carai', {
        type: 'CUSTOM_STATUS',
        url: 'https://twitch.tv/jukes',
    });
});

bot.on('message', async message => {
    if (message.content.startsWith(prefix) && !message.author.bot) {
        const args = message.content.slice(prefix.length).split(' ');
        const command = args.shift().toLowerCase();

        if (!(command in commands)) {
            return message.channel.send('Tendi não lek.');
        }

        if (isAsync(commands[command])) {
            await commands[command](message, args);
        } else {
            commands[command](message, args);
        }
    }
});

bot.login(token);
