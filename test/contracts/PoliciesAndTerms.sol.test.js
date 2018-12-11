var PoliciesAndTerms = artifacts.require("../../contracts/PoliciesAndTerms");

contract('PoliciesAndTerms', function (accounts) {
    var owner = accounts[0];
    var account2 = accounts[1];
    var account3 = accounts[2];
    var account4 = accounts[4];

    it("can add new document and retrieve it", async () => {
        const policiesAndTerms = await PoliciesAndTerms.new();

        let timestamp = Math.floor(Date.now() / 1000);
        let ipfsHash = '0xff3457aa289c82e92d92998a8cc';

        await policiesAndTerms.addNewDocument(ipfsHash, timestamp);

        const result = await policiesAndTerms.getDocument(ipfsHash);

        assert.equal(result[0], ipfsHash);
        assert.equal(result[1], timestamp);
        assert.equal(result[2], true);
    });

    it('can save user acceptance and retrieve', async () => {
        const policiesAndTerms = await PoliciesAndTerms.new();

        const walletAdress = '0x5EF18be6e742c63AA2Dab7F52C1B699040875808';
        let documentHash = '0xff3457aa289c82e92d92998a8cc';
        const timestamp = Math.floor(Date.now() / 1000);

        await policiesAndTerms.saveAcceptance(walletAdress, documentHash, timestamp);

        const result = await policiesAndTerms.getUserAcceptance(walletAdress, documentHash);
        console.log(JSON.stringify(result));

        assert.equal(result[0], documentHash);

        assert.equal(result[1], timestamp);
        assert.equal(result[2], true);
    });
});