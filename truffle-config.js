const dotenv = require('dotenv');
dotenv.config();

module.exports = {
  networks: {
    development: {
      host: '127.0.0.1',
      port: 8545,
      network_id: '*',
    },
  },
  mocha: {
    timeout: 90000,
  },
};
