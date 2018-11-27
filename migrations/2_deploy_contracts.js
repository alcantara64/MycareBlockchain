const mycare = artifacts.require('MyCare');
const policiesAndTerms = artifacts.require('PoliciesAndTerms');
// let sharedAccess = artifacts.require('SharedAccess');

module.exports = function (deployer) {
    deployer.deploy(mycare)
        .then(function () {
            let address = mycare.address;
            console.log('saved address is: ' + address);
        });

    deployer.deploy(policiesAndTerms);
    // deployer.deploy(sharedAccess);
};