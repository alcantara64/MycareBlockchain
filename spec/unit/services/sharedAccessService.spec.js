const appRoot = require('app-root-path');
const chai = require('chai');
const proxyquire = require('proxyquire').noCallThru();
const sinon = require('sinon');
const sandbox = sinon.createSandbox();

describe('SharedAccessService', () => {
    let sharedAccessService;
    let contractHelper;
    let contractMethods;
    let encodeABI;
    let call;
    let helperMethods;
    let ContractHelperConstructor;
    let sendTransactionStub;

    const timestamp = 1544533771536;

    const data = '0x300000000000000ddeeecc300099aa9cccc9ff9eedacf83035ad93e939f99c929a939e939a99b9';

    const consent = {
        timestamp: '2018-11-28T13:01:04.956Z',
        scope: ['Medication', 'MessageDefinition', 'ServiceDefinition', 'Specimen'],
        dataSource: ['0x5EF18be6e742c63AA2Dab7F52C1B699040875808', '0xd9Ef690a2836b5e50098A391Ebd490A96a416EEc'],
        startDate: '2018-11-28T13:01:04.956Z',
        endDate: '2018-11-28T13:01:04.956Z',
        consentId: 'consent12',
        connectionId: 'connect1'
    };

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

        sharedAccessService = proxyquire(`${appRoot}/api/services/sharedAccessService`, imports);
    });

    afterEach(() => {
        sandbox.restore();
    });

    it('can add consent', () => {

        contractMethods.addConsent = sandbox.stub().returns({
            encodeABI
        });

        const bytes = '0xdf20c003e02b933ffccbfcadfeeecc54a000cd5ecf';

        sharedAccessService.integersToBytes = sandbox.stub().returns(bytes);

        sharedAccessService.addConsent(consent);

        sandbox.assert.calledWith(sendTransactionStub, data);

        const args = [
            consent.consentId,
            timestamp,
            bytes,
            consent.dataSource,
            timestamp,
            timestamp,
            consent.connectionId
        ];
        sandbox.assert.calledWith(contractMethods.addConsent, ...args);

        sandbox.assert.called(encodeABI);
    });

    it('can revoke consent', () => {
        const payload = {
            timestamp: '2018-12-11T14:21:00.404Z'
        };

        contractMethods.revokeConsent = sandbox.stub().returns({
            encodeABI
        });

        sharedAccessService.revokeConsent(payload);

        sandbox.assert.calledWith(helperMethods.ISOstringToTimestamp, payload.timestamp);
        sandbox.assert.calledWith(sendTransactionStub, data);
    });

    it('can check access permission', () => {
        contractMethods.canAccess = sandbox.stub().returns({
            call
        });

        const consentId = 'ees38ddkd93dmdo3d93do3ud';

        sharedAccessService.canAccess(consentId);

        sandbox.assert.calledWith(contractMethods.canAccess, consentId);
        sandbox.assert.called(call);
    });

    it('get consent returns null when consent does not exist', async () => {
        const consentId = 'ees38ddkd93dmdo3d93do3ud';
        const scopeArray = ['Medication', 'Procedure'];

        consent.isEntity = false;

        call.returns(consent);

        contractMethods.getConsent = sandbox.stub().returns({
            call
        });

        const result = await sharedAccessService.getConsent(consentId, scopeArray);

        chai.expect(result).to.equal(null);

        sandbox.assert.calledWith(contractMethods.getConsent, consentId);
    });

    it('can get saved consent', async () => {
        const consentId = 'ees38ddkd93dmdo3d93do3ud';
        const scopeArray = ['Medication', 'Procedure'];

        const savedConsent = {
            timestamp: '2018-11-28T13:01:04.956Z',
            scope: ['Medication', 'MessageDefinition', 'ServiceDefinition', 'Specimen'],
            dataSource: ['0x5EF18be6e742c63AA2Dab7F52C1B699040875808', '0xd9Ef690a2836b5e50098A391Ebd490A96a416EEc'],
            startDate: 1544547463323,
            endDate: 1544547463820,
            created: 1544547467734,
            updated: 1544547468989,
            consentId: 'consent12',
            connectionId: 'connect1',
            isEntity: true
        };

        call.returns(savedConsent);

        const updated = '2018-12-11T17:03:23.282Z';
        const startDate = '2018-11-28T13:01:04.956Z';
        const endDate = '2018-11-28T13:01:04.436Z';
        const created = '2018-11-28T13:01:04.886Z';

        helperMethods.timeStampToISOstring.withArgs(savedConsent.startDate).returns(startDate);
        helperMethods.timeStampToISOstring.withArgs(savedConsent.created).returns(created);
        helperMethods.timeStampToISOstring.withArgs(savedConsent.updated).returns(updated);
        helperMethods.timeStampToISOstring.withArgs(savedConsent.endDate).returns(endDate);

        sharedAccessService.scopeContainsInteger = sandbox.stub().returns(scopeArray);

        contractMethods.getConsent = sandbox.stub().returns({
            call
        });

        const result = await sharedAccessService.getConsent(consentId, scopeArray);

        chai.assert.equal(result.created, created);
        chai.assert.equal(result.updated, updated);
        chai.assert.equal(result.startDate, startDate);
        chai.assert.equal(result.endDate, endDate);

        sandbox.assert.calledWith(contractMethods.getConsent, consentId);
    });

    it('can add connection attempt', () => {
        const connection = {
            created: '2018-12-11T14:21:00.404Z',
            connectionId: 'ddkd93jd8fir0d',
            from: '0x5EF18be6e742c63AA2Dab7F52C1B699040875808',
            to: '0xd9Ef690a2836b5e50098A391Ebd490A96a416EEc'
        };

        const timestamp = Math.floor((new Date(connection.created)).getTime() / 1000);

        contractMethods.addConnectionAttempt = sandbox.stub().returns({
            encodeABI
        });

        sharedAccessService.addConnectionAttempt(connection);
        sandbox.assert.calledWith(contractMethods.addConnectionAttempt,
            connection.connectionId.toString(),
            connection.from,
            connection.to,
            timestamp
        );

        sandbox.assert.calledWith(sendTransactionStub, data);
    });

    it('can update connection attempt', () => {
        const payload = {
            timestamp: '2018-12-11T14:21:00.404Z',
            connectionId: 'ddkd93jd8fir0d',
            accepted: true
        };

        const timestamp = Math.floor((new Date(payload.timestamp)).getTime() / 1000);

        contractMethods.updateConnectionAttempt = sandbox.stub().returns({
            encodeABI
        });

        sharedAccessService.updateConnectionAttempt(payload);
        sandbox.assert.calledWith(contractMethods.updateConnectionAttempt,
            payload.connectionId,
            payload.accepted,
            timestamp
        );

        sandbox.assert.calledWith(sendTransactionStub, data);
    });

    it('returns null if connection attempt is not found', async () => {
        const connectionId = 'ees38ddkd93dmdo3d93do3ud';

        const savedConnection = {
            timestamp: '2018-11-28T13:01:04.956Z',
            scope: ['Medication', 'MessageDefinition', 'ServiceDefinition', 'Specimen'],
            dataSource: ['0x5EF18be6e742c63AA2Dab7F52C1B699040875808', '0xd9Ef690a2836b5e50098A391Ebd490A96a416EEc'],
            connectionId,
            isEntity: false
        };

        call.returns(savedConnection);

        contractMethods.getConnectionAttempt = sandbox.stub().returns({
            call
        });

        const result = await sharedAccessService.getConnectionAttempt(connectionId);

        chai.expect(result).to.equal(null);

        sandbox.assert.calledWith(contractMethods.getConnectionAttempt, connectionId);
    });

    it('can get saved connection attempt', async () => {
        const connectionId = 'ees38ddkd93dmdo3d93do3ud';

        const savedConnection = {
            timestamp: '2018-11-28T13:01:04.956Z',
            scope: ['Medication', 'MessageDefinition', 'ServiceDefinition', 'Specimen'],
            dataSource: ['0x5EF18be6e742c63AA2Dab7F52C1B699040875808', '0xd9Ef690a2836b5e50098A391Ebd490A96a416EEc'],
            connectionId,
            isEntity: true,
            created: 1544547467734,
            updated: 1544547468989
        };

        call.returns(savedConnection);

        contractMethods.getConnectionAttempt = sandbox.stub().returns({
            call
        });

        const updated = '2018-12-11T17:03:23.282Z';
        const created = '2018-11-28T13:01:04.886Z';

        helperMethods.timeStampToISOstring.withArgs(savedConnection.created).returns(created);
        helperMethods.timeStampToISOstring.withArgs(savedConnection.updated).returns(updated);

        const result = await sharedAccessService.getConnectionAttempt(connectionId);

        chai.expect(result).to.equal(savedConnection);

        chai.assert.equal(result.created, created);
        chai.assert.equal(result.updated, updated);

        sandbox.assert.calledWith(contractMethods.getConnectionAttempt, connectionId);
    });
});