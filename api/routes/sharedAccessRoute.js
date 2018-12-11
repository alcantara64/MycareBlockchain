const appRoot = require('app-root-path');
const sharedAccessController = require(`${appRoot}/api/controllers/sharedAccessController`);

module.exports = function sharedAccessRoute(router) {
    router.route('/share/connection')
        .post(sharedAccessController.validateSaveConnectionPayload, sharedAccessController.saveConnectionAttempt)
        .put(sharedAccessController.validateUpdateConnectionPayload, sharedAccessController.updateConnectionAttempt);

    router.route('/share/connection/:connectionId')
        .get(sharedAccessController.getConnectionAttempt);

    router.route('/share/add_consent')
        .post(sharedAccessController.validateAddConsentParams, sharedAccessController.addConsent);

    router.route('/share/consent')
        .get(sharedAccessController.validateGetConsentParams, sharedAccessController.getConsent);

    router.route('/share/revoke_consent')
        .put(sharedAccessController.validateRevokeConsentParams, sharedAccessController.revokeConsent);

    router.route('/share/can_access/:consentId')
        .get(sharedAccessController.canAccess);
};