const rc = require('@quoin/node-rc');

const packageJson = require('./../package.json');

module.exports = rc(packageJson.name, {
    serverVersion: packageJson.version,
    serverStarted: (new Date()).toString(),
    port: process.env.PORT || '3000',
    mongoServer: process.env.MONGODB_HOST || 'localhost'
});
