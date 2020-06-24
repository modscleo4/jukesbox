const queue = new Map();

const ytdl = require('ytdl-core');

const {ytapikey} = require('../config.js');
const {isValidHttpURL, searchVideo, getPlaylistItems} = require('../lib/utils');

async function play(message, song) {
    const serverQueue = queue.get(message.guild.id);
    if (serverQueue.toDelete) {
        await serverQueue.toDelete.delete();
        serverQueue.toDelete = null;
    }

    if (!song) {
        queue.delete(message.guild.id);
        return;
    }

    const dispatcher = serverQueue.connection.play(ytdl(song.url, {
        filter: 'audioonly',
        highWaterMark: 1 << 25,
        quality: 'highestaudio',
    })).on('finish', async () => {
        if (!serverQueue.loop) {
            serverQueue.songs.shift();
        }

        await play(message, serverQueue.songs[0]);
    }).on('error', e => {
        console.error(e);

        message.channel.send('Eu não consigo clicar velho.');
        serverQueue.songs.shift();
        play(message, serverQueue.songs[0]);
    });

    dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);
    serverQueue.toDelete = await serverQueue.textChannel.send(`Que porra de música é essa que tá tocando caraio!: **${song.title}**`);
}

module.exports = {
    join: {
        description: 'Entra no canal de voz.',

        /**
         *
         * @param {Message} message
         * @return {Promise<*>}
         */
        fn: async message => {
            const voiceChannel = message.member.voice.channel;

            if (!voiceChannel) {
                return await message.channel.send(`Tá solo né filha da puta.`);
            }

            const permissions = voiceChannel.permissionsFor(message.client.user);
            if (!permissions.has('CONNECT') || !permissions.has('SPEAK')) {
                return message.channel.send('ME AJUDA!');
            }

            await voiceChannel.join();
            await message.channel.send(`Salve salve yodinha: ${voiceChannel.name}`);
        },
    },

    leave: {
        description: 'Sai do canal de voz.',

        /**
         *
         * @param {Message} message
         * @return {Promise<*>}
         */
        fn: async message => {
            const voiceChannel = message.member.voice.channel;

            if (!voiceChannel) {
                return await message.channel.send(`Tá solo né filha da puta.`);
            }

            await voiceChannel.leave();
            await message.channel.send('Sai Minerva filha da puta.');
        },
    },

    play: {
        description: 'Adiciona uma música/playlist na fila.',

        /**
         *
         * @param {Message} message
         * @param {String[]} args
         * @return {Promise<*>}
         */
        fn: async (message, args) => {
            const voiceChannel = message.member.voice.channel;
            const serverQueue = queue.get(message.guild.id);

            if (!voiceChannel) {
                return await message.channel.send(`Tá solo né filha da puta.`);
            }

            const permissions = voiceChannel.permissionsFor(message.client.user);
            if (!permissions.has('CONNECT') || !permissions.has('SPEAK')) {
                return await message.channel.send('ME AJUDA!');
            }

            if (!args[0]) {
                return await message.channel.send('Sem meu link eu não consigo.');
            }

            const songs = [];
            let url = isValidHttpURL(args[0]) ? args[0] : ((await searchVideo(args.join(' '), {
                key: ytapikey,
            })).find(r => r.id.kind === 'youtube#video') || {url: null}).url || null;

            if (!url) {
                return message.channel.send('Achei nada lesk.');
            }

            if (url.match(/([&?])list=/gmu)) {
                const plid = /[&?]list=(?<PlaylistID>[^&#]+)/gmu.exec(url).groups.PlaylistID;
                const plsongs = await getPlaylistItems(plid, {
                    key: ytapikey,
                });

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
            } else if (url.match(/(\/watch\?v=|youtu.be\/)/gmu)) {
                try {
                    const songInfo = await ytdl.getInfo(url);
                    const song = {
                        title: songInfo.title,
                        url: songInfo.video_url,
                    };

                    songs.push(song);
                } catch (e) {
                    return await message.channel.send('Eu não consigo clicar velho.');
                }
            } else {
                return await message.channel.send('Eu não consigo clicar velho.');
            }

            if (!serverQueue) {
                const queueContruct = {
                    textChannel: message.channel,
                    voiceChannel: message.member.voice.channel,
                    connection: null,
                    songs: [...songs],
                    volume: 5,
                    playing: true,
                    toDelete: null,
                    loop: false,
                };

                queue.set(message.guild.id, queueContruct);

                try {
                    queueContruct.connection = await voiceChannel.join();
                    await play(message, queueContruct.songs[0]);
                } catch (err) {
                    console.log(err);
                    queue.delete(message.guild.id);
                    return await message.channel.send('Eu não consigo clicar velho.');
                }
            } else {
                serverQueue.songs = serverQueue.songs.concat(songs);
                if (songs.length === 1) {
                    return await message.channel.send(`**${songs[0].title}** tá na fila, posição ${serverQueue.songs.length}.`);
                }

                return await message.channel.send(`${songs.length} músicas na fila.`);
            }
        },
    },

    np: {
        description: 'Mostra a música que está tocando.',

        /**
         *
         * @param {Message} message
         * @return {Promise<*>}
         */
        fn: async message => {
            const serverQueue = queue.get(message.guild.id);

            if (!serverQueue) {
                return await message.channel.send("Tá limpo vei.");
            }

            await serverQueue.textChannel.send(`Que porra de música é essa que tá tocando caraio!: **${serverQueue.songs[0].title}**`);
        },
    },

    pause: {
        description: 'Pausa a música.',

        /**
         *
         * @param {Message} message
         * @return {*}
         */
        fn: async message => {
            const voiceChannel = message.member.voice.channel;
            const serverQueue = queue.get(message.guild.id);

            if (!voiceChannel) {
                return message.channel.send('Tá solo né filha da puta.');
            }

            if (!serverQueue) {
                return message.channel.send("ME AJUDA.");
            }

            serverQueue.connection.dispatcher.pause(true);
            serverQueue.playing = false;
            await message.channel.send(`Vai gankar quem caralho.`);
        },
    },

    resume: {
        description: 'Continua a reprodução da música.',

        /**
         *
         * @param {Message} message
         * @return {Promise<*>}
         */
        fn: async message => {
            const voiceChannel = message.member.voice.channel;
            const serverQueue = queue.get(message.guild.id);

            if (!voiceChannel) {
                return await message.channel.send('Tá solo né filha da puta.');
            }

            if (!serverQueue) {
                return await message.channel.send("ME AJUDA.");
            }

            serverQueue.connection.dispatcher.resume();
            serverQueue.playing = true;
            await message.channel.send(`Solta o filha da puta pra eu da um tiro na cabeça dele.`);
        },
    },

    stop: {
        description: 'Limpa a fila e para de tocar.',

        /**
         *
         * @param {Message} message
         * @return {Promise<*>}
         */
        fn: async message => {
            const voiceChannel = message.member.voice.channel;
            const serverQueue = queue.get(message.guild.id);

            if (!voiceChannel) {
                return await message.channel.send('Tá solo né filha da puta.');
            }

            if (!serverQueue) {
                return await message.channel.send('ME AJUDA.');
            }

            serverQueue.songs = [];
            serverQueue.connection.dispatcher.end();
            serverQueue.playing = false;
            await message.channel.send(`Caralho filha da puta morre logo.`);
        },
    },

    skip: {
        description: 'Pula {n} músicas.',

        /**
         *
         * @param {Message} message
         * @param {String[]} args
         * @return {Promise<*>}
         */
        fn: async (message, args) => {
            const voiceChannel = message.member.voice.channel;
            const serverQueue = queue.get(message.guild.id);

            if (!voiceChannel) {
                return await message.channel.send('Tá solo né filha da puta.');
            }

            if (!serverQueue) {
                return await message.channel.send("ME AJUDA.");
            }

            let skips = (args.length > 0 && Number.isInteger(parseInt(args[0])) && parseInt(args[0]) > 0) ? parseInt(args[0]) : 1;
            if (skips > serverQueue.songs.length) {
                skips = serverQueue.songs.length;
                serverQueue.playing = false;
            }

            serverQueue.songs.splice(0, skips - 1);
            if (serverQueue.loop) {
                serverQueue.songs.shift();
            }

            serverQueue.connection.dispatcher.end();

            await message.channel.send('Pode passar jovi.');
        },
    },

    loop: {
        description: 'Liga ou desliga o modo Repetição.',

        /**
         *
         * @param {Message} message
         * @return {Promise<*>}
         */
        fn: async message => {
            const serverQueue = queue.get(message.guild.id);

            if (!serverQueue) {
                return await message.channel.send("Tá limpo vei.");
            }

            serverQueue.loop = !serverQueue.loop;

            if (serverQueue.loop) {
                await message.channel.send(`Ah Yoda vai toma no cu caraio 2 vezes seguidas.`);
            } else {
                await message.channel.send(`Tu cancelou o auto ataque vei.`);
            }
        },
    },

    queue: {
        description: 'Mostra a fila.',

        /**
         *
         * @param {Message} message
         * @return {Promise<*>}
         */
        fn: async message => {
            const serverQueue = queue.get(message.guild.id);

            if (!serverQueue) {
                return await message.channel.send("Tá limpo vei.");
            }

            const msgs = ['Fila tá assim lek:\n\n'];
            let i = 0;

            serverQueue.songs.forEach((s, ii) => {
                if ((msgs[i] + `${ii + 1}: **${s.title}**\n`).length >= 2000) {
                    i++;
                }

                if (!msgs[i]) {
                    msgs[i] = '';
                }

                msgs[i] += `${ii + 1}: **${s.title}**\n`;
            });

            msgs.forEach(msg => message.channel.send(msg));
        },
    },
};
