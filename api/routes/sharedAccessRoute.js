const appRoot = require('app-root-path');
const sharedAccessController = require(`${appRoot}/api/controllers/sharedAccessController`);

module.exports = function sharedAccessRoute(router) {
    router.route('/share/connection')
        .post(sharedAccessController.validateSaveConnectionPayload, sharedAccessController.saveConnectionAttempt)
        .put(sharedAccessController.validateUpdateConnectionPayload, sharedAccessController.updateConnectionAttempt);

    router.route('/share/connection/:connectionId')
        .get(sharedAccessController.getConnectionAttempt);
};