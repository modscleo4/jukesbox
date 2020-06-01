const Discord = require('discord.js');
const ytdl = require('ytdl-core');
const search = require('youtube-search');
const {prefix, token, ytapikey} = require('./config.json');

const bot = new Discord.Client();

const queue = new Map();

function isValidHttpUrl(string) {
    let url;

    try {
        url = new URL(string);
    } catch (_) {
        return false;
    }

    return url.protocol === "http:" || url.protocol === "https:";
}

bot.on('message', async message => {
    if (message.content.startsWith(prefix) && !message.author.bot) {
        const serverQueue = queue.get(message.guild.id);

        const args = message.content.slice(prefix.length).split(' ');
        const command = args.shift().toLowerCase();
        const voiceChannel = message.member.voice.channel;

        switch (command) {
            case 'join':
                if (!voiceChannel) {
                    const permissions = voiceChannel.permissionsFor(message.client.user);
                    if (!permissions.has("CONNECT") || !permissions.has("SPEAK")) {
                        message.channel.send('ME AJUDA!');
                        return;
                    }
                }

                await voiceChannel.join();
                message.channel.send(`Salve salve yodinha: ${voiceChannel.name}`);

                break;

            case 'leave':
                if (!voiceChannel) {
                    message.channel.send(`Tá solo né filha da puta.`);
                    return;
                }

                await voiceChannel.leave();
                message.channel.send('Sai Minerva filha da puta.');
                break;

            case 'play':
                if (!voiceChannel) {
                    const permissions = voiceChannel.permissionsFor(message.client.user);
                    if (!permissions.has("CONNECT") || !permissions.has("SPEAK")) {
                        message.channel.send("ME AJUDA.");
                        return;
                    }
                }

                let url = isValidHttpUrl(args[0]) ? args[0] : (await search(args.join(' '), {
                    maxResults: 1,
                    key: ytapikey
                })).results[0].link || null;
                if (!url) {
                    return message.channel.send('Achei nada lesk.');
                }

                const songInfo = await ytdl.getInfo(url);
                const song = {
                    title: songInfo.title,
                    url: songInfo.video_url,
                };

                if (!serverQueue) {
                    const queueContruct = {
                        textChannel: message.channel,
                        voiceChannel: message.member.voice.channel,
                        connection: null,
                        songs: [],
                        volume: 5,
                        playing: true
                    };

                    queue.set(message.guild.id, queueContruct);

                    queueContruct.songs.push(song);

                    try {
                        queueContruct.connection = await voiceChannel.join();
                        play(message.guild, queueContruct.songs[0]);
                    } catch (err) {
                        console.log(err);
                        queue.delete(message.guild.id);
                        return message.channel.send(err);
                    }
                } else {
                    serverQueue.songs.push(song);
                    return message.channel.send(`**${song.title}** tá na fila.`);
                }

                break;

            case 'pause':
                if (!voiceChannel) {
                    return message.channel.send('Tá solo né filha da puta.');
                }

                if (!serverQueue) {
                    return message.channel.send("ME AJUDA.");
                }

                serverQueue.connection.dispatcher.pause(true);
                message.channel.send(`Vai gankar quem caralho.`);
                break;

            case 'resume':
                if (!voiceChannel) {
                    return message.channel.send('Tá solo né filha da puta.');
                }

                if (!serverQueue) {
                    return message.channel.send("ME AJUDA.");
                }

                serverQueue.connection.dispatcher.resume();
                message.channel.send(`Solta o filha da puta pra eu da um tiro na cabeça dele.`);
                break;

            case 'stop':
                if (!voiceChannel) {
                    return message.channel.send('ME AJUDA.');
                }

                serverQueue.songs = [];
                serverQueue.connection.dispatcher.end();
                message.channel.send(`Caralho filha da puta morre logo.`);
                break;

            case 'skip':
                if (!voiceChannel) {
                    return message.channel.send('Tá solo né filha da puta.');
                }

                if (!serverQueue) {
                    return message.channel.send("ME AJUDA.");
                }

                serverQueue.connection.dispatcher.end();
                message.channel.send('Pode passar jovi.');
                break;

            case 'queue':
                if (!serverQueue) {
                    return message.channel.send("Tá limpo vei.");
                }

                message.channel.send(`Fila tá assim lek:\n\n${serverQueue.songs.reduce((a, s, i) => a += `${i + 1}: **${s.title}**\n`, '')}`);

                break;

            default:
                break;
        }
    }
});

function play(guild, song) {
    const serverQueue = queue.get(guild.id);

    if (!song) {
        //serverQueue.voiceChannel.leave();
        queue.delete(guild.id);
        return;
    }

    const dispatcher = serverQueue.connection.play(ytdl(song.url, {
        filter: "audioonly",
        highWaterMark: 1 << 25
    })).on("finish", () => {
        serverQueue.songs.shift();
        play(guild, serverQueue.songs[0]);
    }).on('error', e => {
        console.error(e);
    });

    dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);
    serverQueue.textChannel.send(`Que porra de música é essa q tá tocando caraio!: **${song.title}**`);
}

bot.login(token);
