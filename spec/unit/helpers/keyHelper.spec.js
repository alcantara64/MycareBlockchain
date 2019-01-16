const appRoot = require('app-root-path');
const chai = require('chai');
const proxyquire = require('proxyquire');
const sinon = require('sinon');
let sandbox = sinon.createSandbox();

describe('KeyHelper', () => {
    let keyHelper;
    let ursa;
    let fs;
    let uuid;
    let niceware;
    let crypto

    beforeEach(() => {
        ursa = {};
        fs = {};
        uuid = sandbox.stub();
        niceware = {};
        crypto = {};

        keyHelper = proxyquire(`${appRoot}/api/helpers/keyHelper`, {
            'ursa': ursa,
            'fs': fs,
            'uuid': uuid,
            'niceware': niceware,
            'crypto': crypto,
        });
    });

    afterEach(() => {
        sandbox.restore();
    });

    it('can generate private RSA key', () => {
        ursa.generatePrivateKey = sandbox.stub();
        keyHelper.generatePrivateRSAKey();

        sandbox.assert.calledWith(ursa.generatePrivateKey, 2048, 65537);
    });

    it('can load platform key', () => {
        let pemText = 'pem_text';

        fs.readFileSync = sandbox.stub().returns(pemText);
        ursa.createPrivateKey = sandbox.stub();

        keyHelper.loadPlatformKey();

        sandbox.assert.calledWith(fs.readFileSync, './private/MyCarePrivKey.pem');

        sandbox.assert.calledWith(ursa.createPrivateKey, pemText);
    });

    it('can save key', () => {
        fs.writeFile = sandbox.stub();

        let pemObj = { privateKey: ''};

        let u = {
            toPrivatePem: () => pemObj
        }

        let path = 'path/to/file'
        keyHelper.saveKey(u, path);

        sandbox.assert.calledWith(fs.writeFile, path, JSON.stringify(pemObj).toString('utf8'));
    });

    it('can get public key from keypair', () => {
        let keypair = {
            toPublicPem: sandbox.stub().returns('public+key+hash$')
        }

        keyHelper.publicKey(keypair);

        sandbox.assert.called(keypair.toPublicPem);
    });

    it('can get private key from keypair', () => {
        let keypair = {
            toPrivatePem: sandbox.stub().returns('private+key+hash$')
        }

        keyHelper.privateKey(keypair);

        sandbox.assert.called(keypair.toPrivatePem);
    });

    it('can get encrypted private key', () => {
        keyHelper.platformKey = sandbox.stub();

        keyHelper.generateRandomPassPhrase = sandbox.stub();

        let keypair = {
            toPrivatePem: sandbox.stub().returns('private+key+hash$')
        }
    });

    it('can generate random file name', () => {
        keyHelper.generateRandomFileName();
        sandbox.assert.called(uuid);
    });

    it('can encrypt passphrase', () => {
        keyHelper.bufferToBase64 = sandbox.stub();
        let encryption = 'encrypted_result';
        let encrypter = { encrypt: sandbox.stub().returns(encryption) };
        keyHelper.platformKey = sandbox.stub().returns(encrypter);

        let passphrase = 'MY+pass-phrase';

        keyHelper.encryptPassPhrase(passphrase);

        sandbox.assert.called(keyHelper.platformKey);

        sandbox.assert.calledWith(encrypter.encrypt, passphrase);

        sandbox.assert.calledWith(keyHelper.bufferToBase64, encryption);
    });

    it('can get encrypted private key', () => {
        let encryptedKeyText = 'bas##$573639isotxt';
        let decryption = 'decrypted_text';

        let ppk = { decrypt: sandbox.stub().returns(decryption) };
        keyHelper.loadPlatformKey = sandbox.stub().returns(ppk);
        keyHelper.getPrivateKey = sandbox.stub();

        keyHelper.getEncryptedPrivateKey(encryptedKeyText);

        sandbox.assert.calledWith(ppk.decrypt, encryptedKeyText);

        sandbox.assert.calledWith(keyHelper.getPrivateKey, decryption);
    });

    it('can get private key from private key text', () => {
        let privateKeyText = '^&&^&*&***hshdhdhk37'
        ursa.createPrivateKey = sandbox.stub();

        keyHelper.getPrivateKey(privateKeyText);

        sandbox.assert.calledWith(ursa.createPrivateKey, privateKeyText);
    });

    it('can generate random passphrase', () => {
        let returnObj = { join: sandbox.stub() };
        niceware.generatePassphrase = sandbox.stub().returns(returnObj);

        keyHelper.generateRandomPassPhrase();

        sandbox.assert.calledWith(niceware.generatePassphrase, 16);
        sandbox.assert.called(returnObj.join);
    });

    it('can generate random ethereum key', () => {
        let stringHelper = { toString: sandbox.stub() };
        crypto.randomBytes = sandbox.stub().returns(stringHelper);

        keyHelper.generateRandomEthereumKey();

        sandbox.assert.calledWith(crypto.randomBytes, 32);
        sandbox.assert.calledWith(stringHelper.toString, 'hex');
    });
});