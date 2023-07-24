import { createLibp2p } from 'libp2p'
import { tcp } from '@libp2p/tcp'
import { noise } from '@chainsafe/libp2p-noise'
import { mplex } from '@libp2p/mplex'
import { createEd25519PeerId } from '@libp2p/peer-id-factory'
import { generateKeyPair, marshalPrivateKey, unmarshalPrivateKey, marshalPublicKey, unmarshalPublicKey } from '@libp2p/crypto/keys'
import { peerIdFromKeys, peerIdFromBytes } from '@libp2p/peer-id'
import { createFromPrivKey } from '@libp2p/peer-id-factory'
import { pipe } from 'it-pipe'
import drain from 'it-drain'
import { fromString as uint8ArrayFromString } from 'uint8arrays/from-string'
import { toString as uint8ArrayToString } from 'uint8arrays/to-string'
import map from 'it-map'
import sqlite3 from 'sqlite3'
import { open } from 'sqlite'

async function main() {
  const db = await open({
    filename: 'database.sqlite3',
    driver: sqlite3.Database
  })

  try {
    await db.exec('CREATE TABLE peer_logs (eth_wallet TEXT, key TEXT, torrent TEXT, from_peer TEXT, to_peer TEXT, piece INT)')
  } catch(err) {}

  // const prvkey = await generateKeyPair('secp256k1')
  // console.log('key:', marshalPrivateKey(key).toString('hex'))
  const key = await unmarshalPrivateKey(Buffer.from(prvkey, 'hex'))
  const id = await createFromPrivKey(key)
  console.log(id)

  const node = await createLibp2p({
    addresses: {
      // add a listen address (localhost) to accept TCP connections on a random port
      listen: ['/ip4/127.0.0.1/tcp/49852']
    },
    transports: [tcp()],
    connectionEncryption: [noise()],
    streamMuxers: [mplex()],
    peerId: id
  })

  console.log(node.peerId)

  // start libp2p
  await node.start()
  console.log('libp2p has started')

  // print out listening addresses
  console.log('listening on addresses:')
  node.getMultiaddrs().forEach((addr) => {
    console.log(addr.toString())
  })

  node.addEventListener('peer:connect', (evt) => {
    const remotePeer = evt.detail
    console.log('received dial to me from:', remotePeer.toString())
  })

  await node.handle('/axon-protocol/1.0.0', async ({ stream }) => {
    // Receive JSON data from the remote peer
    pipe(
      stream.source,
      (source) => map(source, (buf) => uint8ArrayToString(buf.subarray())),
      async function (source) {
        // For each chunk of data
        for await (const msg of source) {
          // Output the data as a utf8 string
          console.log(stream.id + ' > ' + msg.toString().replace('\n', ''))
          
          // Process.
          console.log('storing logs')
          const logs = JSON.parse(msg)
          
          console.log(logs)
          let insertQuery =
            "INSERT INTO peer_logs " +
            "VALUES (?, ?, ?, ?, ?, ?)";
          let statement = await db.prepare(insertQuery);
          
          for (let log of logs) {
            const {
              eth_wallet,
              key,
              torrent,
              from_peer,
              to_peer,
              piece
            } = log

            if(key === 'hello') continue

            await statement.run([
              eth_wallet,
              key,
              torrent,
              from_peer,
              to_peer,
              piece
            ])
          }

          statement.finalize();
        }
      }
    )
  })

  // stop libp2p
  // await node.stop()
  // console.log('libp2p has stopped')
}
const prvkey = '0802122059137108ac4f57fe1853b0f7b7c9dda8effe3cb7bdeb60c7928214b0b842b2f7'

main().then().catch(console.error)