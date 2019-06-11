const appRoot = require('app-root-path');
const fs = require('fs');
const crypto = require('crypto');
const logger = require(`${appRoot}/config/winston`);
const User = require(`${appRoot}/api/models/userModel`);
const helperMethods = require(`${appRoot}/api/helpers/helperMethods`);
const { ROLES } = require(`${appRoot}/api/constants/authConstants`);
const azureKeyVault = require(`${appRoot}/api/middlewares/authentication/azureKeyVault`);

exports.createAdminUser = async function () {
    try {
        logger.info('Seed data for admin user');

        const userData = fs.readFileSync(`${appRoot}/util/seedData/adminUser.json`);
        const user = JSON.parse(userData);

        const email = (await azureKeyVault.getSecret(process.env.ADMIN_EMAIL, '')).value;
        const password = (await azureKeyVault.getSecret(process.env.ADMIN_PASSWORD, '')).value;

        const dbUser = await User.findOne({
            email
        });

        if (!dbUser) {
            logger.info('Creating user');
            user.salt = crypto.randomBytes(16).toString('hex');
            user.hash = helperMethods.hashPassword(user.salt, password);

            user.role = [ROLES.ADMIN];

            user.email = email;

            await User.create(user);
            logger.info('created user successflly');
        } else {
            logger.info('User already exists');
        }
    } catch (err) {
        logger.info(`error occured creating admin user ${err.message}`);
    }
};