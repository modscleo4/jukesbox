const queue = new Map();

const ytdl = require('ytdl-core');

const search = require('youtube-search');
const {ytapikey} = require('../config.json');
const {isValidHttpURL, getPlaylistItems} = require('../lib/utils');

function play(guild, song) {
    const serverQueue = queue.get(guild.id);

    if (!song) {
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

module.exports = {
    'join': async message => {
        const voiceChannel = message.member.voice.channel;

        if (!voiceChannel) {
            message.channel.send(`Tá solo né filha da puta.`);
            return;
        }

        const permissions = voiceChannel.permissionsFor(message.client.user);
        if (!permissions.has("CONNECT") || !permissions.has("SPEAK")) {
            message.channel.send('ME AJUDA!');
            return;
        }

        await voiceChannel.join();
        message.channel.send(`Salve salve yodinha: ${voiceChannel.name}`);
    },

    'leave': async (message) => {
        const voiceChannel = message.member.voice.channel;

        if (!voiceChannel) {
            message.channel.send(`Tá solo né filha da puta.`);
            return;
        }

        await voiceChannel.leave();
        message.channel.send('Sai Minerva filha da puta.');
    },

    'play': async (message, args) => {
        const voiceChannel = message.member.voice.channel;
        const serverQueue = queue.get(message.guild.id);

        if (!voiceChannel) {
            message.channel.send(`Tá solo né filha da puta.`);
            return;
        }

        const permissions = voiceChannel.permissionsFor(message.client.user);
        if (!permissions.has("CONNECT") || !permissions.has("SPEAK")) {
            message.channel.send('ME AJUDA!');
            return;
        }

        const songs = [];
        let url = isValidHttpURL(args[0]) ? args[0] : (await search(args.join(' '), {
            maxResults: 1,
            key: ytapikey
        })).results[0].link || null;
        if (!url) {
            return message.channel.send('Achei nada lesk.');
        }

        if (url.match(/([&?])list=/gmu)) {
            const plid = /[&?]list=(?<PlaylistID>[^&#]+)/gmu.exec(url).groups.PlaylistID;
            const plsongs = await getPlaylistItems(plid, ytapikey);
            if (!plsongs) {
                return message.channel.send('Eu não consigo clicar velho.');
            }

            plsongs.forEach(plsong => {
                // noinspection JSUnfilteredForInLoop
                const song = {
                    title: plsong.snippet.title,
                    url: `https://youtube.com/watch?v=${plsong.snippet.resourceId.videoId}`,
                };

                songs.push(song);
            });
        } else {
            const songInfo = await ytdl.getInfo(url);
            const song = {
                title: songInfo.title,
                url: songInfo.video_url,
            };

            songs.push(song);
        }

        if (!serverQueue) {
            const queueContruct = {
                textChannel: message.channel,
                voiceChannel: message.member.voice.channel,
                connection: null,
                songs: [...songs],
                volume: 5,
                playing: true
            };

            queue.set(message.guild.id, queueContruct);

            try {
                queueContruct.connection = await voiceChannel.join();
                play(message.guild, queueContruct.songs[0]);
            } catch (err) {
                console.log(err);
                queue.delete(message.guild.id);
                return message.channel.send('Eu não consigo clicar velho.');
            }
        } else {
            serverQueue.songs = serverQueue.songs.concat(songs);
            if (songs.length === 1) {
                return message.channel.send(`**${songs[0].title}** tá na fila, posição ${serverQueue.songs.length}.`);
            }

            return message.channel.send(`${songs.length} músicas na fila.`);
        }
    },

    'pause': message => {
        const voiceChannel = message.member.voice.channel;
        const serverQueue = queue.get(message.guild.id);

        if (!voiceChannel) {
            return message.channel.send('Tá solo né filha da puta.');
        }

        if (!serverQueue) {
            return message.channel.send("ME AJUDA.");
        }

        serverQueue.connection.dispatcher.pause(true);
        message.channel.send(`Vai gankar quem caralho.`);
    },

    'resume': message => {
        const voiceChannel = message.member.voice.channel;
        const serverQueue = queue.get(message.guild.id);

        if (!voiceChannel) {
            return message.channel.send('Tá solo né filha da puta.');
        }

        if (!serverQueue) {
            return message.channel.send("ME AJUDA.");
        }

        serverQueue.connection.dispatcher.resume();
        message.channel.send(`Solta o filha da puta pra eu da um tiro na cabeça dele.`);
    },

    'stop': message => {
        const voiceChannel = message.member.voice.channel;
        const serverQueue = queue.get(message.guild.id);

        if (!voiceChannel) {
            return message.channel.send('ME AJUDA.');
        }

        serverQueue.songs = [];
        serverQueue.connection.dispatcher.end();
        message.channel.send(`Caralho filha da puta morre logo.`);
    },

    'skip': (message, args) => {
        const voiceChannel = message.member.voice.channel;
        const serverQueue = queue.get(message.guild.id);

        if (!voiceChannel) {
            return message.channel.send('Tá solo né filha da puta.');
        }

        if (!serverQueue) {
            return message.channel.send("ME AJUDA.");
        }

        let skips = (args.length > 0 && Number.isInteger(parseInt(args[0])) && parseInt(args[0]) > 0) ? parseInt(args[0]) : 1;
        if (skips > serverQueue.songs.length) {
            skips = serverQueue.songs.length;
        }

        for (let i = 0; i < skips - 1; i++) {
            serverQueue.songs.shift();
        }

        serverQueue.connection.dispatcher.end();

        message.channel.send('Pode passar jovi.');
    },

    'queue': message => {
        const serverQueue = queue.get(message.guild.id);

        if (!serverQueue) {
            return message.channel.send("Tá limpo vei.");
        }

        message.channel.send(`Fila tá assim lek:\n\n${serverQueue.songs.reduce((a, s, i) => a + `${i + 1}: **${s.title}**\n`, '')}`);
    },
};
