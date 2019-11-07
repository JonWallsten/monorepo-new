const startServer = require('./server');
const globals = require(process.cwd() + '/config/globals'); // ts-node is require to parse this file

startServer(globals.host, globals.port, globals.devServerUrl);
