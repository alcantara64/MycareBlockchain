const appRoot = require('app-root-path');
const proxyquire = require('proxyquire');
const sinon = require('sinon');
const chai = require('chai');

const sandbox = sinon.createSandbox();
const { assert } = sandbox;
const { expect } = chai;

describe.only('AzureKeyVaultHelper', () => {
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
        let cb;

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
        }
    });

    it('createkey throws error when client.createKey encounters an error', () => {
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
        let cb;

        const errMsg = 'Unknown connection error';
        client.deleteKey = sandbox.stub().yields(new Error(errMsg), null);

        azureKeyVault.KeyVaultClient = sandbox.stub();
        try {
            azureKeyVaultHelper.deletekey(secretName, cb);
        } catch (err) {
            expect(err.message).to.equal(errMsg);
            assert.threw(client.deleteKey);
            assert.calledWith(client.deleteKey, process.env.VAULT_URI, secretName);
        }
    });
});