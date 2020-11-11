module.exports = {
    queue: new Map(),
    startupTime: new Date(),
    serverConfig: null,

    setServerConfig: (sc) => {
        module.exports.serverConfig = sc;
    },
}
