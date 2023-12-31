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

const curProfile = process.env.PROFILE || 'dev';
const configPath = `./profiles/${curProfile}.env`;
const dotenv = require('dotenv').config({ path: configPath });

const envHelper = require(`${appRoot}/api/helpers/envHelper`);
const logger = require(`${appRoot}/config/winston`);
const emailHelper = require('./api/helpers/emailHelper');

if (dotenv.error) {
    throw dotenv.error;
}

const app = express();
let envConstants = null;

logger.info('Initializing env constants and secrets...');
envHelper.initialize()
    .then(async function envHelperInitilised() {
        logger.info('env constants and secrets initialised successfully');

        envConstants = envHelper.getConstants();

        // load application insight
        require(`${appRoot}/config/appInsight`);
        const port = envConstants.PORT || 4000;
        const mycareRoute = require(`${appRoot}/api/routes/mycareRoute`);
        const sharedAccessRoute = require(`${appRoot}/api/routes/sharedAccessRoute`);
        const authRoute = require(`${appRoot}/api/routes/authRoute`);
        const userRoute = require(`${appRoot}/api/routes/userRoute`);
        const policiesAndTermsRoute = require(`${appRoot}/api/routes/policiesAndTermsRoute`);
        const userService = require(`${appRoot}/api/services/userService`);
        // initialize database configuration
        require(`${appRoot}/config/dbConnection`);

        const router = express.Router();

        mycareRoute(router);
        sharedAccessRoute(router);
        policiesAndTermsRoute(router);
        authRoute(router);
        userRoute(router);

        // Authentication middleware
        require(`${appRoot}/api/middlewares/authentication/auth`);

        // parse application/x-www-form-urlencoded
        app.use(bodyParser.urlencoded({ extended: false }));

        // parse application/json
        app.use(bodyParser.json());

        app.use(morgan('combined', {
            stream: logger.stream
        }));

        app.use('/api/v1', router);

        // seed data
        userService.createAdminUser();

        app.listen(port);
    }).catch(err => console.error(err));
process.on('uncaughtException', (exception) => {
    logger.info(`Unhandle exception occured ${exception}`);
    emailHelper.sendMail(envConstants.ADMIN_EMAIL, 'Fatal Error on the blockchain', 'fatalError', { errorMessage: exception });
});
module.exports = app;