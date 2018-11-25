const appRoot = require('app-root-path');
const mycareController = require(`${appRoot}/api/controllers/mycareController`);

module.exports = function mycareRoute (router) {
    router.route('/mycare/add_account')
        .post(mycareController.validateAddAccountParams, mycareController.addAccount);
};
