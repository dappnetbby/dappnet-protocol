const ethers = require('ethers')
const contracts = require('../deployments/local.json')

const provider = new ethers.providers.JsonRpcProvider('http://localhost:8545')
const wallet = new ethers.Wallet('0x2ce6a49f7f57e1b93c91d56ea80bfe83448bade8fc5222e78a3c692947faa92e', provider)

const contract = new ethers.Contract(
    contracts.System.address,
    contracts.System.abi,
    wallet
)

contract.on('*', (event) => {
    console.log(event.event, event.args)
})