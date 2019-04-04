const axios = require('axios');
const crypto = require('crypto');

const baseUrl = 'http://127.0.0.1:4000/api/v1';

async function getAccessToken() {
    const BLOCKCHAIN_API_CLIENT_ID = 'b38f89ed80a33d85fa367358c13f701b6ae2565bf2241751d08eabcaae717628ee37c18ef54fd23d8d8e8e887e8b5fbf08ffe2ae05654104a2169d304395727d737e0654849e7ae4690d9fd6041d90a4'
    const BLOCKCHAIN_API_CLIENT_SECRET = '63f7c370895ccc3a990be3590ce8cf345e9cfcb264acfbe769cc432eb76e8650d525d5c090479b521f4de91f9dc25c5b3bdc6768d74e754125c5dd29733d8e0ac5019b2f2977f1da8e55b45938457831'
    console.log(`GET access token`);
    // console.log(`CLIENT_ID: ${BLOCKCHAIN_API_CLIENT_ID}`);
    // console.log(`CLIENT_SECRET: ${BLOCKCHAIN_API_CLIENT_SECRET}`);
    const resp = await axios({
        method: 'post',
        url: `${baseUrl}/auth`,
        headers: {
            'Content-Type': 'application/json'
        },
        data: {
            clientId: BLOCKCHAIN_API_CLIENT_ID,
            clientSecret: BLOCKCHAIN_API_CLIENT_SECRET
        }
    });

    return resp.data.access_token;
}
/**
 * @description Generates data needed to call blockchain api endpoint `/mycare/add_account`
 * @param {Number} size number of request data to generate
 * @returns {Array<{ walletAddress: string, timestamp: string, profileHash: string}>} requestData
 */
function generateAddAccountRequestData(size) {
    console.log(`Generate data of size: ${size}`);
    let requestData = [];

    for (let i = 0; i < size; i++) {
        console.log(`Generating data number ${i + 1}`);
        const walletAddress = `0x${crypto.randomBytes(20).toString('hex')}`;
        const profileHash = crypto.randomBytes(23).toString('hex');
        const timestamp = (new Date()).toISOString();
        const payload = {
            walletAddress,
            timestamp,
            profileHash
        };

        requestData.push(payload);
    }

    console.log(`Completed data generation. SIZE: ${requestData.length}`);
    return requestData;
}

async function addAccount(data, accessToken, index) {
    try {
        const resp = await axios({
            method: 'post',
            url: `${baseUrl}/mycare/add_account`,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`
            },
            data
        });

        console.log(`Add Account NO - ${index} Succeeded. DATA: ${JSON.stringify(resp.data)}`);
    } catch (err) {
        console.log(`Failed to save account. ERR: ${err.message}`);
        console.log(JSON.stringify(err));
    }
}

async function Main(sizeOfData) {
    const requestData = generateAddAccountRequestData(sizeOfData);
    const accessToken = await getAccessToken();

    for (let [index, data] of requestData.entries()) {
        addAccount(data, accessToken, index);
    }
};

const sizeOfData = process.argv[2];
const size = !!sizeOfData ? Number(sizeOfData) : 1;

if (isNaN(size)) {
    throw new Error('Expecting a number(integer)');
}
console.log(process.argv);

Main(size).then(() => {
    console.log(`Completed call to the blockchain API`);
}).catch(err => {
    console.log(err);
});