const appRoot = require('app-root-path');
const proxyquire = require('proxyquire');
const sinon = require('sinon');
const chai = require('chai');
const constants = require(`${appRoot}/api/constants/ScopeConstants`);

const sandbox = sinon.createSandbox();
const { assert } = sandbox;
const { expect } = chai;

describe('AzureKeyVaultHelper', () => {
    let azureKeyVault;
    let azureKeyVaultHelper;
    let adalNode;
    let credentials;
    let challenge;
    let callback;
    let context;
    let tokenResponse;
    let client;
    let momentObj;

    beforeEach(() => {
        credentials = {};
        momentObj = {};
        tokenResponse = {
            tokenType: 'bearer',
            accessToken: 'jdbsdadddij9ndwhenj08ehndcsdkhcnjducbwewwcbfuisdwibwinnwidw'
        };
        context = {
            acquireTokenWithClientCredentials: sandbox.stub().yields(null, tokenResponse)
        };
        challenge = {
            authorization: 'ndnsnifnuoj0enoneneojdddijcidcehnciei20',
            resource: 'bcwhbwebwd9uwhwubeueciwjwjcbcbcdddssdwcwwacss'
        };

        client = {};
        callback = sandbox.spy();
        adalNode = {
            AuthenticationContext: sandbox.stub().returns(context)
        };
        azureKeyVault = {
            KeyVaultCredentials: sandbox.stub().yields(challenge, callback).returns(credentials),
            KeyVaultClient: sandbox.stub().returns(client)
        };

        const imports = {
            moment: sandbox.stub().returns(momentObj),
            'adal-node': adalNode,
            'azure-keyvault': azureKeyVault
        };
        azureKeyVaultHelper = proxyquire(`${appRoot}/api/middlewares/authentication/azureKeyVault`, imports);
    });

    afterEach(() => {
        sandbox.restore();
    });

    it('initializes keyVaultCredentials and keyVaultClient on load', () => {
        assert.called(azureKeyVault.KeyVaultCredentials);

        assert.calledWith(callback, null, `${tokenResponse.tokenType} ${tokenResponse.accessToken}`);
        assert.calledWith(adalNode.AuthenticationContext, challenge.authorization);
        assert.calledWith(
            context.acquireTokenWithClientCredentials,
            challenge.resource,
            process.env.CLIENT_ID,
            process.env.CLIENT_SECRET
        );

        assert.calledWith(azureKeyVault.KeyVaultClient, credentials);
    });

    it('createkey throws error when client.createKey encounters an error', () => {
        let keyname = 'admin-id';
        let cb = sandbox.spy();

        const momentVal = 'few seconds ago';
        const momentVal1 = '2020-03-11T17:38:08.320';

        momentObj.toNow = sandbox.stub().returns(momentVal);
        momentObj.add = sandbox.stub().returns(momentVal1);

        const attributes = {
            enabled: true,
            notBefore: momentVal,
            expires: momentVal1
        };
        const keyOptions = {
            keySize: 2048,
            keyOps: ['encrypt', 'decrypt', 'sign', 'verify', 'wrapKey', 'unwrapKey'],
            tags: null,
            keyAttributes: JSON.stringify(attributes)
        };

        const keyOptionsStr = JSON.stringify(keyOptions);

        const errMsg = 'Unknown connection error';
        client.createKey = sandbox.stub().yields(new Error(errMsg), null);

        azureKeyVault.KeyVaultClient = sandbox.stub();
        try {
            azureKeyVaultHelper.createkey(keyname, cb);
        } catch (err) {
            expect(err.message).to.equal(errMsg);
            assert.threw(client.createKey);
            assert.calledWith(client.createKey, process.env.VAULT_URI, keyname, 'RSA', keyOptionsStr);
            assert.notCalled(cb);
        }
    });

    it('createkey generates RSA key', () => {
        let keyname = 'admin-id';
        let cb = sandbox.spy();

        const result = {
            id: 'hdsbdjsdubdoeujebwoihnew'
        };

        const momentVal = 'few seconds ago';
        const momentVal1 = '2020-03-11T17:38:08.320';

        momentObj.toNow = sandbox.stub().returns(momentVal);
        momentObj.add = sandbox.stub().returns(momentVal1);

        const attributes = {
            enabled: true,
            notBefore: momentVal,
            expires: momentVal1
        };
        const keyOptions = {
            keySize: 2048,
            keyOps: ['encrypt', 'decrypt', 'sign', 'verify', 'wrapKey', 'unwrapKey'],
            tags: null,
            keyAttributes: JSON.stringify(attributes)
        };

        const keyOptionsStr = JSON.stringify(keyOptions);

        client.createKey = sandbox.stub().yields(null, result);

        azureKeyVault.KeyVaultClient = sandbox.stub();

        azureKeyVaultHelper.createkey(keyname, cb);
        assert.calledWith(client.createKey, process.env.VAULT_URI, keyname, 'RSA', keyOptionsStr);

        assert.calledWith(cb, result);
    });

    it('deleteKey throws error when client.deleteKey encounters an error', () => {
        let secretName = 'admin-id';
        let cb = sandbox.spy();

        const errMsg = 'Unknown connection error';
        client.deleteKey = sandbox.stub().yields(new Error(errMsg), null);

        azureKeyVault.KeyVaultClient = sandbox.stub();
        try {
            azureKeyVaultHelper.deletekey(secretName, cb);
        } catch (err) {
            expect(err.message).to.equal(errMsg);
            assert.threw(client.deleteKey);
            assert.calledWith(client.deleteKey, process.env.VAULT_URI, secretName);
            assert.notCalled(cb);
        }
    });

    it('deleteKey can remove existing keys', () => {
        let keyname = 'admin-id';
        let cb = sandbox.spy();

        const result = {
            id: 'hdsbdjsdubdoeujebwoihnew'
        };

        client.deleteKey = sandbox.stub().yields(null, result);

        azureKeyVault.KeyVaultClient = sandbox.stub();

        azureKeyVaultHelper.deletekey(keyname, cb);
        assert.calledWith(client.deleteKey, process.env.VAULT_URI, keyname);

        assert.calledWith(cb, result);
    });

    it('getallkeys throws if error occurs', () => {
        const errMsg = 'unknown key error';
        client.getKeys = sandbox.stub().yields(new Error(errMsg), null);

        const maxresults = 45;
        const cb = sandbox.spy();
        const result = {
            id: 'hdsbdjsdubdoeujebwoihnew',
            value: {
                length: 45
            }
        };

        try {
            azureKeyVaultHelper.getallkeys(maxresults, cb);
        } catch (err) {
            expect(err.message).to.equal(errMsg);
            assert.threw(client.getKeys);
            assert.calledWith(client.getKeys, process.env.VAULT_URI, maxresults);
            assert.notCalled(cb);
        }
    });

    it('can get all keys', () => {
        const result = {
            id: 'hdsbdjsdubdoeujebwoihnew',
            value: {
                length: 45
            }
        };

        client.getKeys = sandbox.stub().yields(null, result);

        const maxresults = 45;
        const cb = sandbox.spy();

        azureKeyVaultHelper.getallkeys(maxresults, cb);

        assert.calledWith(client.getKeys, process.env.VAULT_URI, maxresults);
        assert.calledWith(cb, result);
    });

    it('encrypt throws if unknown encryption error occurs', () => {
        const errMsg = 'unknown key error';
        client.encrypt = sandbox.stub().yields(new Error(errMsg), null);

        const kid = '454353433353svs3f3f3f3f3f3';
        const textToEncrypt = 'Avengers. endgame';
        const cb = sandbox.spy();

        try {
            azureKeyVaultHelper.encrypt(kid, textToEncrypt, cb);
        } catch (err) {
            expect(err.message).to.equal(errMsg);
            assert.threw(client.encrypt);
            // eslint-disable-next-line node/no-deprecated-api
            assert.calledWith(client.encrypt, kid, 'RSA-OAEP', new Buffer(textToEncrypt));
            assert.notCalled(cb);
        }
    });

    it('can encrypt plain text', () => {
        const kid = '454353433353svs3f3f3f3f3f3';
        const textToEncrypt = 'Avengers. endgame';
        const cb = sandbox.spy();

        const cypherTxt = 'fhsisdisncjsdcwid2ihnoenwi9i';
        const result = {
            id: 'hdsbdjsdubdoeujebwoihnew',
            result: {
                toString: sandbox.stub().returns(cypherTxt)
            }
        };

        client.encrypt = sandbox.stub().yields(null, result);

        azureKeyVaultHelper.encrypt(kid, textToEncrypt, cb);
        // eslint-disable-next-line node/no-deprecated-api
        assert.calledWith(client.encrypt, kid, 'RSA-OAEP', new Buffer(textToEncrypt));
        assert.calledWith(result.result.toString, 'base64');

        assert.calledWith(cb, cypherTxt);
    });

    it('decrypt throws if a decryption error occurs', () => {
        const errMsg = 'unknown decryption error';
        client.decrypt = sandbox.stub().yields(new Error(errMsg), null);

        const kid = '454353433353svs3f3f3f3f3f3';
        const cipherText = 'Avengers. endgame';
        const cb = sandbox.spy();

        try {
            azureKeyVaultHelper.decrypt(kid, cipherText, cb);
        } catch (err) {
            expect(err.message).to.equal(errMsg);
            assert.threw(client.decrypt);
            assert.calledWith(client.decrypt, kid, 'RSA-OAEP', Buffer.from(cipherText, 'base64'));
            assert.notCalled(cb);
        }
    });

    it('can decrypt an encrypted string', () => {
        const result = {
            result: 'jsksjnciweocwehcjweciehnwkjciwo'
        };
        client.decrypt = sandbox.stub().yields(null, result);

        const kid = '454353433353svs3f3f3f3f3f3';
        const cipherText = 'Avengers. endgame';
        const cb = sandbox.spy();

        azureKeyVaultHelper.decrypt(kid, cipherText, cb);
        assert.calledWith(client.decrypt, kid, 'RSA-OAEP', Buffer.from(cipherText, 'base64'));
        assert.calledWith(cb, result);
    });

    it('createSecret throws when error occurs', () => {
        const errMsg = 'azurekeyvault connection error';

        const secretName = 'secret-to-peace';
        const secretValue = 'the-avengers';
        client.setSecret = sandbox.stub().yields(new Error(errMsg), null);

        const cb = sandbox.spy();

        const attributes = {
            expires: constants.AzureKeyVault_Expiration_Date
        };

        const secretOptions = {
            contentType: 'application/text',
            secretAttributes: attributes
        };

        try {
            azureKeyVaultHelper.createSecret(secretName, secretValue, cb);
        } catch (err) {
            expect(err.message).to.equal(errMsg);
            assert.threw(client.setSecret);
            assert.calledWith(client.setSecret, process.env.VAULT_URI, secretName, secretValue, secretOptions);
            assert.notCalled(cb);
        }
    });

    it('can create secret successfully', () => {
        const secretName = 'secret-to-peace';
        const secretValue = 'the-avengers';

        const result = {
            result: {
                secretName,
                value: secretValue
            }
        };
        client.setSecret = sandbox.stub().yields(null, result);

        const cb = sandbox.spy();

        const attributes = {
            expires: constants.AzureKeyVault_Expiration_Date
        };

        const secretOptions = {
            contentType: 'application/text',
            secretAttributes: attributes
        };

        azureKeyVaultHelper.createSecret(secretName, secretValue, cb);

        assert.calledWith(client.setSecret, process.env.VAULT_URI, secretName, secretValue, secretOptions);
        assert.calledWith(cb, result);
    });

    it('deleteSecret throws if error occurs', () => {
        const errMsg = 'delete secret failed';

        const secretName = 'secret-to-peace';
        client.deleteSecret = sandbox.stub().yields(new Error(errMsg), null);

        const cb = sandbox.spy();

        try {
            azureKeyVaultHelper.deleteSecret(secretName, cb);
        } catch (err) {
            expect(err.message).to.equal(errMsg);
            assert.threw(client.deleteSecret);
            assert.calledWith(client.deleteSecret, process.env.VAULT_URI, secretName);
            assert.notCalled(cb);
        }
    });

    it('can delete secret successfully', () => {
        const result = {
            id: 'ddcocwociwewiewocwmijmw0'
        };

        const secretName = 'secret-to-peace';
        client.deleteSecret = sandbox.stub().yields(null, result);

        const cb = sandbox.spy();

        azureKeyVaultHelper.deleteSecret(secretName, cb);
        assert.calledWith(client.deleteSecret, process.env.VAULT_URI, secretName);
        assert.calledWith(cb, result);
    });

    it('getSecret rejects promise, if an error occurs getting secret', async () => {
        const errMsg = 'failed to get secret';
        const secretName = 'secret-to-peace';
        const secretVersion = 4;

        client.getSecret = sandbox.stub().yields(new Error(errMsg), null);

        try {
            await azureKeyVaultHelper.getSecret(secretName, secretVersion);
        } catch (err) {
            expect(err.message).to.equal(errMsg);
            assert.calledWith(client.getSecret, process.env.VAULT_URI, secretName, '');
        }
    });

    it('can get secret successfuly', async () => {
        const result = {
            result: {
                value: 'the-avengers'
            }
        };
        const secretName = 'secret-to-peace';
        const secretVersion = 4;

        client.getSecret = sandbox.stub().yields(null, result);

        const secretResult = await azureKeyVaultHelper.getSecret(secretName, secretVersion);

        assert.calledWith(client.getSecret, process.env.VAULT_URI, secretName, '');
        expect(secretResult).to.equal(JSON.stringify(result));
    });
});

describe('AzureKeyVaultHelper', () => {
    let azureKeyVault;
    let adalNode;
    let credentials;
    let challenge;
    let callback;
    let context;
    const errMsg = 'acquireTokenWithClientCredentials failed';

    beforeEach(() => {
        credentials = {};
        context = {
            acquireTokenWithClientCredentials: sandbox.stub().yields(new Error(errMsg), null)
        };
        challenge = {
            authorization: 'ndnsnifnuoj0enoneneojdddijcidcehnciei20',
            resource: 'bcwhbwebwd9uwhwubeueciwjwjcbcbcdddssdwcwwacss'
        };
        callback = sandbox.spy();
        adalNode = {
            AuthenticationContext: sandbox.stub().returns(context)
        };
        azureKeyVault = {
            KeyVaultCredentials: sandbox.stub().yields(challenge, callback).returns(credentials)
        };
    });

    afterEach(() => {
        sandbox.restore();
    });

    it('throws error if acquireTokenWithClientCredentials encounters an error', () => {
        const imports = {
            'adal-node': adalNode,
            'azure-keyvault': azureKeyVault
        };

        try {
            proxyquire(`${appRoot}/api/middlewares/authentication/azureKeyVault`, imports);
        } catch (err) {
            assert.called(azureKeyVault.KeyVaultCredentials);

            assert.notCalled(callback);
            assert.calledWith(adalNode.AuthenticationContext, challenge.authorization);
            assert.calledWith(
                context.acquireTokenWithClientCredentials,
                challenge.resource,
                process.env.CLIENT_ID,
                process.env.CLIENT_SECRET
            );

            assert.threw(context.acquireTokenWithClientCredentials);
        }
    });
});
