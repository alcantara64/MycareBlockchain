const appRoot = require('app-root-path');
const sharedAccessController = require(`${appRoot}/api/controllers/sharedAccessController`);
const commonController = require(`${appRoot}/api/controllers/commonController`);
const { ROLES } = require(`${appRoot}/api/constants/authConstants`);

module.exports = function sharedAccessRoute(router) {
    router.route('/share/connection')
        .post(commonController.authorize(ROLES.CLIENT), sharedAccessController.validateSaveConnectionPayload, sharedAccessController.saveConnectionAttempt)
        .put(commonController.authorize(ROLES.CLIENT), sharedAccessController.validateUpdateConnectionPayload, sharedAccessController.updateConnectionAttempt);

    router.route('/share/connection/:connectionId')
        .get(commonController.authorize(ROLES.CLIENT), sharedAccessController.getConnectionAttempt);

    router.route('/share/add_consent')
        .post(commonController.authorize(ROLES.CLIENT), sharedAccessController.validateAddConsentParams, sharedAccessController.addConsent);

    router.route('/share/consent')
        .get(commonController.authorize(ROLES.CLIENT), sharedAccessController.validateGetConsentParams, sharedAccessController.getConsent);

    router.route('/share/revoke_consent')
        .put(commonController.authorize(ROLES.CLIENT), sharedAccessController.validateRevokeConsentParams, sharedAccessController.revokeConsent);

    router.route('/share/can_access/:consentId')
        .get(commonController.authorize(ROLES.CLIENT), sharedAccessController.canAccess);
};