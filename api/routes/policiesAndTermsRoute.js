const appRoot = require('app-root-path');

const policiesAndTermsController = require(`${appRoot}/api/controllers/policiesAndTermsController`);

module.exports = function policiesAndTermsRoute(router) {
    router.route('/terms_and_policies/add_document')
        .post(policiesAndTermsController.validateAddDocumentPayload, policiesAndTermsController.addNewDocument);

    router.route('/terms_and_policies/add_acceptance')
        .post(policiesAndTermsController.validateAcceptancePayload, policiesAndTermsController.saveAcceptance);

    router.route('/terms_and_policies/document/:documentHash')
        .get(policiesAndTermsController.getDocument);

    router.route('/terms_and_policies/acceptance')
        .get(policiesAndTermsController.getUserAcceptance);
};