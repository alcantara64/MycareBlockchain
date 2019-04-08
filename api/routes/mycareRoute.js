const appRoot = require('app-root-path');
const mycareController = require(`${appRoot}/api/controllers/mycareController`);
const commonController = require(`${appRoot}/api/controllers/commonController`);
const { ROLES } = require(`${appRoot}/api/constants/authConstants`);

module.exports = function mycareRoute(router) {
    router.route('/mycare/add_account')
        .post(commonController.authorize(ROLES.CLIENT), mycareController.validateAddAccountParams, mycareController.addAccount);

    router.route('/mycare/account')
        .get(commonController.authorize(ROLES.CLIENT), mycareController.getAccount);

    router.route('/mycare/deactivate_account')
        .put(commonController.authorize(ROLES.CLIENT), mycareController.validateDeactivateAccountParams, mycareController.deactivateAccount);

    router.route('/mycare/account_count')
        .get(commonController.authorize(ROLES.CLIENT), mycareController.getAccountsCount);

    router.route('/generate_chain_account')
        .get(commonController.authorize(ROLES.CLIENT), mycareController.generateChainAccount);
};