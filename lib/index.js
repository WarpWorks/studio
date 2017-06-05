const app = require('./app');
const config = require('./config');

module.exports = {
    app,
    version: config.serverVersion
};
