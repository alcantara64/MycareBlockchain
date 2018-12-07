const appRoot = require('app-root-path');
const fs = require('fs');
const ursa = require('ursa');
const nw = require('niceware');
const uuid = require('uuid');
const encryptor = require('file-encryptor');

const options = {
    algorithm: 'aes256'
};
const crypto = require('crypto');
const Cryptr = require('cryptr');
const btoa = require('btoa');
const atob = require('atob');
const logger = require(`${appRoot}/config/winston`);
const ethereumHelper = require(`${appRoot}/api/helpers/ethereumHelper`);
// Load this once on startup
let platformPrivateKey;
/*
 *
 */

//  0000
exports.generatePrivateRSAKey = function generatePrivateRSAKey() {
    return ursa.generatePrivateKey(2048, 65537);
};

exports.platformKey = function platformKey() {
    return platformPrivateKey || this.loadPlatformKey();
};

exports.loadPlatformKey = function loadPlatformKey() {
    const privateKeyLocation = './private/MyCarePrivKey.pem';
    const pemText = fs.readFileSync(privateKeyLocation).toString('utf8');
    platformPrivateKey = ursa.createPrivateKey(pemText);
    return platformPrivateKey;
};

exports.loadPlatformPublicKey = function loadPlatformPublicKey() {
    const privateKeyLocation = './private/MyCarePubKey.pem';
    return this.loadPublicKey(privateKeyLocation);
};

exports.saveKey = function saveKey(u, fsPath) {
    const pemText = JSON.stringify(u.toPrivatePem()).toString('utf8');
    fs.writeFile(fsPath, pemText, (err) => {
        logger.info(`${err}`);
        throw err;
    });
};

exports.savePublicKey = function savePublicKey(u, fsPath) {
    logger.info(`${u.toPublicPem().toString()}`);
    const text = u.toPublicPem().toString();

    return new Promise(((resolve, reject) => {
        fs.writeFile(fsPath, text, (err) => {
            if (err) reject(err);
        });
    }));
};


exports.publicKey = function publicKey(keyPair) {
    logger.info(`${keyPair}`);
    return keyPair.toPublicPem().toString('utf8');
};

exports.privateKey = function privateKey(keyPair) {
    return keyPair.toPrivatePem().toString('utf8');
};

//  Currently Unused at least internally
exports.encryptedPrivateKey = function encryptedPrivateKey(keyPair) {
    const platformKey = this.platformKey();
    //  Will encrypt the private key with a random pass phrase
    //  returns the encrypted key, along with the pass phrase encrypted
    //    with the platform public key
    const pemText = keyPair.toPrivatePem().toString('utf8');
    //  Private key is longer than 256 chars so need to encrypt with a passphrase
    const pass = this.generateRandomPassPhrase();
    const cryptor = new Cryptr(pass);
    const encryptedPrivateKeyTxT = cryptor.encrypt(pemText);
    const encryptedPass = platformKey.encrypt(pass);
    const enc64 = this.bufferToBase64(encryptedPass);
    const ret = {
        encryptedPrivateKeyTxT,
        encryptedPassPhrase: enc64
    };
    return ret;
};

exports.saveKeyEncrypted = function saveKeyEncrypted(u, fsPath) {
    // Save the given private key encrypted with the platforms public key
    const password = this.generateRandomPassPhrase();
    logger.info(`Random Passphrase: [ ${password} ]`);
    const fileName = this.generateRandomFileName();

    const pemText = u.toPrivatePem().toString('utf8');
    fs.writeFileSync(fileName, pemText);

    logger.info(
        `Encrypting: ${fileName},
     to: ${fsPath},
     with password: ${password},
    Options: ${options}
  `);

    encryptor.encryptFile(fileName, fsPath, password, options, (err) => {
        logger.info(`Encryption Failed: ${err}`);
        //      assert.fail();
    });

    //  encryptor.encryptFile(fileName, fsPath, password, options, function( err ) {
    //    throw err;
    //    fs.unlink(fileName, function( err ) {
    //    });
    return password;
};

exports.loadPrivateKey = function loadPrivateKey(
    textEncryptedPrivateKey,
    textEncryptedPassPhrase
) {
    const keyPair = this.platformKey();
    const binaryArray = this.base64ToBuffer(textEncryptedPassPhrase);
    const decryptedPass = keyPair.decrypt(binaryArray).toString('utf8');
    const dpText = decryptedPass.toString('utf8');
    const decryptor = new Cryptr(dpText);
    const decryptedPrivateKey = decryptor.decrypt(textEncryptedPrivateKey);
    return ursa.createPrivateKey(decryptedPrivateKey);
};

exports.loadPublicKey = function loadPublicKey(fsPath) {
    const pemText = fs.readFileSync(fsPath, 'utf8');
    logger.info(`PEM Text:[ ${fsPath} ] - [ ${pemText} ]`);
    return ursa.createPublicKey(pemText);
};

exports.restorePrivateKey = function restorePrivateKey(u, fsPath, password) {
    //  Load the encrypted private key for an Account
    //  TODO:   once basic encryption works will need this to decrypt password
    // var platformKeyPair = this.loadPlatformKey();
    const fileName = this.generateRandomFileName();
    logger.debug(`
    Decrypting : ${fsPath},
    to:  ${fileName},
    with password: ${password},
    Options: ${options}`);
    encryptor.decryptFile(fsPath, fileName, password, options, (err) => {
        logger.error(`Decryption Failed: ${err}`);
        throw err;
    });
    //  encryptor.decryptFile(fsPath, fileName, password, options, function( err ) {
    //    throw err;
    //  });
    const pemText = fs.readFileSync(fileName);
    logger.info(`AAA: ${pemText}`);
    return u.createPrivateKey(pemText);
};

exports.encryptPassPhrase = function encryptPassPhrase(passPhrase) {
    return this.bufferToBase64(this.platformKey().encrypt(passPhrase));
};

exports.getEncryptedPrivateKey = function getEncritedPrivateKey(encryptedKeyText) {
    const ppk = this.loadPlatformKey();
    return this.getPrivateKey(ppk.decrypt(encryptedKeyText));
};

exports.getPrivateKey = function getPrivateKey(privateKeyText) {
    return ursa.createPrivateKey(privateKeyText);
};

exports.generateRandomPassPhrase = function generateRandomPassPhrase() {
    return nw.generatePassphrase(16).join('');
};

exports.generateRandomFileName = function generateRandomFileName() {
    return uuid();
};


exports.generateRandomEthereumKey = function generateRandomEthereumKey() {
    return `0x${crypto.randomBytes(32).toString('hex')}`;
};

exports.bufferToBase64 = function bufferToBase64(buf) {
    const binstr = Array.prototype.map.call(buf, ch => String.fromCharCode(ch)).join('');
    return btoa(binstr);
};

exports.base64ToBuffer = function base64ToBuffer(base64) {
    const binstr = atob(base64);
    const buf = new Uint8Array(binstr.length);
    Array.prototype.forEach.call(binstr, (ch, i) => {
        buf[i] = ch.charCodeAt(0);
    });
    return buf;
};

exports.generateAddressAndPrivateKeyPair = function () {
    let chainAccount = {};
    //  Create the users public and private keys
    const keyPair = this.generatePrivateRSAKey();

    //  These are RSA keys used for file encryption
    chainAccount.rsaPublicKey = this.publicKey(keyPair);
    const results = this.encryptedPrivateKey(keyPair);
    chainAccount.rsaPrivateKey = results.encryptedPrivateKey;
    chainAccount.rsaPassPhrase = results.encryptedPassPhrase;

    const privateKeyText = this.generateRandomEthereumKey();
    const account = ethereumHelper.getAccount(privateKeyText);

    chainAccount.walletAddress = account.address;
    chainAccount.walletPrivateKey = privateKeyText;
    return chainAccount;
};