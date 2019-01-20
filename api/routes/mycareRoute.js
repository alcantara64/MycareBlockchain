const appRoot = require('app-root-path');
const mycareController = require(`${appRoot}/api/controllers/mycareController`);
const commonController = require(`${appRoot}/api/controllers/commonController`);

module.exports = function mycareRoute(router) {
    router.route('/mycare/add_account')
        .post(commonController.protected, commonController.clientProtected, mycareController.validateAddAccountParams, mycareController.addAccount);

    router.route('/mycare/account')
        .get(commonController.protected, commonController.clientProtected, mycareController.getAccount);

    router.route('/mycare/deactivate_account')
        .put(commonController.protected, commonController.clientProtected, mycareController.validateDeactivateAccountParams, mycareController.deactivateAccount);

    router.route('/mycare/account_count')
        .get(commonController.protected, commonController.clientProtected, mycareController.getAccountsCount);

    router.route('/generate_chain_account')
        .get(commonController.protected, commonController.clientProtected, mycareController.generateChainAccount);
};