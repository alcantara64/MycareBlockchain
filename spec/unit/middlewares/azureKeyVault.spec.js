const appRoot = require('app-root-path');
const proxyquire = require('proxyquire');
const sinon = require('sinon');
const constants = require(`${appRoot}/api/constants/Common`);

const sandbox = sinon.createSandbox();
const { assert } = sandbox;

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

    it('createkey generates RSA key', () => {
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
        client.createKey = sandbox.spy();

        azureKeyVault.KeyVaultClient = sandbox.stub();
        azureKeyVaultHelper.createkey(keyname, cb);
        assert.calledWith(client.createKey, process.env.VAULT_URI, keyname, 'RSA', keyOptionsStr);
    });

    it('deleteKey can remove existing keys', () => {
        let keyname = 'admin-id';

        client.deleteKey = sandbox.spy();

        azureKeyVaultHelper.deletekey(keyname);
        assert.calledWith(client.deleteKey, process.env.VAULT_URI, keyname);
    });

    it('can get all keys', () => {
        client.getKeys = sandbox.spy();

        const maxresults = 45;

        azureKeyVaultHelper.getallkeys(maxresults);
        assert.calledWith(client.getKeys, process.env.VAULT_URI, maxresults);
    });

    it('can encrypt plain text', async () => {
        const kid = '454353433353svs3f3f3f3f3f3';
        const textToEncrypt = 'Avengers. endgame';

        const cypherTxt = 'fhsisdisncjsdcwid2ihnoenwi9i';
        const result = {
            id: 'hdsbdjsdubdoeujebwoihnew',
            result: {
                toString: sandbox.stub().returns(cypherTxt)
            }
        };

        client.encrypt = sandbox.stub().resolves(result);

        await azureKeyVaultHelper.encrypt(kid, textToEncrypt);
        // eslint-disable-next-line node/no-deprecated-api
        assert.calledWith(client.encrypt, kid, 'RSA-OAEP', Buffer.from(textToEncrypt));
        assert.calledWith(result.result.toString, 'base64');
    });

    it('can decrypt an encrypted string', () => {
        client.decrypt = sandbox.spy();

        const kid = '454353433353svs3f3f3f3f3f3';
        const cipherText = 'Avengers. endgame';

        azureKeyVaultHelper.decrypt(kid, cipherText);
        assert.calledWith(client.decrypt, kid, 'RSA-OAEP', Buffer.from(cipherText, 'base64'));
    });

    it('can create secret successfully', () => {
        const secretName = 'secret-to-peace';
        const secretValue = 'the-avengers';

        client.setSecret = sandbox.spy();

        const attributes = {
            expires: constants.AzureKeyVault_Expiration_Date
        };

        const secretOptions = {
            contentType: 'application/text',
            secretAttributes: attributes
        };

        azureKeyVaultHelper.createSecret(secretName, secretValue);

        assert.calledWith(client.setSecret, process.env.VAULT_URI, secretName, secretValue, secretOptions);
    });

    it('can delete secret successfully', () => {
        const secretName = 'secret-to-peace';
        client.deleteSecret = sandbox.spy();

        const cb = sandbox.spy();

        azureKeyVaultHelper.deleteSecret(secretName, cb);
        assert.calledWith(client.deleteSecret, process.env.VAULT_URI, secretName);
    });

    it('can get secret successfuly', async () => {
        const secretName = 'secret-to-peace';

        client.getSecret = sandbox.spy();

        azureKeyVaultHelper.getSecret(secretName);

        assert.calledWith(client.getSecret, process.env.VAULT_URI, secretName, '');
    });
});
