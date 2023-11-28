// connect to Ganache
web3 = new Web3(new Web3.providers.HttpProvider("http://127.0.0.1:7545"));

// retrieve the first account [0] from Ganache and set it as the default account
async function getAccount() {
  let accounts = await web3.eth.getAccounts();
  console.log("inside get account", accounts);
  web3.eth.defaultAccount = accounts[0];
  // console.log("Ganache account detected: ") + accounts[0];
  console.log(web3.eth.defaultAccount);
  return web3.eth.defaultAccount;
}
