const axios = require('axios');
const crypto = require('crypto');

// const baseUrl = 'http://127.0.0.1:4000/api/v1';
const baseUrl = 'http://mycare-build.eastus.cloudapp.azure.com:4049/api/v1';

async function getAccessToken() {
    const BLOCKCHAIN_API_CLIENT_ID = 'a86695261cc35ea2c79f89cbe974a8ddad70c61724b1b6eafde45e406f67ea39889f0fd10a3739b37402d29e30a445f4cd136c3248e39e9785b276f85bd88052c534255afe451235491927f1df2e5a44';
    const BLOCKCHAIN_API_CLIENT_SECRET = '62ff7e54f2062698ba09e59b8a1dccbdeae78173d2ca2ad56522bd21c6114884f2a04bd34ef32aa6c9a19fb2e3e6830615824b18f5fc6fa949dfd3f510b4ebb21ea1cb5ad524696578a040167b70836b';
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
        // console.log(JSON.stringify(err));
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
const size = sizeOfData ? Number(sizeOfData) : 1;

if (isNaN(size)) {
    throw new Error('Expecting a number(integer)');
}
console.log(process.argv);

Main(size).then(() => {
    console.log(`Completed call to the blockchain API`);
}).catch(err => {
    console.log(err);
});