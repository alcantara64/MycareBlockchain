const appRoot = require('app-root-path');
const sharedAccessController = require(`${appRoot}/api/controllers/sharedAccessController`);
const commonController = require(`${appRoot}/api/controllers/commonController`);

module.exports = function sharedAccessRoute(router) {
    router.route('/share/connection')
        .post(commonController.protected, commonController.clientProtected, sharedAccessController.validateSaveConnectionPayload, sharedAccessController.saveConnectionAttempt)
        .put(commonController.protected, commonController.clientProtected, sharedAccessController.validateUpdateConnectionPayload, sharedAccessController.updateConnectionAttempt);

    router.route('/share/connection/:connectionId')
        .get(commonController.protected, commonController.clientProtected, sharedAccessController.getConnectionAttempt);

    router.route('/share/add_consent')
        .post(commonController.protected, commonController.clientProtected, sharedAccessController.validateAddConsentParams, sharedAccessController.addConsent);

    router.route('/share/consent')
        .get(commonController.protected, commonController.clientProtected, sharedAccessController.validateGetConsentParams, sharedAccessController.getConsent);

    router.route('/share/revoke_consent')
        .put(commonController.protected, commonController.clientProtected, sharedAccessController.validateRevokeConsentParams, sharedAccessController.revokeConsent);

    router.route('/share/can_access/:consentId')
        .get(commonController.protected, commonController.clientProtected, sharedAccessController.canAccess);
};