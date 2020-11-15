const {Client} = require('discord.js');
const {setServerConfig} = require('./global');
const {database_url, prefix, token, adminID} = require('./config.js');
const {loadServerConfig} = require('./lib/utils');

let serverConfig = null;

const client = new Client();
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
    if (!serverConfig) {
        return;
    }

    const sc = serverConfig.get(message.guild.id);
    const serverPrefix = sc ? sc.prefix : prefix;

    if (message.content.startsWith(serverPrefix)) {
        if (message.author.bot) {
            return;
        }

        const args = (message.content.slice(serverPrefix.length).match(/("[^"]*"|\/[^{]+{[^}]*}|\S)+/gmi) || []).map(a => a.replace(/"/gmi, ''));
        const cmd = args.shift().toLowerCase();

        if (!(cmd in client.commands) && !Object.keys(client.commands).find(k => client.commands[k].alias && client.commands[k].alias.includes(cmd))) {
            return;
        }

        const command = client.commands[cmd] || client.commands[Object.keys(client.commands).find((k) => client.commands[k].alias && client.commands[k].alias.includes(cmd))];

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

client.login(token).then(async () => {
    serverConfig = await loadServerConfig(database_url);
    setServerConfig(serverConfig);

    const commands = require('./plugins');
    client.loadCommands(commands);
});
