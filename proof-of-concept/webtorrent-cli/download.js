import WebTorrent from 'webtorrent'
import process from 'node:process'

import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function run() {
    console.log(`DOWNLOAD`)
    console.log()

    const torrentDataPath = __dirname + '/downloads'
    console.log(torrentDataPath)

    const client = new WebTorrent({
        // > w=(require('ethers').Wallet).createRandom(), console.log(w.address, w.privateKey)
        // 0x51f183d27560b3adE0AA43Fee3b4464Db2cE8104 0x475c17fbea052277e888a42225d38fa0b4fb3e8b797a83a2b3eaa67bad68bb91
        ethereumWallet: "0x475c17fbea052277e888a42225d38fa0b4fb3e8b797a83a2b3eaa67bad68bb91",
        peerId: '2'.repeat(40),
        tracker: true,
        torrentPort: 24444,
        path: torrentDataPath
    })

    const torrent = client.add(
        'magnet:?xt=urn:btih:6a9759bffd5c0af65319979fb7832189f4f3c35d&dn=sintel.mp4&x.pe=localhost:24333',
        {
            path: torrentDataPath
        }
    )

    setInterval(() => {
        console.log('downloaded', torrent.downloaded)
        console.log('uploaded', torrent.uploaded)
        console.log('.')
    }, 1000)
}

run()