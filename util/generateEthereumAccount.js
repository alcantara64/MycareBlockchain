const wallet = require('ethereumjs-wallet');

// Generate a new Ethereum account
console.log('Generating new Ethereum Address \n');
let account = wallet.generate();
let accountAddress = account.getAddressString();
let privateKey = account.getPrivateKeyString().slice(2);

const accountKeyPair = {
    accountAddress,
    privateKey
};

console.log(accountKeyPair);
