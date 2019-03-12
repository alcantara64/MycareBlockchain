const appRoot = require('app-root-path');
const authController = require(`${appRoot}/api/controllers/authController`);
const commonController = require(`${appRoot}/api/controllers/commonController`);
const { ROLES } = require(`${appRoot}/api/constants/authConstants`);

module.exports = function (router) {
    router.route('/auth')
        .post(authController.getAccessToken)
        .get(commonController.authorize(ROLES.CLIENT), authController.validateToken);

    // only super admin has access to these routes
    router.route('/auth/new_client')
        .post(commonController.authorize(ROLES.ADMIN), authController.newClient);

    router.route('/auth/clients')
        .get(commonController.authorize(ROLES.ADMIN), authController.getClients);

    router.route('/auth/client/:id')
        .get(commonController.authorize(ROLES.ADMIN), authController.validateClientExists, authController.getClientById)
        .put(commonController.authorize(ROLES.ADMIN), authController.validateClientExists, authController.updateClient)
        .delete(commonController.authorize(ROLES.ADMIN), authController.validateClientExists, authController.deleteClient);
};