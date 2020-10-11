const queue = new Map();

const {MessageEmbed} = require('discord.js');
const isoCountries = require('iso-3166-1');
const ytdl = require('ytdl-core');
const scdl = require('soundcloud-downloader');
const SpotifyWebAPI = require('spotify-web-api-node');

const {ytapikey, scclientID, spclientID, spsecret} = require('../config.js');
const {isValidHttpURL, isAsync, parseMS, pageEmbed, searchVideo, videoInfo, getPlaylistItems, getSpotifyPlaylistItems} = require('../lib/utils');

const spotifyAPI = new SpotifyWebAPI({
    clientId: spclientID,
    clientSecret: spsecret,
    redirectUri: 'http://jukesbox.herokuapp.com',
});

/**
 *
 * @param {Message} message
 * @param {any} song
 * @return {Promise<void>}
 */
async function play(message, song) {
    const serverQueue = queue.get(message.guild.id);

    if (!serverQueue) {
        return;
    }

    if (serverQueue.toDelete && !serverQueue.toDelete.deleted) {
        await serverQueue.toDelete.delete();
        serverQueue.toDelete = null;
    }

    if (!song) {
        queue.delete(message.guild.id);
        return;
    }

    if (song.findOnYT) {
        const msg = await message.channel.send('Procurando no YouTube...');
        serverQueue.songs[serverQueue.position] = song = await findOnYT(message, song.title);
        await msg.delete();

        if (!song) {
            serverQueue.toDelete = await message.channel.send('Achei nada lek.');
            serverQueue.songs.shift();
            await play(message, serverQueue.songs[0]);
        }
    }

    const stream = isAsync(song.fn) ? await song.fn(song.url, song.options) : song.fn(song.url, song.options);
    const dispatcher = serverQueue.connection.play(stream).on('finish', async () => {
        if (!serverQueue.loop) {
            serverQueue.songs.splice(serverQueue.position, 1);
        }

        serverQueue.position = 0;
        if (serverQueue.shuffle) {
            serverQueue.position = Math.floor(Math.random() * serverQueue.songs.length);
        }

        await play(message, serverQueue.songs[serverQueue.position]);
    }).on('error', async e => {
        console.error(e);

        await message.channel.send('Eu não consigo clicar velho.');
        serverQueue.songs.shift();
        await play(message, serverQueue.songs[0]);
    });

    dispatcher.setVolume(serverQueue.volume / 100);
    serverQueue.toDelete = await module.exports.np.fn(message);
}

async function findOnYT(message, q) {
    const url = ((await searchVideo(q, {
        key: ytapikey,
        regionCode: (isoCountries.whereCountry(message.guild.region) || {alpha2: 'us'}).alpha2.toLowerCase(),
        type: 'video',
    }).catch(e => {
        console.error(e);
        return null;
    }))[0] || {url: null}).url;

    if (!url) {
        return null;
    }

    const videoId = /(\/watch\?v=|youtu.be\/)(?<VideoId>[^&#]+)/gmu.exec(url).groups.VideoId;
    const songInfo = (await videoInfo(videoId, {key: ytapikey}).catch(e => {
        console.error(e);
        return null;
    }))[0];

    if (!songInfo) {
        return null;
    }

    return {
        title: songInfo.snippet.title,
        url: songInfo.url,
        channelTitle: songInfo.snippet.channelTitle,
        thumbnail: songInfo.snippet.thumbnails.high.url,
        duration: songInfo.duration,
        fn: ytdl,
        options: {
            filter: 'audioonly',
            highWaterMark: 1 << 25,
            quality: 'highestaudio',
        },
    };
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
            return await message.channel.send(new MessageEmbed()
                .setTitle('Salve salve Yodinha!')
                .setAuthor(message.client.user.username, message.client.user.avatarURL())
                .setTimestamp()
                .setDescription('Conectado a um canal de voz')
                .addFields([
                    {name: 'Canal de voz', value: voiceChannel.name, inline: true},
                    {name: 'Canal de texto', value: message.channel.name, inline: true}
                ]));
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
            const serverQueue = queue.get(message.guild.id);

            if (!voiceChannel) {
                return await message.channel.send(`Tá solo né filha da puta.`);
            }

            if (serverQueue) {
                serverQueue.songs = [];
                serverQueue.connection.dispatcher.end();
                serverQueue.playing = false;
            }

            await voiceChannel.leave();
            await message.channel.send('Sai Minerva filha da puta.');
        },
    },

    search: {
        description: 'Procura por uma música/playlist. `/playlist` para procurar por playlists.',

        /**
         *
         * @param {Message} message
         * @param {String[]} args
         * @return {Promise<*>}
         */
        fn: async (message, args) => {
            const voiceChannel = message.member.voice.channel;

            if (!voiceChannel) {
                return await message.channel.send(`Tá solo né filha da puta.`);
            }

            const permissions = voiceChannel.permissionsFor(message.client.user);
            if (!permissions.has('CONNECT') || !permissions.has('SPEAK')) {
                return await message.channel.send('ME AJUDA!');
            }

            let kind = 'video';
            switch (args[0]) {
                case '/playlist':
                    args.shift();
                    kind = 'playlist';
                    break;

                case '/video':
                    args.shift();
                    kind = 'video';
                    break;

                default:
                    break;
            }

            if (!args[0]) {
                return await message.channel.send('Sem meu link eu não consigo.');
            }

            const results = await searchVideo(args.join(' '), {
                key: ytapikey,
                regionCode: (isoCountries.whereCountry(message.guild.region) || {alpha2: 'us'}).alpha2.toLowerCase(),
                type: kind,
            });

            const reactions = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'].splice(0, results.length);

            const msg = await message.channel.send(new MessageEmbed()
                .setTitle('Achei isso aqui lek')
                .setAuthor(message.client.user.username, message.client.user.avatarURL())
                .setTimestamp()
                .addFields(results.map((r, i) => ({
                    name: `${i + 1}: ${r.snippet.title}`,
                    value: r.url,
                }))));
            reactions.map(async r => await msg.react(r));

            await msg.awaitReactions((r, u) => reactions.includes(r.emoji.name) && u.id === message.author.id, {
                max: 1,
                time: 60000,
                errors: ['time'],
            }).then(async collected => {
                const reaction = collected.first();
                await module.exports.play.fn(message, [results[reactions.indexOf(reaction.emoji.name)].url]);
            }).catch(() => {

            });

            if (!msg.deleted) {
                await msg.delete();
            }
        },
    },

    play: {
        description: 'Adiciona uma música/playlist na fila. `/playlist` para procurar por playlists.',

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

            let kind = 'video';
            switch (args[0]) {
                case '/playlist':
                    args.shift();
                    kind = 'playlist';
                    break;

                case '/video':
                    args.shift();
                    kind = 'video';
                    break;

                default:
                    break;
            }

            if (!args[0]) {
                return await message.channel.send('Sem meu link eu não consigo.');
            }

            const songs = [];
            const url = isValidHttpURL(args[0]) ? args[0] : ((await searchVideo(args.join(' '), {
                key: ytapikey,
                regionCode: (isoCountries.whereCountry(message.guild.region) || {alpha2: 'us'}).alpha2.toLowerCase(),
                type: kind,
            }))[0] || {url: null}).url || null;

            if (!url) {
                return message.channel.send('Achei nada lesk.');
            }

            if (url.match(/youtube.com|youtu.be/gmu)) {
                if (url.match(/([&?])list=[^&#]+/gmu)) {
                    const playlistId = /[&?]list=(?<PlaylistId>[^&#]+)/gmu.exec(url).groups.PlaylistId;
                    const plsongs = await getPlaylistItems(playlistId, {
                        key: ytapikey,
                    }).catch(e => {
                        console.error(e);
                        return null;
                    });

                    if (!plsongs) {
                        return await message.channel.send('Eu não consigo clicar velho.');
                    }

                    const songsInfo = await videoInfo(plsongs.map(s => s.snippet.resourceId.videoId), {key: ytapikey}).catch(e => {
                        console.error(e);
                        return null;
                    });

                    if (!songsInfo) {
                        return await message.channel.send('Eu não consigo clicar velho.');
                    }

                    songsInfo.forEach(songInfo => {
                        const song = {
                            title: songInfo.snippet.title,
                            url: songInfo.url,
                            channelTitle: songInfo.snippet.channelTitle,
                            thumbnail: songInfo.snippet.thumbnails.high.url,
                            duration: songInfo.duration,
                            fn: ytdl,
                            options: {
                                filter: 'audioonly',
                                highWaterMark: 1 << 25,
                                quality: 'highestaudio',
                            },
                        };

                        songs.push(song);
                    });
                } else if (url.match(/(\/watch\?v=|youtu.be\/)/gmu)) {
                    const videoId = /(\/watch\?v=|youtu.be\/)(?<VideoId>[^&#]+)/gmu.exec(url).groups.VideoId;
                    const songInfo = (await videoInfo(videoId, {key: ytapikey}).catch(e => {
                        console.error(e);
                        return null;
                    }))[0];

                    if (!songInfo) {
                        return await message.channel.send('Eu não consigo clicar velho.');
                    }

                    const song = {
                        title: songInfo.snippet.title,
                        url: songInfo.url,
                        channelTitle: songInfo.snippet.channelTitle,
                        thumbnail: songInfo.snippet.thumbnails.high.url,
                        duration: songInfo.duration,
                        fn: ytdl,
                        options: {
                            filter: 'audioonly',
                            highWaterMark: 1 << 25,
                            quality: 'highestaudio',
                        },
                    };

                    songs.push(song);
                }
            } else if (url.match(/soundcloud.com\//gmu)) {
                const songInfo = await scdl.getInfo(url).catch(e => {
                    console.error(e);
                    return null;
                });

                if (!songInfo) {
                    return await message.channel.send('Eu não consigo clicar velho.');
                }

                const parsedMS = parseMS(songInfo.duration);

                const song = {
                    title: songInfo.title,
                    url: songInfo.permalink_url,
                    channelTitle: songInfo.user.username,
                    thumbnail: songInfo.artwork_url,
                    duration: `${parsedMS.hours}h ${parsedMS.minutes}m ${parsedMS.seconds}s`,
                    fn: async (url, options) => await scdl.download(url, options).then(stream => stream),
                    options: scclientID,
                };

                songs.push(song);
            } else if (url.match(/spotify.com\/playlist\/[^?#]+/gmu)) {
                const playlistId = /spotify.com\/playlist\/(?<PlaylistId>[^?#]+)/gmu.exec(url).groups.PlaylistId;
                (await getSpotifyPlaylistItems(spotifyAPI, playlistId).catch(async e => {
                    console.error(e);
                    return null;
                })).forEach(plSong => {
                    const song = {
                        title: plSong.name,
                        url: null,
                        channelTitle: plSong.artists,
                        thumbnail: null,
                        duration: null,
                        findOnYT: true,
                        fn: ytdl,
                        options: {
                            filter: 'audioonly',
                            highWaterMark: 1 << 25,
                            quality: 'highestaudio',
                        },
                    };

                    songs.push(song);
                });
            } else {
                return await message.channel.send('Eu não consigo clicar velho.');
            }

            if (!serverQueue) {
                const queueContruct = {
                    textChannel: message.channel,
                    voiceChannel: message.member.voice.channel,
                    connection: null,
                    songs: [...songs],
                    volume: 100,
                    playing: true,
                    loop: false,
                    shufle: false,
                    toDelete: null,
                    position: 0,
                };

                queue.set(message.guild.id, queueContruct);

                try {
                    queueContruct.connection = await voiceChannel.join();
                    queueContruct.connection.on('disconnect', async () => {
                        queue.delete(message.guild.id);
                    });

                    await play(message, queueContruct.songs[0], message.client);
                } catch (err) {
                    console.error(err);
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
                return await message.channel.send('Tá limpo vei.');
            }

            const song = serverQueue.songs[serverQueue.position];

            return await message.channel.send(new MessageEmbed()
                .setTitle('Que porra de música é essa que tá tocando caraio!')
                .setAuthor(message.client.user.username, message.client.user.avatarURL())
                .setTimestamp()
                .setThumbnail(song.thumbnail)
                .setDescription(song.title)
                .addFields([
                    {name: 'Canal', value: song.channelTitle},
                    {name: 'Posição na fila', value: serverQueue.position + 1, inline: true},
                    {name: 'Duração', value: song.duration, inline: true},
                ]));
        },
    },

    pause: {
        description: 'Pausa a música.',

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

            serverQueue.connection.dispatcher.pause(true);
            serverQueue.playing = false;
            return await message.channel.send(`Vai gankar quem caralho.`);
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
                return await message.channel.send('ME AJUDA.');
            }

            serverQueue.connection.dispatcher.resume();
            serverQueue.playing = true;
            return await message.channel.send(`Solta o filha da puta pra eu da um tiro na cabeça dele.`);
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
            return await message.channel.send(`Caralho filha da puta morre logo.`);
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
                return await message.channel.send('ME AJUDA.');
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

            return await message.channel.send('Pode passar jovi.');
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
                return await message.channel.send('Tá limpo vei.');
            }

            serverQueue.loop = !serverQueue.loop;

            if (serverQueue.loop) {
                return await message.channel.send(`Ah Yoda vai toma no cu caraio 2 vezes seguidas.`);
            } else {
                return await message.channel.send(`Tu cancelou o auto ataque vei.`);
            }
        },
    },

    shuffle: {
        description: 'Liga/desliga o modo Aleatório.',

        /**
         *
         * @param {Message} message
         * @return {Promise<*>}
         */
        fn: async message => {
            const serverQueue = queue.get(message.guild.id);

            if (!serverQueue) {
                return await message.channel.send('Tá limpo vei.');
            }

            serverQueue.shuffle = !serverQueue.shuffle;

            if (serverQueue.shuffle) {
                return await message.channel.send(`Tu vai jogar igual um Deus brother, igual o Faker... Opa.`);
            } else {
                return await message.channel.send(`Voltamos ao assunto, quer jogar igual o Faker...`);
            }
        },
    },

    remove: {
        description: 'Remove uma música da fila.',

        /**
         *
         * @param {Message} message
         * @param {String[]} args
         * @return {Promise<*>}
         */
        fn: async (message, args) => {
            const serverQueue = queue.get(message.guild.id);

            if (!serverQueue) {
                return await message.channel.send('Tá limpo vei.');
            }

            let toRemove = (args.length > 0 && Number.isInteger(parseInt(args[0])) && parseInt(args[0]) > 0) ? parseInt(args[0]) : 1;
            if (toRemove >= serverQueue.songs.length) {
                toRemove = serverQueue.songs.length - 1;
            }

            if (toRemove === 0) {
                return await module.exports.skip.fn(message, ['1']);
            }

            serverQueue.songs.splice(toRemove, 1);

            return await message.channel.send('Cospe esse filha da puta porra.');
        },
    },

    volume: {
        description: 'Altera o volume (0-100).',

        /**
         *
         * @param {Message} message
         * @param {String[]} args
         * @return {Promise<*>}
         */
        fn: async (message, args) => {
            const serverQueue = queue.get(message.guild.id);

            if (!serverQueue) {
                return await message.channel.send('Tá limpo vei.');
            }

            let volume = (args.length > 0 && Number.isInteger(parseInt(args[0])) && parseInt(args[0]) >= 0) ? parseInt(args[0]) : 0;
            if (volume > 100) {
                volume = 100;
            }

            serverQueue.volume = volume;
            serverQueue.connection.dispatcher.setVolume(serverQueue.volume / 100);

            return await message.channel.send('Aumenta essa porra aí.');
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
                return await message.channel.send('Tá limpo vei.');
            }

            const songs = serverQueue.songs.map((s, i) => {
                return {name: `${i + 1}: ${s.title}`, value: s.channelTitle}
            });

            return await pageEmbed(message, 'Fila tá assim lek', songs);
        },
    },
};
