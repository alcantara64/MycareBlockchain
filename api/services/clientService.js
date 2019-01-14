const appRoot = require('app-root-path');
const Client = require(`${appRoot}/api/models/clientModel`);
// const Client = require('../models/clientModel');
const logger = require(`${appRoot}/config/winston`);
const crypto = require('crypto');

exports.getOne = function (query) {
    return Client.findOne(query);
};

exports.get = function (query = {}, startFrom, limitTo) {
    return Client.find(query).sort({
        name: 'desc'
    });
};

exports.seedData = async function () {
    logger.info('Checking seed data');
    const clientCount = await Client.count();
    logger.info(`clients count: ${clientCount}`);

    if (clientCount < 2) {
        logger.info('generating seed data');
        const mycareAPI = {
            name: 'MyCareAPI',
            email: 'mycare@newwave.io',
            clientId: crypto.randomBytes(80).toString('hex'),
            clientSecret: crypto.randomBytes(80).toString('hex')
        };

        const eobAPI = {
            name: 'EOB-API',
            email: 'maze@email.com',
            clientId: crypto.randomBytes(80).toString('hex'),
            clientSecret: crypto.randomBytes(80).toString('hex')
        };

        const records = await Client.insertMany([mycareAPI, eobAPI]);
        logger.info('saved new records');

        logger.info(records);
    }
};