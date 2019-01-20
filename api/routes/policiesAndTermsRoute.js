const appRoot = require('app-root-path');

const policiesAndTermsController = require(`${appRoot}/api/controllers/policiesAndTermsController`);
const commonController = require(`${appRoot}/api/controllers/commonController`);

module.exports = function policiesAndTermsRoute(router) {
    router.route('/terms_and_policies/add_document')
        .post(commonController.protected, commonController.clientProtected, policiesAndTermsController.validateAddDocumentPayload, policiesAndTermsController.addNewDocument);

    router.route('/terms_and_policies/add_acceptance')
        .post(policiesAndTermsController.validateAcceptancePayload, policiesAndTermsController.saveAcceptance);

    router.route('/terms_and_policies/document/:documentHash')
        .get(commonController.protected, commonController.clientProtected, policiesAndTermsController.getDocument);

    router.route('/terms_and_policies/acceptance')
        .get(commonController.protected, commonController.clientProtected, policiesAndTermsController.getUserAcceptance);
};