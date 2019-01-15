const appRoot = require('app-root-path');
const authController = require(`${appRoot}/api/controllers/authController`);

module.exports = function (router) {
    router.route('/auth')
        .post(authController.getAccessToken);

    // only super admin has access to these routes
    router.route('/auth/new_client')
        .post(authController.newClient);

    router.route('/auth/clients')
        .get(authController.getClients);

    router.route('/auth/client/:id')
        .get(authController.validateClientExists, authController.getClientById)
        .put(authController.validateClientExists, authController.updateClient);
};