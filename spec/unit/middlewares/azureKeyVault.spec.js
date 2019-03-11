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

    beforeEach(() => {
        credentials = {};
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
        callback = sandbox.spy();
        adalNode = {
            AuthenticationContext: sandbox.stub().returns(context)
        };
        azureKeyVault = {
            KeyVaultCredentials: sandbox.stub().yields(challenge, callback).returns(credentials)
        };

        const imports = {
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
    });
});