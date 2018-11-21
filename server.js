'use strict';

/*
 * app.js
 *
 * define environment for express server
 */
const dotenv = require('dotenv-flow').config();

if (dotenv.error) {
  throw dotenv.error;
}

const express = require('express');

const app = express();

const port = process.env.PORT || 4000;

app.listen(port);

module.exports = app;
