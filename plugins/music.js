const {Message, MessageEmbed} = require('discord.js');
const isoCountries = require('iso-3166-1');
const ytdl = require('ytdl-core');
const scdl = require('soundcloud-downloader');
const SpotifyWebAPI = require('spotify-web-api-node');

const {queue, serverConfig} = require('../global');
const {database_url, prefix, ytapikey, scclientID, spclientID, spsecret} = require('../config.js');
const {serverConfigConstruct, queueConstruct, saveServerConfig, isValidHttpURL, isAsync, cutUntil, parseMS, pageEmbed, searchVideo, videoInfo, getPlaylistItems, getSpotifyPlaylistItems} = require('../lib/utils');

const spotifyAPI = new SpotifyWebAPI({
    clientId: spclientID,
    clientSecret: spsecret,
    redirectUri: 'http://jukesbox.herokuapp.com',
});

/**
 *
 * @param {Message} message
 * @return {Promise<*>}
 */
async function play(message) {
    const serverQueue = queue.get(message.guild.id);

    if (!serverQueue) {
        return;
    }

    if (serverQueue.toDelete !== null && !serverQueue.toDelete.deleted) {
        await serverQueue.toDelete.delete().catch((e) => {
            console.error(e);
        });
        serverQueue.toDelete = null;
    }

    if (serverQueue.songs.length === 0) {
        queue.delete(message.guild.id);
        return;
    }

    if (serverQueue.song.findOnYT) {
        const msg = await message.channel.send('Procurando no YouTube...');
        const found = await findOnYT(message, serverQueue.song.title);
        await msg.delete();
        if (!found) {
            serverQueue.toDelete = await message.channel.send('Achei nada lesk.');
            serverQueue.songs.shift();
            await play(message);
        }

        serverQueue.song = {...serverQueue.song, ...found};
    }

    serverQueue.song.stream = isAsync(serverQueue.song.fn) ? await serverQueue.song.fn(serverQueue.song.url, serverQueue.song.options) : serverQueue.song.fn(serverQueue.song.url, serverQueue.song.options);

    serverQueue.connection.play(serverQueue.song.stream, {
        seek: serverQueue.seek,
        volume: serverQueue.volume / 100
    }).on('finish', async () => {
        if (serverQueue.seek === 0) {
            if (!serverQueue.loop) {
                serverQueue.songs.splice(serverQueue.position, 1);
            }

            serverQueue.position = 0;
            if (serverQueue.shuffle) {
                serverQueue.position = Math.floor(Math.random() * serverQueue.songs.length);
            }
        }

        await play(message);
    }).on('error', async e => {
        console.error(e);

        await message.channel.send('Eu não consigo clicar velho.');
        serverQueue.songs.shift();
        await play(message);
    });

    serverQueue.seek = 0;
    serverQueue.toDelete = await module.exports.np.fn(message);
}

/**
 *
 * @param {Message} message
 * @param {String} q
 * @return {Promise<null|{duration: any, thumbnail: String, fn: Function, options: {filter: string, requestOptions: {headers: {Authorization: string}}, highWaterMark: number, quality: string}, title: *, url: *, channelTitle: string}>}
 */
async function findOnYT(message, q) {
    const url = ((await searchVideo(q, {
        key: ytapikey,
        regionCode: (isoCountries.whereCountry(message.guild.region) || {alpha2: 'us'}).alpha2.toLowerCase(),
        type: 'video',
        part: ['id'],
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
            requestOptions: {
                host: 'jukesbox.herokuapp.com',
                headers: {
                    Authorization: `Bearer ${ytapikey}`,
                }
            },
        },
    };
}

module.exports = {
    join: {
        description: 'Entra no canal de voz.',
        usage: 'join',

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
                return await message.channel.send('ME AJUDA!');
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
        usage: 'leave',

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
        usage: 'search [/playlist] [q]',

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
                .setDescription(results.map((r, i) => `**${i + 1}** - ${r.snippet.title} (${r.url})`).join('\n\n')));
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

    videoinfo: {
        description: 'Mostra informações de um vídeo do YouTube',
        usage: 'videoinfo [youtube_url]',

        /**
         *
         * @param {Message} message
         * @param {String[]} args
         * @return {Promise<*>}
         */
        fn: async (message, args) => {
            if (!isValidHttpURL(args[0]) || !args[0].match(/(\/watch\?v=|youtu.be\/)/gmu)) {
                return await message.channel.send('URL inválida.');
            }

            const videoId = /(\/watch\?v=|youtu.be\/)(?<VideoId>[^&#]+)/gmu.exec(args[0]).groups.VideoId;
            const songInfo = (await videoInfo(videoId, {
                key: ytapikey,
                part: ['id', 'snippet', 'contentDetails', 'statistics']
            }).catch(e => {
                console.error(e);
                return null;
            }))[0];

            if (!songInfo) {
                return await message.channel.send('Eu não consigo clicar velho.');
            }

            return await message.channel.send(new MessageEmbed()
                .setTitle('Informações do vídeo')
                .setURL(songInfo.url)
                .setAuthor(message.client.user.username, message.client.user.avatarURL())
                .setTimestamp()
                .setThumbnail(songInfo.snippet.thumbnails.high.url)
                .setDescription(songInfo.snippet.title)
                .addFields([
                    {name: 'Canal', value: songInfo.snippet.channelTitle, inline: true},
                    {name: 'Duração', value: parseMS(songInfo.duration * 1000).toString(), inline: true},
                    {name: 'Descrição', value: cutUntil(songInfo.snippet.description, 1024) || '(Sem descrição)'},
                    {name: '👁‍ Views', value: songInfo.statistics.viewCount, inline: true},
                    {name: '👍 Likes', value: songInfo.statistics.likeCount, inline: true},
                    {name: '👎 Dislikes', value: songInfo.statistics.dislikeCount, inline: true},
                ]));
        },
    },

    play: {
        description: 'Adiciona uma música/playlist na fila. `/playlist` para procurar por playlists.',
        usage: 'play [/playlist] [youtube_url|q]',

        alias: ['p'],

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
                part: ['id'],
            }))[0] || {url: null}).url || null;

            if (!url) {
                return await message.channel.send('Achei nada lesk.');
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
                            from: 'yt',
                            addedBy: message.author,
                            fn: ytdl,
                            options: {
                                filter: 'audioonly',
                                highWaterMark: 1 << 25,
                                quality: 'highestaudio',
                                requestOptions: {
                                    host: 'jukesbox.herokuapp.com',
                                    headers: {
                                        Authorization: `Bearer ${ytapikey}`,
                                    }
                                },
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
                        from: 'yt',
                        addedBy: message.author,
                        fn: ytdl,
                        options: {
                            filter: 'audioonly',
                            highWaterMark: 1 << 25,
                            quality: 'highestaudio',
                            requestOptions: {
                                host: 'jukesbox.herokuapp.com',
                                headers: {
                                    Authorization: `Bearer ${ytapikey}`,
                                }
                            },
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

                const song = {
                    title: songInfo.title,
                    url: songInfo.permalink_url,
                    channelTitle: songInfo.user.username,
                    thumbnail: songInfo.artwork_url,
                    duration: songInfo.duration / 1000,
                    from: 'sc',
                    addedBy: message.author,
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
                        from: 'sp',
                        addedBy: message.author,
                        fn: ytdl,
                        options: {
                            filter: 'audioonly',
                            highWaterMark: 1 << 25,
                            quality: 'highestaudio',
                            requestOptions: {
                                host: 'jukesbox.herokuapp.com',
                                headers: {
                                    Authorization: `Bearer ${ytapikey}`,
                                }
                            },
                        },
                    };

                    songs.push(song);
                });
            } else {
                return await message.channel.send('Eu não consigo clicar velho.');
            }

            if (!serverQueue) {
                const sc = serverConfig.get(message.guild.id) || serverConfigConstruct(prefix);
                const q = queueConstruct(message, sc.volume, songs);

                queue.set(message.guild.id, q);

                try {
                    q.connection = await voiceChannel.join();
                    q.connection.on('disconnect', async () => {
                        queue.delete(message.guild.id);
                    });

                    await play(message);
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
        usage: 'np',

        /**
         *
         * @param {Message} message
         * @return {Promise<*>}
         */
        fn: async message => {
            const serverQueue = queue.get(message.guild.id);

            if (!serverQueue) {
                await message.channel.send('Tá limpo vei.');
                return null;
            }

            return await message.channel.send(new MessageEmbed()
                .setTitle('Que porra de música é essa que tá tocando caraio!')
                .setURL(serverQueue.song.url)
                .setAuthor(serverQueue.song.addedBy.username, serverQueue.song.addedBy.avatarURL())
                .setColor({yt: 'RED', sc: 'ORANGE', sp: 'GREEN'}[serverQueue.song.from])
                .setTimestamp()
                .setThumbnail(serverQueue.song.thumbnail)
                .setDescription(serverQueue.song.title)
                .addFields([
                    {name: 'Canal', value: serverQueue.song.channelTitle},
                    {name: 'Posição na fila', value: serverQueue.position + 1, inline: true},
                    {name: 'Duração', value: parseMS(serverQueue.song.duration * 1000).toString(), inline: true},
                ]));
        },
    },

    pause: {
        description: 'Pausa a música.',
        usage: 'pause',

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
                return await message.channel.send('Tá limpo vei.');
            }

            serverQueue.connection.dispatcher.pause(true);
            serverQueue.playing = false;
            return await message.channel.send(`Vai gankar quem caralho.`);
        },
    },

    resume: {
        description: 'Continua a reprodução da música.',
        usage: 'resume',

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
                return await message.channel.send('Tá limpo vei.');
            }

            serverQueue.connection.dispatcher.resume();
            serverQueue.playing = true;
            return await message.channel.send(`Solta o filha da puta pra eu da um tiro na cabeça dele.`);
        },
    },

    seek: {
        description: 'Altera a posição da música. Formato em `xS`.',
        usage: 'seek [s]',

        /**
         *
         * @param {Message} message
         * @param {String} args
         * @return {Promise<*>}
         */
        fn: async (message, args) => {
            const serverQueue = queue.get(message.guild.id);

            if (!serverQueue) {
                return await message.channel.send('Tá limpo vei.');
            }

            if (args.length === 0) {
                return await message.channel.send('Sem meu tempo eu não consigo.');
            }

            let s = (Number.isInteger(parseInt(args[0])) && parseInt(args[0]) >= 0) ? parseInt(args[0]) : 0;
            if (s > serverQueue.song.duration) {
                s = serverQueue.song.duration;
            }

            serverQueue.seek = s;
            await serverQueue.connection.dispatcher.end();
        },
    },

    stop: {
        description: 'Limpa a fila e para de tocar.',
        usage: 'stop',

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
                return await message.channel.send('Tá limpo vei.');
            }

            serverQueue.songs = [];
            serverQueue.connection.dispatcher.end();
            serverQueue.playing = false;
            return await message.channel.send(`Caralho filha da puta morre logo.`);
        },
    },

    skip: {
        description: 'Pula {n} músicas.',
        usage: 'skip [n]',

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
                return await message.channel.send('Tá limpo vei.');
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
        usage: 'loop',

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
        usage: 'shuffle',

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
        usage: 'remove',

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
        usage: 'volume [v]',

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

            const sc = serverConfig.get(message.guild.id) || serverConfigConstruct(prefix);
            sc.volume = volume;
            serverConfig.set(message.guild.id, sc);
            await saveServerConfig(database_url, message.guild.id, sc);

            return await message.channel.send('Aumenta essa porra aí.');
        },
    },

    queue: {
        description: 'Mostra a fila.',
        usage: 'queue',

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

            return await pageEmbed(message, {title: 'Fila tá assim lek'}, songs);
        },
    },
};
