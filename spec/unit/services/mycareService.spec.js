const appRoot = require('app-root-path');
const web3 = require('web3');
const chai = require('chai');
const proxyquire = require('proxyquire').noCallThru();
const sinon = require('sinon');
const sandbox = sinon.createSandbox();
const { GAS_LIMIT } = require(`${appRoot}/api/constants/transactionConstants`);
const dotenv = require('dotenv');
dotenv.config();

describe('MycareService', () => {
    let mycareService;
    let contractHelper;
    let contractMethods;
    let encodeABI;
    let call;
    let helperMethods;
    let ContractHelperConstructor;
    let sendTransactionStub;

    const timestamp = 1544533771536;

    const data = '0x300000000000000ddeeecc300099aa9cccc9ff9eedacf83035ad93e939f99c929a939e939a99b9';

    beforeEach(() => {
        const imports = {};
        helperMethods = {
            ISOstringToTimestamp: sandbox.stub().returns(timestamp),
            timeStampToISOstring: sandbox.stub()
        };
        contractMethods = {};

        sendTransactionStub = sandbox.stub();

        encodeABI = sandbox.stub().returns(data);
        call = sandbox.stub();

        ContractHelperConstructor = function (contractName) {
            Object.assign(ContractHelperConstructor, {
                instance: sandbox.stub(),
                // contractMethods: () => contractMethods,
                sendTransaction: sandbox.stub()
            });

            this.contractMethods = () => contractMethods;
            this.sendTransaction = sendTransactionStub;

            ContractHelperConstructor.instance(contractName);
        };

        contractHelper = {
            contractNames: {
                MYCARE: 'MyCare',
                SHARED_ACCESS: 'SharedAccess',
                POLICIES_AND_TERMS: 'PoliciesAndTerms'
            },
            ContractHelper: ContractHelperConstructor
        };

        imports[`${appRoot}/api/helpers/contractHelper`] = contractHelper;
        imports[`${appRoot}/api/helpers/helperMethods`] = helperMethods;

        mycareService = proxyquire(`${appRoot}/api/services/mycareService`, imports);
    });

    afterEach(() => {
        sandbox.restore();
    });

    it('can add account', async () => {
        contractMethods.AddAccount = sandbox.stub().returns({
            encodeABI
        });

        const payload = {
            timestamp: '2018-11-28T13:01:04.956Z',
            profileHash: '5CEF18be6e742c63AA2Dab7F52C1B699040875808',
            walletAddress: '0xd9Ef690a2836b5e50098A391Ebd490A96a416EEc',
            accountType: 'Patient'
        };

        const accountTypeHex = web3.utils.asciiToHex(payload.accountType);

        const metaData = {
            parameters: {
                walletAddress: payload.walletAddress,
                profileHash: payload.profileHash,
                timestamp,
                accountType: payload.accountType
            },
            methodName: `${contractHelper.contractNames.MYCARE}.AddAccount`
        };

        await mycareService.AddAccount(payload);

        sandbox.assert.calledWith(sendTransactionStub, data, GAS_LIMIT.MYCARE.ADD_ACCOUNT, metaData);

        sandbox.assert.calledWith(
            contractMethods.AddAccount,
            payload.walletAddress,
            payload.profileHash,
            timestamp,
            accountTypeHex
        );

        sandbox.assert.calledWith(helperMethods.ISOstringToTimestamp, payload.timestamp);

        sandbox.assert.called(encodeABI);
    });

    it('can deactivate account', async () => {
        const ownerAddress = '0xd9Ef690a2836b5e50098A391Ebd490A96a416EEc';
        const _timestamp = '2018-11-28T13:01:04.956Z';

        contractMethods.DeactivateAccount = sandbox.stub().returns({
            encodeABI
        });

        const metaData = {
            parameters: {
                ownerAddress,
                timestamp
            },
            methodName: `${contractHelper.contractNames.MYCARE}.DeactivateAccount`
        };

        await mycareService.DeactivateAccount(ownerAddress, _timestamp);

        sandbox.assert.calledWith(sendTransactionStub, data, GAS_LIMIT.MYCARE.DEACTIVATE_ACCOUNT, metaData);

        sandbox.assert.calledWith(contractMethods.DeactivateAccount, ownerAddress, timestamp);

        sandbox.assert.calledWith(helperMethods.ISOstringToTimestamp, _timestamp);
    });

    it('can get account by wallet address', async () => {
        const accountType = 'Patient';
        const accountTypeHex = web3.utils.asciiToHex(accountType);

        const account = {
            isEntity: true,
            created: 1546974004821,
            updated: 1346974004824,
            accountType: accountTypeHex
        };

        const dateString = '2018-11-28T13:01:04.956Z';

        const returnedData = {
            isEntity: true,
            created: dateString,
            updated: dateString,
            accountType
        };

        helperMethods.timeStampToISOstring = sandbox.stub().returns(dateString);

        const call = sandbox.stub().resolves(account);
        contractMethods.GetAccount = sandbox.stub().returns({
            call
        });

        contractMethods.GetAccountByProfile = sandbox.spy();

        const param = '0xd9Ef690a2836b5e50098A391Ebd490A96a416EEc';
        const result = await mycareService.GetAccount(param, true);

        chai.expect(result.isEntity).to.be.equal(returnedData.isEntity);
        chai.expect(result.created).to.be.equal(returnedData.created);
        chai.expect(result.updated).to.be.equal(returnedData.updated);
        sandbox.assert.match(result.accountType, accountType);

        sandbox.assert.notCalled(contractMethods.GetAccountByProfile);
        sandbox.assert.calledWith(contractMethods.GetAccount, param);
    });

    it('can get account by profile hash', async () => {
        const accountType = 'Patient';
        const accountTypeHex = web3.utils.asciiToHex(accountType);
        
        const account = {
            isEntity: true,
            created: 1546974004821,
            updated: 1346974004824,
            accountType: accountTypeHex
        };

        const dateString = '2018-11-28T13:01:04.956Z';

        const returnedData = {
            isEntity: true,
            created: dateString,
            updated: dateString,
            accountType
        };

        helperMethods.timeStampToISOstring = sandbox.stub().returns(dateString);

        const call = sandbox.stub().resolves(account);
        contractMethods.GetAccount = sandbox.spy();

        contractMethods.GetAccountByProfile = sandbox.stub().returns({
            call
        });

        const param = 'ff2cc9ee9Ef690a2836b5e50098A391Ebd490A96a416EEc';
        const result = await mycareService.GetAccount(param, false);

        chai.expect(result.isEntity).to.be.equal(returnedData.isEntity);
        chai.expect(result.created).to.be.equal(returnedData.created);
        chai.expect(result.updated).to.be.equal(returnedData.updated);
        sandbox.assert.match(result.accountType, accountType);

        sandbox.assert.notCalled(contractMethods.GetAccount);
        sandbox.assert.calledWith(contractMethods.GetAccountByProfile, param);
    });

    it('returns result of null if isEntty is false', async () => {
        const account = {
            isEntity: false,
            created: 1546974004821,
            updated: 1346974004824
        };

        const dateString = '2018-11-28T13:01:04.956Z';

        helperMethods.timeStampToISOstring = sandbox.stub().returns(dateString);

        const call = sandbox.stub().resolves(account);
        contractMethods.GetAccount = sandbox.spy();

        contractMethods.GetAccountByProfile = sandbox.stub().returns({
            call
        });

        const param = 'ff2cc9ee9Ef690a2836b5e50098A391Ebd490A96a416EEc';
        const result = await mycareService.GetAccount(param, false);

        chai.expect(result).to.be.equal(null);

        sandbox.assert.notCalled(contractMethods.GetAccount);
        
        sandbox.assert.calledWith(contractMethods.GetAccountByProfile, param);
    });

    it('can add account type', async () => {
        const accountType = 'Patient';
        const accountTypeHex = web3.utils.asciiToHex(accountType);

        contractMethods.AddAccountType = sandbox.stub().returns({
            encodeABI
        });

        const metaData = {
            parameters: {
                accountType
            },
            methodName: `${contractHelper.contractNames.MYCARE}.AddAccountType`
        };

        await mycareService.AddAccountType(accountType);

        sandbox.assert.calledWith(sendTransactionStub, data, GAS_LIMIT.MYCARE.ADD_ACCOUNT_TYPE, metaData);

        sandbox.assert.calledWith(
            contractMethods.AddAccountType,
            accountTypeHex
        );

        sandbox.assert.called(encodeABI);
    });

    it('can check if account type exists', async () => {
        const accountType = 'Patient';
        const accountTypeHex = web3.utils.asciiToHex(accountType);

        call.resolves(true);

        contractMethods.AccountTypeExists = sandbox.stub().returns({
            call
        });

        const result = await mycareService.AccountTypeExists(accountType);

        sandbox.assert.calledWith(contractMethods.AccountTypeExists, accountTypeHex);
        sandbox.assert.match(result, true);
    });

    it('can get account count', () => {
        contractMethods.GetAccountCount = sandbox.stub().returns({
            call
        });

        mycareService.GetAccountCount();

        sandbox.assert.called(contractMethods.GetAccountCount);
    });
});