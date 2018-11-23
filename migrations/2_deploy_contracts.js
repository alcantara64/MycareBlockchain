let mycare = artifacts.require("MyCare");
let policiesAndTerms = artifacts.require('PoliciesAndTerms');
let sharedAccess = artifacts.require('SharedAccess');
const fs = require('fs');

module.exports = function(deployer) {
  deployer.deploy(mycare)
  .then(function(){
    let address = mycare.address;
    console.log('saved address is: ' + address);
  });

  deployer.deploy(policiesAndTerms);
  deployer.deploy(sharedAccess);
};
