const fs = require('fs');

let commands = {};
fs.readdirSync('./plugins/').filter(module => !(['index.js'].includes(module))).forEach(module => {
    delete require.cache[require.resolve(`./${module}`)];
    commands = {...commands, ...require(`./${module}`)};
});

module.exports = commands;
