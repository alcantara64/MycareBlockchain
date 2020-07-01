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
    let crypto;
    let cryptr;
    let encryptor;
    let ethereumHelper;

    const options = {
        algorithm: 'aes256'
    };

    beforeEach(() => {
        ursa = {};
        fs = {};
        uuid = sandbox.stub();
        niceware = {};
        crypto = {};
        cryptr = sandbox.stub();
        encryptor = {};
        ethereumHelper = {};

        const imports = {
            'ursa-optional': ursa,
            'fs': fs,
            'uuid': uuid,
            'niceware': niceware,
            'crypto': crypto,
            'cryptr': cryptr,
            'file-encryptor': encryptor
        };

        imports[`${appRoot}/api/helpers/ethereumHelper`] = ethereumHelper;

        keyHelper = proxyquire(`${appRoot}/api/helpers/keyHelper`, imports);
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
        };

        let path = 'path/to/file';
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

    it('platformKey calls loadPlatformKey if platformPrivateKey is not set', () => {
        const key = '0xe92d9c939f39f939e929a929c2939b393b39';
        keyHelper.loadPlatformKey = sandbox.stub().returns(key);

        const platformkey = keyHelper.platformKey();

        sandbox.assert.called(keyHelper.loadPlatformKey);
        sandbox.assert.match(platformkey, key);
    });

    it('platformKey does not call loadPlatformKey when its already set', () => {
        let pemText = 'pem_text';
        const privateKey = '0xe92d9c939f39f939e929a929c2939b393b39';
        const privateKey2 = '0x0099ddffe839ea8bc802973937b83f8c83ce';

        fs.readFileSync = sandbox.stub().returns(pemText);
        ursa.createPrivateKey = sandbox.stub().returns(privateKey);

        // this will set the value of platformPrivateKey
        const key1 = keyHelper.loadPlatformKey();

        sandbox.assert.match(key1, privateKey);

        sandbox.assert.calledWith(fs.readFileSync, './private/MyCarePrivKey.pem');

        sandbox.assert.calledWith(ursa.createPrivateKey, pemText);

        keyHelper.loadPlatformKey = sandbox.stub().returns(privateKey2);

        const key2 = keyHelper.platformKey();

        sandbox.assert.notCalled(keyHelper.loadPlatformKey);
        sandbox.assert.match(privateKey, key2);
    });

    it('can load platform public key', () => {
        const key = '0xe92d9c939f39f939e929a929c2939b393b39';
        keyHelper.loadPublicKey = sandbox.stub().returns(key);

        const pubKey = keyHelper.loadPlatformPublicKey();

        sandbox.assert.match(key, pubKey);
        sandbox.assert.calledWith(keyHelper.loadPublicKey, './private/MyCarePubKey.pem');
    });

    it('can save public key', async () => {
        fs.writeFile = sandbox.stub().yields(null);

        const text = '0xdee34daa8ccf3837ff8cc3bb74e73be7';
        const toString = sandbox.stub().returns(text);

        let u = {
            toPublicPem: sandbox.stub().returns({
                toString
            })
        };

        let fsPath = 'path/to/file';
        await keyHelper.savePublicKey(u, fsPath);

        sandbox.assert.calledWith(fs.writeFile, fsPath, text);
        sandbox.assert.called(u.toPublicPem);
        sandbox.assert.called(toString);
    });

    it('can create encrypted Private Key', () => {
        const pemText = 'jdofjddjnjdkweufeiholuaif8ebydgcuhbcdcbydgcbyef8wuydwbc8yuc';
        const toString = sandbox.stub().returns(pemText);

        const pass = 'fndsdjsibiejwe32nwded3';

        const cypherText = 'fb8ace8cb8ae8a8d8a8c838efa8ac8abed8';
        const cryptor = {
            encrypt: sandbox.stub().returns(cypherText)
        };

        cryptr.returns(cryptor);

        keyHelper.generateRandomPassPhrase = sandbox.stub().returns(pass);

        const keypair = {
            toPrivatePem: sandbox.stub().returns({ toString })
        };

        const encryptedPass = 'dee34daa8ccf3837ff8cc3bb74e73be7';
        const platformKey = {
            encrypt: sandbox.stub().returns(encryptedPass)
        };

        const enc64 = 'ZGVlMzRkYWE4Y2NmMzgzN2ZmOGNjM2JiNzRlNzNiZTc=';

        keyHelper.bufferToBase64 = sandbox.stub().returns(enc64);

        keyHelper.platformKey = sandbox.stub().returns(platformKey);

        // function call
        const result = keyHelper.encryptedPrivateKey(keypair);

        sandbox.assert.match(result, {
            encryptedPrivateKeyTxT: cypherText,
            encryptedPassPhrase: enc64
        });

        sandbox.assert.called(keyHelper.platformKey);
        sandbox.assert.calledWith(toString, 'utf8');
        sandbox.assert.called(keyHelper.generateRandomPassPhrase);
        sandbox.assert.calledWith(cryptr, pass);
        sandbox.assert.calledWith(cryptor.encrypt, pemText);
        sandbox.assert.calledWith(platformKey.encrypt, pass);
    });

    it('saveKeyEncrypted returns passphrase that was used for file encryption if successful', () => {
        const pemText = 'jdofjddjnjdkweufeiholuaif8ebydgcuhbcdcbydgcbyef8wuydwbc8yuc';
        const toString = sandbox.stub().returns(pemText);
        let u = {
            toPrivatePem: sandbox.stub().returns({
                toString
            })
        };

        let fsPath = 'path/to/file';

        const password = 'fndsdjsibiejwe32nwded3';
        keyHelper.generateRandomPassPhrase = sandbox.stub().returns(password);

        const fileName = 'bjcdshd9iebjc934cd';
        keyHelper.generateRandomFileName = sandbox.stub().returns(fileName);

        fs.writeFileSync = sandbox.spy();

        encryptor.encryptFile = sandbox.stub().yields(null);
        fs.unlinkSync = sandbox.spy();

        const result = keyHelper.saveKeyEncrypted(u, fsPath);

        sandbox.assert.match(result, password);

        sandbox.assert.called(keyHelper.generateRandomPassPhrase);
        sandbox.assert.calledWith(toString, 'utf8');
        sandbox.assert.called(keyHelper.generateRandomFileName);
        sandbox.assert.calledWith(fs.writeFileSync, fileName, pemText);
        sandbox.assert.calledWith(encryptor.encryptFile, fileName, fsPath, password, options);
        sandbox.assert.notCalled(fs.unlinkSync);
    });

    it('saveKeyEncrypted returns empty string if encryption fails', () => {
        const pemText = 'jdofjddjnjdkweufeiholuaif8ebydgcuhbcdcbydgcbyef8wuydwbc8yuc';
        const toString = sandbox.stub().returns(pemText);
        let u = {
            toPrivatePem: sandbox.stub().returns({
                toString
            })
        };

        let fsPath = 'path/to/file';

        const password = 'fndsdjsibiejwe32nwded3';
        keyHelper.generateRandomPassPhrase = sandbox.stub().returns(password);

        const fileName = 'bjcdshd9iebjc934cd';
        keyHelper.generateRandomFileName = sandbox.stub().returns(fileName);

        fs.writeFileSync = sandbox.spy();

        const err = {
            message: 'failed to encrypt file'
        };
        encryptor.encryptFile = sandbox.stub().yields(err);

        fs.unlinkSync = sandbox.spy();

        const result = keyHelper.saveKeyEncrypted(u, fsPath);

        sandbox.assert.match(result, '');

        sandbox.assert.called(keyHelper.generateRandomPassPhrase);
        sandbox.assert.calledWith(toString, 'utf8');
        sandbox.assert.called(keyHelper.generateRandomFileName);
        sandbox.assert.calledWith(fs.writeFileSync, fileName, pemText);
        sandbox.assert.calledWith(encryptor.encryptFile, fileName, fsPath, password, options);
        sandbox.assert.called(fs.unlinkSync);
    });

    it('can load private key', () => {
        const textEncryptedPrivateKey = '0xe838s828caefaefabcefacebacf';
        const textEncryptedPassPhrase = 'dbccniocwuewdodediwenwoencjc0ieoj';

        const encryptedPass = 'ae8v373ba7ddffe3eaccacae83738fccfbbeb';
        const decryptedPass = 'uewdodediwenwoencjc0ieoj0xe838s828caef';
        const toString = sandbox.stub().returns(decryptedPass);

        const keypair = {
            encrypt: sandbox.stub().returns(encryptedPass),
            decrypt: sandbox.stub().returns({ toString })
        };
        keyHelper.platformKey = sandbox.stub().returns(keypair);

        const binaryArray = new Uint8Array(32);

        keyHelper.base64ToBuffer = sandbox.stub().returns(binaryArray);

        const decryptedPrivateKey = '0xed399ac0399e9393b39e9df93e93b38be3993e93be9e9ac';

        const decryptor = {
            decrypt: sandbox.stub().returns(decryptedPrivateKey)
        };
        cryptr.returns(decryptor);

        const privateKeyObject = {
            encrypt: () => {},
            toPrivatePem: () => {}
        };

        ursa.createPrivateKey = sandbox.stub().returns(privateKeyObject);

        keyHelper.loadPrivateKey(textEncryptedPrivateKey, textEncryptedPassPhrase);

        sandbox.assert.called(keyHelper.platformKey);
        sandbox.assert.calledWith(toString, 'utf8');
        sandbox.assert.calledWith(keyHelper.base64ToBuffer, textEncryptedPassPhrase);
        sandbox.assert.calledWith(keypair.decrypt, binaryArray);
        sandbox.assert.called(cryptr);
        sandbox.assert.calledWith(decryptor.decrypt, textEncryptedPrivateKey);
        sandbox.assert.calledWith(ursa.createPrivateKey, decryptedPrivateKey);
    });

    it('can generate ethereum wallet address and private key', () => {
        const keypair = {
            encrypt: () => {},
            decrypt: () => {}
        };
        keyHelper.generatePrivateRSAKey = sandbox.stub().returns(keypair);
        const rsaPublicKey = '0hdsbskdegbwhwibwucbihc';
        keyHelper.publicKey = sandbox.stub().returns(rsaPublicKey);

        const account = {
            address: '0xcaefeeabbffcceedafegdgdh'
        };

        ethereumHelper.getAccount = sandbox.stub().returns(account);

        const privateKeyText = 'ddsdshcjscjsdhcisbcdcbichucu';
        keyHelper.generateRandomEthereumKey = sandbox.stub().returns(privateKeyText);

        const results = {
            encryptedPrivateKey: '0xywgdbdie7bdjdebdd8jmeudndieu',
            encryptedPassPhrase: '0xhhdvdj83dnke8endk3ndebjd9ddme'
        };
        keyHelper.encryptedPrivateKey = sandbox.stub().returns(results);

        keyHelper.generateAddressAndPrivateKeyPair();

        sandbox.assert.called(keyHelper.generatePrivateRSAKey);
        sandbox.assert.calledWith(keyHelper.publicKey, keypair);
        sandbox.assert.calledWith(keyHelper.encryptedPrivateKey, keypair);
        sandbox.assert.called(keyHelper.generateRandomEthereumKey);
        sandbox.assert.calledWith(ethereumHelper.getAccount, privateKeyText);
    });

    it('can load public key', () => {
        const fsPath = '/path/to/file';
        const pemText = 'jdnjnjdbjcndwhih202hdnid92d2uiedb2uid';

        fs.readFileSync = sandbox.stub().returns(pemText);
        ursa.createPublicKey = sandbox.stub();

        keyHelper.loadPublicKey(fsPath);

        sandbox.assert.calledWith(fs.readFileSync, fsPath, 'utf8');
        sandbox.assert.calledWith(ursa.createPublicKey, pemText);
    });

    it('can restore private key', () => {
        const u = {
            encrypt: () => {},
            toPrivatePem: sandbox.spy(),
            createPrivateKey: sandbox.spy()
        };

        const fsPath = '/path/to/file';
        const password = 'jdsdbiduanj';

        const pemText = 'jdnjnjdbjcndwhih202hdnid92d2uiedb2uid';

        fs.readFileSync = sandbox.stub().returns(pemText);

        encryptor.decryptFile = sandbox.stub().yields(null);
        const fileName = 'wrandomeNAme';

        keyHelper.generateRandomFileName = sandbox.stub().returns(fileName);

        keyHelper.restorePrivateKey(u, fsPath, password);

        sandbox.assert.called(keyHelper.generateRandomFileName);
        sandbox.assert.calledWith(encryptor.decryptFile, fsPath, fileName, password, options);
        sandbox.assert.calledWith(u.createPrivateKey, pemText);
    });
});