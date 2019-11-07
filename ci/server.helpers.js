const Gelf = require('gelf');
const boxen = require('boxen');
const chalk = require('chalk');
const ip = require('ip');

const unixTimestamp = () => {
    'use strict';
    const timestamp = Date.now().toString();
    return timestamp.substring(0, 10) + '.' + timestamp.substring(10, 13);
};

const calcDefault = (value) => {
    'use strict';
    return value === '<now>' ? unixTimestamp() : value;
};

const buildMessage = (msgBase) => {
    'use strict';
    const ret = {};

    const mandatory = []; //'sender', 'short_message'
    for (let i = 0; i < mandatory.length; i++) {
        const m = mandatory[i];
        if (typeof msgBase[m] === 'undefined') {
            throw new Error('Missing mandatory field: ' + m);
        }
    }

    const defaults = {
        version: '1.1',
        level: 1,
        timestamp: '<now>'
    };
    Object.keys(msgBase).forEach(function (key) {
        Object.keys(defaults).forEach(function (dkey) {
            if (typeof msgBase[dkey] === 'undefined') {
                ret[dkey] = calcDefault(defaults[dkey]);
            }
        });
        ret[key] = msgBase[key];
    });
    return ret;
};

const gelfInstance = () => {
    'use strict';
    return new Gelf({
        graylogPort: 12206,
        graylogHostname: 'oaslogstash',
        connection: 'lan',
        maxChunkSizeWan: 1420,
        maxChunkSizeLan: 8154
    });
};

const submitGelf = (msg) => {
    'use strict';
    const gelf = gelfInstance();
    const message = buildMessage(msg);
    gelf.emit('gelf.log', message);
};

const logToLogstash = (req, res) => {
    'use strict';
    //console.log('logToLogstash', req.body);
    submitGelf(req.body);
    res.send('{"status": "ok"}');
};

const printServingMessage = (servingFolder, host, port) => {
    'use strict';
    let message = chalk.green('Master, here is your webz!');

    message += `\n\n- ${chalk.bold('Folder:          ')} ${servingFolder}`;

    const localURL = `http://${host}:${port}`;
    message += `\n- ${chalk.bold('Local:           ')} ${localURL}`;

    try {
        const ipAddress = ip.address();
        const url = `http://${ipAddress}:${port}`;

        message += `\n- ${chalk.bold('On Your Network: ')} ${url}`;
    } catch (err) {
        // Don't do anything
    }

    message += '\n\n' + chalk.green('GLHF!');

    console.log( // eslint-disable-line no-console
        boxen(message, {
            padding: 1,
            borderColor: 'green',
            margin: 1
        })
    );
};

module.exports = {
    logToLogstash,
    printServingMessage
};