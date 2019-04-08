const appRoot = require('app-root-path');
const userController = require(`${appRoot}/api/controllers/userController`);

module.exports = function (router) {
    router.route('/user')
        .post(userController.login);
};