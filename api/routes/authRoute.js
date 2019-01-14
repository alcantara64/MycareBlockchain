const appRoot = require('app-root-path');
const authController = require(`${appRoot}/api/controllers/authController`);

module.exports = function (router) {
    router.route('/auth')
        .post(authController.getAccessToken);
};