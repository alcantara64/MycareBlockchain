const appRoot = require('app-root-path');

const policiesAndTermsController = require(`${appRoot}/api/controllers/policiesAndTermsController`);
const commonController = require(`${appRoot}/api/controllers/commonController`);
const { ROLES } = require(`${appRoot}/api/constants/authConstants`);

module.exports = function policiesAndTermsRoute(router) {
    router.route('/terms_and_policies/add_document')
        .post(commonController.authorize(ROLES.CLIENT), policiesAndTermsController.validateAddDocumentPayload, policiesAndTermsController.addNewDocument);

    router.route('/terms_and_policies/add_acceptance')
        .post(commonController.authorize(ROLES.CLIENT), policiesAndTermsController.validateAcceptancePayload, policiesAndTermsController.saveAcceptance);

    router.route('/terms_and_policies/document/:documentHash')
        .get(commonController.authorize(ROLES.CLIENT), policiesAndTermsController.getDocument);

    router.route('/terms_and_policies/acceptance')
        .get(commonController.authorize(ROLES.CLIENT), policiesAndTermsController.getUserAcceptance);
};