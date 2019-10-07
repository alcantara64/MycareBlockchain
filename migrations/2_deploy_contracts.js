const mycare = artifacts.require('MyCare');
const policiesAndTerms = artifacts.require('PoliciesAndTerms');
const sharedAccess = artifacts.require('SharedAccess');

module.exports = function (deployer) {
    deployer.deploy(mycare);
    deployer.deploy(policiesAndTerms);
    deployer.deploy(sharedAccess);
};