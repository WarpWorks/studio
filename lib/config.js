const rc = require('@quoin/node-rc');

const packageJson = require('./../package.json');

const config = rc(packageJson.name, {
    mongoServer: process.env.MONGODB_HOST || 'localhost'
});
config.serverVersion = packageJson.version;
config.serverStarted = (new Date()).toString();

module.exports = config;
