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

function encode(obj: any) {
  const messageString = JSON.stringify(obj);
  const enc = uint8ArrayFromString(messageString)
  // console.log('Sent message:', messageString);
  return enc
}

export class Node {
  constructor(
    public msgQueue: Pushable<any>
  ) {
    this.msgQueue = pushable()
  }

  async start() {
    const node = await createLibp2p({
      addresses: {
        // add a listen address (localhost) to accept TCP connections on a random port
        listen: ['/ip4/127.0.0.1/tcp/0']
      },
      transports: [tcp()],
      connectionEncryption: [noise()],
      streamMuxers: [mplex()]
    })

    // start libp2p
    await node.start()
    console.log('libp2p has started')

    // print out listening addresses
    console.log('listening on addresses:')
    node.getMultiaddrs().forEach((addr) => {
      console.log(addr.toString())
    })

    await node.start()

    const AGGREGATOR_ADDR = `/ip4/127.0.0.1/tcp/49852/p2p/16Uiu2HAmUvAB48Xn9aB4db7rVz53EwbqjoJhy94fSGg9xVFt6Te1`
    console.log(`connecting to axon aggregator, address ${AGGREGATOR_ADDR}`)
    const ma =  multiaddr(AGGREGATOR_ADDR)
    const stream = await node.dialProtocol(ma, ['/axon-protocol/1.0.0'])
    
    const { msgQueue } = this

    for (let i = 0; i < 2; i++) {
      msgQueue.push(encode([{ key: 'hello' }]));
    }

    pipe(
      msgQueue,
      stream
    )

    msgQueue.push(encode('next'))
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