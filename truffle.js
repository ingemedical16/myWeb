var HDWalletProvider = require("truffle-hdwallet-provider");
const MNEMONIC = 'apple people toss bulk index cage melt tank ranch ask bunker afford';
module.exports = {
     // See <http://truffleframework.com/docs/advanced/configuration>
     // to customize your Truffle configuration!
     networks: {
          ganache: {
               host: "localhost",
               port: 7545,
               network_id: "*" // Match any network id
          },
          privateNet: {
            host: "localhost",
            port: 8545,
            network_id: "4224",
            gas: 4700000
          },
          ropsten: {
            provider: function() {
              return new HDWalletProvider(MNEMONIC, "https://ropsten.infura.io/v3/14ff2fabaf0c473d88d9cce458c299c0")
            },
            network_id: 3,
            gas: 4000000      //make sure this gas allocation isn't over 4M, which is the max
          }
     }
};
