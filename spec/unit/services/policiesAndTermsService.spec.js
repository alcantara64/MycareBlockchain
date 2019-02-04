const appRoot = require('app-root-path');
const chai = require('chai');
const proxyquire = require('proxyquire').noCallThru();
const sinon = require('sinon');
const sandbox = sinon.createSandbox();
const {
    GAS_LIMIT
} = require(`${appRoot}/api/constants/transactionConstants`);
const dotenv = require('dotenv');
dotenv.config();

describe('PoliciesAndTermsService', () => {
    let policiesAndTermsService;
    let contractHelper;
    let contractMethods;
    let encodeABI;
    let call;
    let helperMethods;
    let ContractHelperConstructor;
    let sendTransactionStub;

    const timestamp = 1544533771536;
    const timestamp1 = 1546979320341;
    const timestamp2 = 1354489200000;

    const dateString = '2012-12-02T23:00:00.000Z';
    const dateString1 = '2018-11-28T13:01:04.956Z';

    const data = '0x300000000000000ddeeecc300099aa9cccc9ff9eedacf83035ad93e939f99c929a939e939a99b9';

    beforeEach(() => {
        const imports = {};
        helperMethods = {
            ISOstringToTimestamp: sandbox.stub().returns(timestamp),
            timeStampToISOstring: sandbox.stub().returns(dateString),
            createTimeStamp: sandbox.stub().returns(timestamp1)
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

        policiesAndTermsService = proxyquire(`${appRoot}/api/services/policiesAndTermsService`, imports);
    });

    afterEach(() => {
        sandbox.restore();
    });

    it('can add new document', () => {

        contractMethods.addNewDocument = sandbox.stub().returns({
            encodeABI
        });

        const payload = {
            timestamp: '2018-11-28T13:01:04.956Z',
            ipfsHash: '5CEF18be6e742c63AA2Dab7F52C1B699040875808'
        };

        policiesAndTermsService.addNewDocument(payload);

        sandbox.assert.calledWith(sendTransactionStub, data, GAS_LIMIT.POLICIES_AND_TERMS.ADD_NEW_DOCUMENT);

        sandbox.assert.calledWith(
            contractMethods.addNewDocument,
            payload.ipfsHash,
            timestamp1
        );

        sandbox.assert.called(helperMethods.createTimeStamp);

        sandbox.assert.called(encodeABI);
    });

    it('can save acceptance', () => {
        const payload = {
            documentHash: '5CEF18be6e742c63AA2Dab7F52C1B699040875808',
            walletAddress: '0x5EF18be6e742c63AA2Dab7F52C1B699040875808',
            timestamp: '2018-11-28T13:01:04.956Z'
        };

        contractMethods.saveAcceptance = sandbox.stub().returns({
            encodeABI
        });

        policiesAndTermsService.saveAcceptance(payload);

        sandbox.assert.calledWith(sendTransactionStub, data, GAS_LIMIT.POLICIES_AND_TERMS.SAVE_ACCEPTANCE);

        sandbox.assert.calledWith(
            contractMethods.saveAcceptance,
            payload.walletAddress,
            payload.documentHash,
            timestamp
        );

        sandbox.assert.calledWith(helperMethods.ISOstringToTimestamp, payload.timestamp);
    });

    it('can get document', async () => {
        const documentHash = '5CEF18be6e742c63AA2Dab7F52C1B699040875808';
        const document = {
            isEntity: true,
            timestamp
        };

        call.resolves(document);

        contractMethods.getDocument = sandbox.stub().returns({
            call
        });

        const result = await policiesAndTermsService.getDocument(documentHash);

        sandbox.assert.calledWith(contractMethods.getDocument, documentHash);
        chai.expect(result.timestamp).to.be.equal(dateString);

        sandbox.assert.calledWith(helperMethods.timeStampToISOstring, timestamp);
    });

    it('returns null if document.isEntity is false', async () => {
        const documentHash = '5CEF18be6e742c63AA2Dab7F52C1B699040875808';
        const document = {
            isEntity: false,
            timestamp
        };

        call.resolves(document);

        contractMethods.getDocument = sandbox.stub().returns({
            call
        });

        const result = await policiesAndTermsService.getDocument(documentHash);

        sandbox.assert.calledWith(contractMethods.getDocument, documentHash);

        chai.expect(result).to.be.equal(null);
    });

    it('can get user acceptance', async () => {
        const walletAddress = '0x5EF18be6e742c63AA2Dab7F52C1B699040875808';
        const documentHash = '5CEF18be6e742c63AA2Dab7F52C1B699040875808';
        const acceptance = {
            isEntity: true,
            timestamp
        };

        call.resolves(acceptance);

        contractMethods.getUserAcceptance = sandbox.stub().returns({
            call
        });

        const result = await policiesAndTermsService.getUserAcceptance(walletAddress, documentHash);

        sandbox.assert.calledWith(contractMethods.getUserAcceptance, walletAddress, documentHash);
        chai.expect(result.timestamp).to.be.equal(dateString);

        sandbox.assert.calledWith(helperMethods.timeStampToISOstring, timestamp);
    });

    it ('returns null if acceptance does not exist', async () => {
        const walletAddress = '0x5EF18be6e742c63AA2Dab7F52C1B699040875808';
        const documentHash = '5CEF18be6e742c63AA2Dab7F52C1B699040875808';
        const acceptance = {
            isEntity: false,
            timestamp
        };

        call.resolves(acceptance);

        contractMethods.getUserAcceptance = sandbox.stub().returns({
            call
        });

        const result = await policiesAndTermsService.getUserAcceptance(walletAddress, documentHash);

        sandbox.assert.calledWith(contractMethods.getUserAcceptance, walletAddress, documentHash);
        chai.expect(result).to.be.equal(null);
    });
});