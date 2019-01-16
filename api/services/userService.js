const appRoot = require('app-root-path');
const fs = require('fs');
const crypto = require('crypto');
const logger = require(`${appRoot}/config/winston`);
const User = require(`${appRoot}/api/models/userModel`);
const helperMethods = require(`${appRoot}/api/helpers/helperMethods`);

exports.createAdminUser = async function () {
    try {
        logger.info('Seed data for admin user');

        const userData = fs.readFileSync(`${appRoot}/util/seedData/adminUser.json`);
        const user = JSON.parse(userData);

        const dbUser = await User.findOne({
            email: user.email
        });

        if (!dbUser) {
            logger.info('Creating user');
            user.salt = crypto.randomBytes(16).toString('hex');
            user.hash = helperMethods.hashPassword(user.salt, user.password);

            user.role = ['Admin'];

            await User.create(user);
            logger.info('created user successflly');
        } else {
            logger.info('User already exists');
        }
    } catch (err) {
        logger.info(`error occured creating admin user ${err.message}`);
    }
};