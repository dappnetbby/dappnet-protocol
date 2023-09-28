import WebTorrent from 'webtorrent'
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


async function run() {
    console.log(`SEED`)
    console.log()

    const torrentDataPath = __dirname + '/uploads'
    console.log(torrentDataPath)

    const client = new WebTorrent({
        // > w=(require('ethers').Wallet).createRandom(), console.log(w.address, w.privateKey)
        // 0x8c2183507a5908715322Ed0e1FC7a0D2e09816f4 0x2ce6a49f7f57e1b93c91d56ea80bfe83448bade8fc5222e78a3c692947faa92e
        ethereumWallet: "0x2ce6a49f7f57e1b93c91d56ea80bfe83448bade8fc5222e78a3c692947faa92e",
        peerId: '5'.repeat(40),
        tracker: true,
        torrentPort: 24555,
    })

    const torrent = client.add(
        // 'magnet:?xt=urn:btih:6a9759bffd5c0af65319979fb7832189f4f3c35d&dn=sintel.mp4&tr=udp%3A%2F%2Fexodus.desync.com%3A6969&tr=udp%3A%2F%2Ftracker.coppersurfer.tk%3A6969&tr=udp%3A%2F%2Ftracker.internetwarriors.net%3A1337&tr=udp%3A%2F%2Ftracker.leechers-paradise.org%3A6969&tr=udp%3A%2F%2Ftracker.openbittorrent.com%3A80&tr=wss%3A%2F%2Ftracker.btorrent.xyz&tr=wss%3A%2F%2Ftracker.fastcast.nz&tr=wss%3A%2F%2Ftracker.openwebtorrent.com&tr=wss%3A%2F%2Ftracker.webtorrent.io&ws=https%3A%2F%2Fwebtorrent.io%2Ftorrents%2Fsintel-1024-surround.mp4',
        // 'magnet:?xt=urn:btih:6a9759bffd5c0af65319979fb7832189f4f3c35d&dn=sintel.mp4',
        'magnet:?xt=urn:btih:6a9759bffd5c0af65319979fb7832189f4f3c35d&dn=sintel2.mp4&x.pe=localhost:24333',
        {
            path: torrentDataPath
        }
    )

    setInterval(() => {
        console.log('downloaded', torrent.downloaded)
        console.log('uploaded', torrent.uploaded)
        console.log(torrent.path)
        console.log('.')
    }, 1000)
}

run()