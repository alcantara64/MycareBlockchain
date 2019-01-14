'use strict';

/*
 * app.js
 *
 * define environment for express server
 */
const appRoot = require('app-root-path');
const bodyParser = require('body-parser');
const express = require('express');
const morgan = require('morgan');
const dotenv = require('dotenv-flow').config();

const winston = require(`${appRoot}/config/winston`);
const mycareRoute = require(`${appRoot}/api/routes/mycareRoute`);
const sharedAccessRoute = require(`${appRoot}/api/routes/sharedAccessRoute`);
const authRoute = require(`${appRoot}/api/routes/authRoute`);
const policiesAndTermsRoute = require(`${appRoot}/api/routes/policiesAndTermsRoute`);
const clientService = require(`${appRoot}/api/services/clientService`);
// initialize database configuration
require(`${appRoot}/config/dbConnection`);

// generate seed data
clientService.seedData();

const port = process.env.PORT || 4000;

if (dotenv.error) {
    throw dotenv.error;
}

const router = express.Router();

mycareRoute(router);
sharedAccessRoute(router);
policiesAndTermsRoute(router);
authRoute(router);

const app = express();

// Authentication middleware
require(`${appRoot}/api/middlewares/authentication/auth`);

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

// parse application/json
app.use(bodyParser.json());

app.use(morgan('combined', {
    stream: winston.stream
}));

app.use('/api/v1', router);

app.listen(port);

module.exports = app;