const appRoot = require('app-root-path');
const mycareController = require(`${appRoot}/api/controllers/mycareController`);
const commonController = require(`${appRoot}/api/controllers/commonController`);

module.exports = function mycareRoute(router) {
    router.route('/mycare/add_account')
        .post(mycareController.validateAddAccountParams, mycareController.addAccount);

    router.route('/mycare/account')
        .get(mycareController.getAccount);

    router.route('/mycare/deactivate_account')
        .put(mycareController.validateDeactivateAccountParams, mycareController.deactivateAccount);

    router.route('/mycare/account_count')
        .get(mycareController.getAccountsCount);

    router.route('/generate_chain_account')
        .get(commonController.protected, mycareController.generateChainAccount);
};
