import { createLibp2p } from 'libp2p'
import { noise } from '@chainsafe/libp2p-noise'
import { multiaddr } from '@multiformats/multiaddr'
import first from 'it-first'
import drain from 'it-drain'
import { pipe } from 'it-pipe'
import { fromString, toString } from 'uint8arrays'
import { webRTC } from '@libp2p/webrtc'
import { tcp } from '@libp2p/tcp'
import { mplex } from '@libp2p/mplex'
import { fromString as uint8ArrayFromString } from 'uint8arrays/from-string'
import { Pushable, pushable } from 'it-pushable'
// @ts-ignore
import contracts from './contracts.json' assert { type: "json" };
import ethers, { Wallet } from 'ethers'
import debugLib from 'debug'
const debugAggregator = debugLib('axon:aggregator')
const debugProtocol = debugLib('axon:protocol')

function encode(obj: any) {
  const messageString = JSON.stringify(obj);
  const enc = uint8ArrayFromString(messageString)
  // debug('Sent message:', messageString);
  return enc
}

export class Node {
  constructor(
    ethereumWallet: string,
    private provider: ethers.providers.JsonRpcProvider,
    public wallet: ethers.Wallet,
    public msgQueue: Pushable<any>
  ) {
    if (!ethereumWallet.length) {
      throw new Error('ethereumWallet is required')
    }
    this.provider = new ethers.providers.JsonRpcProvider('http://localhost:8545')
    this.wallet = new Wallet(ethereumWallet, this.provider)
    this.msgQueue = pushable()
  }

  async start() {
    const node = await createLibp2p({
      addresses: {
        // add a listen address (localhost) to accept TCP connections on a random port
        listen: ['/ip4/127.0.0.1/tcp/0']
      },
      transports: [tcp({
        // TODO:axon
        inboundSocketInactivityTimeout: 0,
        outboundSocketInactivityTimeout: 0
      })],
      connectionEncryption: [noise()],
      streamMuxers: [mplex()]
    })

    // start libp2p
    await node.start()
    debugAggregator('libp2p has started')

    // print out listening addresses
    debugAggregator('listening on addresses:')
    node.getMultiaddrs().forEach((addr) => {
      debugAggregator(addr.toString())
    })

    await node.start()

    const AGGREGATOR_ADDR = `/ip4/127.0.0.1/tcp/49852/p2p/16Uiu2HAmUvAB48Xn9aB4db7rVz53EwbqjoJhy94fSGg9xVFt6Te1`
    debugAggregator(`connecting to axon aggregator, address ${AGGREGATOR_ADDR}`)
    const ma =  multiaddr(AGGREGATOR_ADDR)
    const stream = await node.dialProtocol(ma, ['/axon-protocol/1.0.0'])
    
    const { msgQueue } = this
    msgQueue.push(encode([{ key: 'hello' }]));

    pipe(
      msgQueue,
      stream
    )

    // Now listen for rewards.
    // const dappnetToken = new ethers.Contract(
    //   '0x59b670e9fA9D0A427751Af201D676719a970857b',
    //   [
    //     'function transfer(address recipient, uint256 amount) public returns (bool)',
    //     'function balanceOf(address account) public view returns (uint256)',
    //     'event Transfer(address indexed from, address indexed to, uint256 value)'
    //   ],
    //   this.wallet
    // )
    // dappnetToken.on('Transfer', (from, to, value) => {
    //   debugProtocol('Transfer', from, to, value)
    //   return
    // })

    // const balance = await dappnetToken.balanceOf(this.wallet.address)
    // debugProtocol('balance', balance.toString())

    // const System = new ethers.Contract(
    //   contracts.System.address,
    //   contracts.System.abi,
    //   this.wallet
    // )

    // setInterval(async () => {
    //   // Check for rewards.
    //   try {
    //     const POOL_ID = '4'
    //     debugProtocol('checking for rewards')
    //     const award = await System.callStatic.claimRewards(POOL_ID, this.wallet.address)
    //     debugProtocol('have rewards')
    //     await System.claimRewards(POOL_ID, this.wallet.address)
    //   } catch (e) {
    //     console.error(e)
    //   }
    // }, 20_000)

  }

  async upload(logs: any) {
    const { msgQueue } = this
    msgQueue.push(encode(logs))
  }

  async download(logs: any) {
    const { msgQueue } = this
    msgQueue.push(encode(logs))
  }
}