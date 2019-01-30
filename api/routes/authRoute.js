const appRoot = require('app-root-path');
const authController = require(`${appRoot}/api/controllers/authController`);
const commonController = require(`${appRoot}/api/controllers/commonController`);

module.exports = function (router) {
    router.route('/auth')
        .post(authController.getAccessToken);

    // only super admin has access to these routes
    router.route('/auth/new_client')
        .post(commonController.protected, commonController.adminProtected, authController.newClient);

    router.route('/auth/clients')
        .get(commonController.protected, commonController.adminProtected, authController.getClients);

    router.route('/auth/client/:id')
        .get(commonController.protected, commonController.adminProtected, authController.validateClientExists, authController.getClientById)
        .put(commonController.protected, commonController.adminProtected, authController.validateClientExists, authController.updateClient)
        .delete(commonController.protected, commonController.adminProtected, authController.validateClientExists, authController.deleteClient);
};