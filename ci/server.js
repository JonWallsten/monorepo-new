const bodyParser = require('body-parser');
const express = require('express');
const { printServingMessage, logToLogstash } = require('./server.helpers');


const startServer = function(host, port) {
    'use strict';

    const app = express();
    const servingFolder = './dist';

    app.use(function (req, res, next) {
        res.header('Access-Control-Allow-Origin', req.get('Origin'));
        res.header('Access-Control-Expose-Headers', 'Location, Content-Length, ETag, Content-disposition');
        res.header('Access-Control-Allow-Credentials', 'true');
        next();
    });

    if (process.env.IS_LOCAL) {
        app.post('/log', function (req, res) { // eslint-disable-line no-unused-vars
            res.send('External logging disabled when serving dynamic content on localhost');
        });
    } else {
        app.use('/log', bodyParser.json());
        app.post('/log', logToLogstash);
    }
    if (printServingMessage) {
        printServingMessage(servingFolder, host, port);
    }

    app.use(express.static(servingFolder));
    app.listen(port);
};

module.exports = startServer;
