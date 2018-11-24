'use strict';

/*
 * app.js
 *
 * define environment for express server
 */
const appRoot = require('app-root-path');
const morgan = require('morgan');
const dotenv = require('dotenv-flow').config();
const winston = require(`${appRoot}/config/winston`);

const port = process.env.PORT || 4000;

if (dotenv.error) {
  throw dotenv.error;
}

const express = require('express');
const router = express.Router();

const app = express();

app.use(morgan('combined', { stream: winston.stream }));

app.use('/api/v1', router);

app.listen(port);

module.exports = app;
