let SharedAccess = artifacts.require("SharedAccess");
let web3 = require('web3');

contract('SharedAccess', (accounts) => {
    const connectionId = '2dg93hd3hd3bdn3b3du3';
    const from = accounts[0];
    const to = accounts[1];
    const created = Math.floor(Date.now() / 1000);

    it('can save connection attempt and retrieve it', async () => {
        const sharedAccess = await SharedAccess.deployed();

        await sharedAccess.addConnectionAttempt(
            connectionId,
            from,
            to,
            created,
        );

        const connection = await sharedAccess.getConnectionAttempt(connectionId);

        assert.equal(connection[0], connectionId);

        assert.equal(connection[1], from);
        assert.equal(connection[2], to);
        assert.equal(connection[3], created);
        assert.equal(connection[4], created);
        assert.equal(connection[5], false);
    });

    it('does not save connection if it already exists', async () => {
        const sharedAccess = await SharedAccess.new();

        await sharedAccess.addConnectionAttempt(
            connectionId,
            from,
            to,
            created,
        );

        let connection = await sharedAccess.getConnectionAttempt(connectionId);

        assert.equal(connection[0], connectionId);

        assert.equal(connection[1], from);
        assert.equal(connection[2], to);
        assert.equal(connection[3], created);
        assert.equal(connection[4], created);
        assert.equal(connection[5], false);

        const newCreated = created + 569000;

        await sharedAccess.addConnectionAttempt(
            connectionId,
            from,
            to,
            newCreated,
        );

        connection = await sharedAccess.getConnectionAttempt(connectionId);

        assert.equal(connection[0], connectionId);

        assert.equal(connection[1], from);
        assert.equal(connection[2], to);
        assert.notEqual(connection[3], newCreated);
        assert.notEqual(connection[4], newCreated);
        assert.equal(connection[5], false);
    });

    it('returns empty fields when connection does not exist', async () => {
        const sharedAccess = await SharedAccess.deployed();

        const connectionId = 'mdsdie89n9e8fie9';

        const connection = await sharedAccess.getConnectionAttempt(connectionId);

        assert.equal(connection[1], '0x0000000000000000000000000000000000000000');
        assert.equal(connection[2], '0x0000000000000000000000000000000000000000');
        assert.equal(connection[3], 0);
        assert.equal(connection[4], 0);
        assert.equal(connection[5], false);
    });

    it('can update saved connection attempt', async () => {
        const sharedAccess = await SharedAccess.new();

        await sharedAccess.addConnectionAttempt(
            connectionId,
            from,
            to,
            created,
        );

        let connection = await sharedAccess.getConnectionAttempt(connectionId);

        assert.equal(connection[4], created);
        assert.equal(connection[5], false);

        let timestamp = Math.floor(Date.now() / 1000);

        await sharedAccess.updateConnectionAttempt(connectionId, true, timestamp);

        connection = await sharedAccess.getConnectionAttempt(connectionId);

        assert.equal(connection[4], timestamp);
        assert.equal(connection[5], true);
    });

    it('can save consent to the blockchain and retrieve it', async () => {
        const sharedAccess = await SharedAccess.new();

        const consentId = 'my_consent_ID';
        const timestamp = Date.now();

        const dataSource = ['provider_1_id', 'provider_2_id'];
        const dataSourceString = JSON.stringify(dataSource);

        const startDate = Date.now();
        const endDate = Date.now();

        const scope = 2 ** 4 | 2 ** 6;
        const scopeHex = `0x${web3.utils.padLeft(scope.toString(16), 32)}`;

        await sharedAccess.addConnectionAttempt(
            connectionId,
            from,
            to,
            created,
        );

        await sharedAccess.addConsent(
            consentId,
            timestamp,
            scopeHex,
            dataSourceString,
            startDate,
            endDate,
            connectionId,
        );

        let savedConsent = await sharedAccess.getConsent(consentId);

        assert.equal(savedConsent[0], consentId);

        assert.equal(savedConsent[1], connectionId);

        assert.equal(savedConsent[2], timestamp);

        assert.equal(savedConsent[3], scopeHex);
        assert.equal(parseInt(savedConsent[3], 16), scope);

        assert.equal(savedConsent[4], dataSourceString);

        assert.equal(savedConsent[5], startDate);

        assert.equal(savedConsent[6], endDate);
    });

    it('doesnt save consent to blockchain if connection does not exist', async () => {
        const sharedAccess = await SharedAccess.new();

        const consentId = 'my_consent_ID';
        const timestamp = Date.now();

        const dataSource = ['provider_1_id', 'provider_2_id'];
        const dataSourceString = JSON.stringify(dataSource);

        const startDate = Date.now();
        const endDate = Date.now();

        const scope = 2 ** 4 | 2 ** 6;
        const scopeHex = `0x${web3.utils.padLeft(scope.toString(16), 32)}`;

        await sharedAccess.addConsent(
            consentId,
            timestamp,
            scopeHex,
            dataSourceString,
            startDate,
            endDate,
            connectionId,
        );

        let savedConsent = await sharedAccess.getConsent(consentId);

        assert.equal(savedConsent[0], consentId);

        assert.equal(savedConsent[1], '');

        assert.equal(savedConsent[2], 0);

        assert.equal(savedConsent[3], '0x00000000000000000000000000000000');

        assert.equal(savedConsent[4], '');

        assert.equal(savedConsent[5], 0);

        assert.equal(savedConsent[6], 0);
    });

    it('returns empty fields when consent is not found', async () => {
        const sharedAccess = await SharedAccess.new();

        const consentId = 'doesNotExist';

        const savedConsent = await sharedAccess.getConsent(consentId);

        assert.equal(savedConsent[0], consentId);

        assert.equal(savedConsent[1], '');

        assert.equal(savedConsent[2], 0);

        assert.equal(savedConsent[3], '0x00000000000000000000000000000000');

        assert.equal(savedConsent[4], '');

        assert.equal(savedConsent[5], 0);

        assert.equal(savedConsent[6], 0);
    });

    it('can revoke consent', async () => {
        const sharedAccess = await SharedAccess.new();

        const consentId = 'my_consent_ID';
        const timestamp = Date.now();

        const dataSource = ['provider_1_id', 'provider_2_id'];
        const dataSourceString = JSON.stringify(dataSource);

        const startDate = Date.now();
        const endDate = Date.now();

        const scope = 2 ** 4 | 2 ** 6;
        const scopeHex = `0x${web3.utils.padLeft(scope.toString(16), 32)}`;

        await sharedAccess.addConnectionAttempt(
            connectionId,
            from,
            to,
            created,
        );

        await sharedAccess.addConsent(
            consentId,
            timestamp,
            scopeHex,
            dataSourceString,
            startDate,
            endDate,
            connectionId,
        );

        let consentIsRevoked = await sharedAccess.consentIsRevoked(consentId);
        assert.equal(consentIsRevoked, false);

        let savedConsent = await sharedAccess.getConsent(consentId);

        assert.equal(savedConsent[0], consentId);

        assert.equal(savedConsent[1], connectionId);

        assert.equal(savedConsent[2], timestamp);

        assert.equal(savedConsent[3], scopeHex);
        assert.equal(parseInt(savedConsent[3], 16), scope);

        assert.equal(savedConsent[4], dataSourceString);

        assert.equal(savedConsent[5], startDate);

        assert.equal(savedConsent[6], endDate);

        assert.equal(savedConsent[7], false);

        const revokeTime = timestamp + 3467000;

        await sharedAccess.revokeConsent(consentId, revokeTime);

        consentIsRevoked = await sharedAccess.consentIsRevoked(consentId);

        assert.equal(consentIsRevoked, true);

        savedConsent = await sharedAccess.getConsent(consentId);

        assert.equal(savedConsent[0], consentId);

        assert.equal(savedConsent[1], connectionId);

        assert.equal(savedConsent[2], revokeTime);

        assert.equal(savedConsent[3], scopeHex);
        assert.equal(parseInt(savedConsent[3], 16), scope);

        assert.equal(savedConsent[4], dataSourceString);

        assert.equal(savedConsent[5], startDate);

        assert.equal(savedConsent[6], endDate);

        assert.equal(savedConsent[7], true);
    });
});