let SharedAccess = artifacts.require('SharedAccess');
let web3 = require('web3');

contract('SharedAccess', (accounts) => {
    const connectionId = '2dg93hd3hd3bdn3b3du3';
    const from = accounts[0];
    const to = accounts[1];
    const created = Math.floor(Date.now() / 1000);
    const dataSource = ['0x5ef18be6e742c63aa2dab7f52c1b699040875808', '0xd9ef690a2836b5e50098a391ebd490a96a416eec'];

    it('can save connection and retrieve it', async () => {
        const sharedAccess = await SharedAccess.deployed();

        await sharedAccess.addConnection(
            connectionId,
            from,
            to,
            created
        );

        const connection = await sharedAccess.getConnection(connectionId);
        assert.equal(connection[0], connectionId);

        assert.equal(connection[1], from);
        assert.equal(connection[2], to);
        assert.equal(connection[3], created);
        assert.equal(connection[4], created);
        assert.equal(connection[5], true);
        assert.equal(connection[6], true);
        assert.equal(connection[7], false);
    });

    it('does not save connection if it already exists', async () => {
        const sharedAccess = await SharedAccess.new();

        await sharedAccess.addConnection(
            connectionId,
            from,
            to,
            created
        );

        let connection = await sharedAccess.getConnection(connectionId);

        assert.equal(connection[0], connectionId);

        assert.equal(connection[1], from);
        assert.equal(connection[2], to);
        assert.equal(connection[3], created);
        assert.equal(connection[4], created);
        assert.equal(connection[5], true);
        assert.equal(connection[6], true);
        assert.equal(connection[7], false);

        const newCreated = created + 569000;

        await sharedAccess.addConnection(
            connectionId,
            from,
            to,
            newCreated
        );

        connection = await sharedAccess.getConnection(connectionId);

        assert.equal(connection[0], connectionId);

        assert.equal(connection[1], from);
        assert.equal(connection[2], to);
        assert.notEqual(connection[3], newCreated);
        assert.notEqual(connection[4], newCreated);
        assert.equal(connection[5], true);
    });

    it('returns empty fields when connection does not exist', async () => {
        const sharedAccess = await SharedAccess.deployed();

        const connectionId = 'mdsdie89n9e8fie9';

        const connection = await sharedAccess.getConnection(connectionId);

        assert.equal(connection[1], '0x0000000000000000000000000000000000000000');
        assert.equal(connection[2], '0x0000000000000000000000000000000000000000');
        assert.equal(connection[3], 0);
        assert.equal(connection[4], 0);
        assert.equal(connection[5], false);
    });

    it('can update saved connection', async () => {
        const sharedAccess = await SharedAccess.new();

        await sharedAccess.addConnection(
            connectionId,
            from,
            to,
            created
        );

        let connection = await sharedAccess.getConnection(connectionId);

        assert.equal(connection[4], created);
        assert.equal(connection[5], true);
        assert.equal(connection[6], true);
        assert.equal(connection[7], false);

        let timestamp = Math.floor(Date.now() / 1000);

        await sharedAccess.updateConnection(connectionId, true, timestamp);

        connection = await sharedAccess.getConnection(connectionId);
        assert.equal(connection[4], timestamp);
        assert.equal(connection[5], true);
        assert.equal(connection[7], true);

    });

    it('can save consent to the blockchain and retrieve it', async () => {
        const sharedAccess = await SharedAccess.new();

        const consentId = 'my_consent_ID';
        const timestamp = Date.now();

        const startDate = Date.now();
        const endDate = Date.now();

        const scope = 2 ** 4 | 2 ** 6;
        const scopeHex = `0x${web3.utils.padLeft(scope.toString(16), 32)}`;

        await sharedAccess.addConnection(
            connectionId,
            from,
            to,
            created
        );

        await sharedAccess.addConsent(
            consentId,
            timestamp,
            scopeHex,
            dataSource,
            startDate,
            endDate,
            connectionId
        );

        let savedConsent = await sharedAccess.getConsent(consentId);

        assert.equal(savedConsent[0], consentId);

        assert.equal(savedConsent[1], connectionId);

        assert.equal(savedConsent[2], timestamp);
        assert.equal(savedConsent[3], timestamp);

        assert.equal(savedConsent[4], scopeHex);
        assert.equal(parseInt(savedConsent[4], 16), scope);

        assert.equal(savedConsent[5][0].toLowerCase(), dataSource[0]);
        assert.equal(savedConsent[5][1].toLowerCase(), dataSource[1]);

        assert.equal(savedConsent[6], startDate);

        assert.equal(savedConsent[7], endDate);

        assert.equal(savedConsent[8], false);

        assert.equal(savedConsent[9], true);
    });

    it('doesnt save consent to blockchain if connection does not exist', async () => {
        const sharedAccess = await SharedAccess.new();

        const consentId = 'my_consent_ID';
        const timestamp = Date.now();

        const startDate = Date.now();
        const endDate = Date.now();

        const scope = 2 ** 4 | 2 ** 6;
        const scopeHex = `0x${web3.utils.padLeft(scope.toString(16), 32)}`;

        await sharedAccess.addConsent(
            consentId,
            timestamp,
            scopeHex,
            dataSource,
            startDate,
            endDate,
            connectionId
        );

        let savedConsent = await sharedAccess.getConsent(consentId);

        assert.equal(savedConsent[0], consentId);

        assert.equal(savedConsent[1], '');

        assert.equal(savedConsent[2], 0);
        assert.equal(savedConsent[3], 0);

        assert.equal(savedConsent[4], '0x00000000000000000000000000000000');

        assert.equal(savedConsent[5].length, 0);

        assert.equal(savedConsent[6], 0);

        assert.equal(savedConsent[7], 0);

        assert.equal(savedConsent[8], false);

        assert.equal(savedConsent[9], false);
    });

    it('returns empty and falsy fields when consent is not found', async () => {
        const sharedAccess = await SharedAccess.new();

        const consentId = 'doesNotExist';

        const savedConsent = await sharedAccess.getConsent(consentId);

        assert.equal(savedConsent[0], consentId);

        assert.equal(savedConsent[1], '');

        assert.equal(savedConsent[2], 0);
        assert.equal(savedConsent[3], 0);

        assert.equal(savedConsent[4], '0x00000000000000000000000000000000');

        assert.equal(savedConsent[5].length, 0);

        assert.equal(savedConsent[6], 0);

        assert.equal(savedConsent[7], 0);

        assert.equal(savedConsent[8], false);

        assert.equal(savedConsent[9], false);
    });

    it('can access is false if consent doesnt not exist', async () => {
        const sharedAccess = await SharedAccess.new();

        const consentId = 'non-existent-conent';
        const canAccess = await sharedAccess.canAccess(consentId);

        assert.equal(canAccess, false);
    });

    it('can revoke consent', async () => {
        const sharedAccess = await SharedAccess.new();

        const consentId = 'my_consent_ID';
        const timestamp = Date.now();

        const startDate = Date.now();
        const endDate = Date.now();

        const scope = 2 ** 4 | 2 ** 6;
        const scopeHex = `0x${web3.utils.padLeft(scope.toString(16), 32)}`;

        await sharedAccess.addConnection(
            connectionId,
            from,
            to,
            created
        );

        await sharedAccess.addConsent(
            consentId,
            timestamp,
            scopeHex,
            dataSource,
            startDate,
            endDate,
            connectionId
        );

        let canAccess = await sharedAccess.canAccess(consentId);
        assert.equal(canAccess, true);

        let savedConsent = await sharedAccess.getConsent(consentId);

        assert.equal(savedConsent[0], consentId);

        assert.equal(savedConsent[1], connectionId);

        assert.equal(savedConsent[2], timestamp);
        assert.equal(savedConsent[3], timestamp);

        assert.equal(savedConsent[4], scopeHex);
        assert.equal(parseInt(savedConsent[4], 16), scope);

        assert.equal(savedConsent[5][0].toLowerCase(), dataSource[0]);
        assert.equal(savedConsent[5][1].toLowerCase(), dataSource[1]);

        assert.equal(savedConsent[6], startDate);

        assert.equal(savedConsent[7], endDate);

        assert.equal(savedConsent[8], false);

        assert.equal(savedConsent[9], true);

        const revokeTime = timestamp + 3467000;

        await sharedAccess.revokeConsent(consentId, revokeTime);

        canAccess = await sharedAccess.canAccess(consentId);

        assert.equal(canAccess, false);

        savedConsent = await sharedAccess.getConsent(consentId);

        assert.equal(savedConsent[0], consentId);

        assert.equal(savedConsent[1], connectionId);

        assert.equal(savedConsent[2], timestamp);
        assert.equal(savedConsent[3], revokeTime);

        assert.equal(savedConsent[4], scopeHex);
        assert.equal(parseInt(savedConsent[4], 16), scope);

        assert.equal(savedConsent[5][0].toLowerCase(), dataSource[0]);
        assert.equal(savedConsent[5][1].toLowerCase(), dataSource[1]);

        assert.equal(savedConsent[6], startDate);

        assert.equal(savedConsent[7], endDate);

        assert.equal(savedConsent[8], true);
    });
});