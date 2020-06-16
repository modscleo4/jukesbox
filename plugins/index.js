const fs = require('fs');

let commands = {};
fs.readdirSync('./plugins/').filter(module => !(['index.js'].includes(module))).forEach(module => {
    commands = {...commands, ...require(`./${module}`)};
});

module.exports = commands;
