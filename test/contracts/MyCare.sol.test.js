//  Note that deployed() is also an async function !
const appRoot = require('app-root-path');

const logger = require(`${appRoot}/config/winston`);
const MyCare = artifacts.require("../../contracts/MyCare.sol");

contract('Mycare', function (accounts) {
    const owner = accounts[0];
    const account2 = accounts[1];
    const account3 = accounts[2];
    const account4 = accounts[4];

    const profile1 = 'one';
    const profile2 = 'two';
    const profile3 = 'three';

    it('should have a main account', () => {
        assert.notEqual(owner, undefined, 'No Owner!');
    });

    it('can add account', async function () {
        let h1 = fromAscii(profile1);
        let myCare = await MyCare.new();
        const timestamp = Math.floor(Date.now() / 1000);
        await myCare.AddAccount(owner, h1, timestamp);
        let results = await myCare.GetAccount(owner);
        logger.info("Results=", results);
        assert.equal(results[2], true);
        assert.equal(toAscii(results[1]), profile1, "Profile match failed");
        assert.equal(results[0], owner);
        assert.equal(results[3], true);
        assert.equal(results[4], timestamp);
        assert.equal(results[5], timestamp);
    });

    it('can add multiple accounts', async function () {
        let myCare = await MyCare.new();

        const profileHash = fromAscii(profile1);
        const profileHash2 = fromAscii(profile2);

        const timestamp = Math.floor(Date.now() / 1000);
        const timestamp2 = Math.floor(Date.now() / 1000) + 4;

        await myCare.AddAccount(owner, profileHash, timestamp);
        await myCare.AddAccount(account2, profileHash2, timestamp2);
        let r1 = await myCare.GetAccount(owner);
        let r2 = await myCare.GetAccount(account2);
        assert.equal(r1[2], true);
        assert.equal(toAscii(r1[1]), profile1);
        assert.equal(r1[0], owner);
        assert.equal(r2[2], true);
        assert.equal(toAscii(r2[1]), profile2);
        assert.equal(r2[0], account2);
        assert.equal(r1[3], true);
        assert.equal(r1[4], timestamp);
        assert.equal(r1[5], timestamp);
        assert.equal(r2[3], true);
        assert.equal(r2[4], timestamp2);
        assert.equal(r2[5], timestamp2);
    });

    it('can get account by profile', async () => {
        const myCare = await MyCare.new();

        const profileBytes32 = '0x6f6e650000000000000000000000000000000000000000000000000000000000';

        const timestamp = Math.floor(Date.now() / 1000);

        await myCare.AddAccount(owner, profileBytes32, timestamp);

        const result = await myCare.GetAccountByProfile(profileBytes32);

        assert.equal(result[0], owner);

        assert.equal(result[1], profileBytes32);
        assert.equal(result[2], true);
        assert.equal(result[3], true);
        assert.equal(result[4], timestamp);
        assert.equal(result[5], timestamp);
    });

    it('can deactivate an account', async () => {
        let myCare = await MyCare.new();
        const timestamp1 = Math.floor(Date.now() / 1000);

        let account3User = 'user_id_3';

        await myCare.AddAccount(account3, account3User, timestamp1);

        let result = await myCare.GetAccount(account3);

        assert.equal(result[3], true);

        assert.equal(result[4], timestamp1);
        assert.equal(result[5], timestamp1);

        const timestamp2 = Math.floor(Date.now() / 1000) + 4;

        await myCare.DeactivateAccount(account3, timestamp2);

        result = await myCare.GetAccount(account3);

        assert.equal(result[3], false);
        assert.equal(result[4], timestamp1);
        assert.equal(result[5], timestamp2);
    });

    const logData = function (label, v) {
        logger.info(label,
            ' Requested: ', v[0],
            ' Profile: ', v[1],
            ' Owner: ', v[2],
            ' IsEntity: ', v[3]);
    };


    // function toAscii(hex) {
    function toAscii(hex) {
        // Find termination
        let str = "";
        let i = 0,
            l = hex.length;
        if (hex.substring(0, 2) === '0x') {
            i = 2;
        }
        for (; i < l; i += 2) {
            let code = parseInt(hex.substr(i, 2), 16);
            if (code == 0) break; // <------------------------------- HERE 
            str += String.fromCharCode(code);
        }

        return str;
    };
})

function fromAscii(str, padding) {
    let hex = '0x';
    for (let i = 0; i < str.length; i++) {
        const code = str.charCodeAt(i);
        const n = code.toString(16);
        hex += n.length < 2 ? `0${n}` : n;
    }
    return hex + '0'.repeat(padding * 2 - hex.length + 2);
}