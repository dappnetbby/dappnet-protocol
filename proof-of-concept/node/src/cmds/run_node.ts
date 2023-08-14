import WebTorrent from 'webtorrent'
import * as ethers from 'ethers'
import deployments from '../contracts.json' assert { type: "json" };
import { table } from 'table'
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(__filename);
import debugLib from 'debug'
const debug = debugLib('axon:node')
import EventEmitter from 'events'
import { Pool, StateEngine } from '../state_engine';
import { TorrentEngine } from '../torrent_engine';
import fs from 'node:fs'
const byteSize = require('byte-size')


interface RunNodeArgs {
    torrentDataPath: string
    torrentPort: number
}

export async function runNode(argv: RunNodeArgs) {
    const version = require('../../package.json').version
    debug('dappnet-protocol', version)

    // Setup provider.
    const RPC_URL = process.env.RPC_URL || 'http://localhost:8545'
    const provider = new ethers.providers.JsonRpcProvider(RPC_URL)

    // Check chain / network.
    const network = await provider.getNetwork()
    debug('network:', network.name)

    // Setup wallet.
    const PRIVATE_KEY = process.env.PRIVATE_KEY
    if (!PRIVATE_KEY) {
        throw new Error('PRIVATE_KEY env var is required')
    }
    const signer = new ethers.Wallet(PRIVATE_KEY, provider)

    // Check balance.
    const balance = await signer.getBalance()
    debug('balance:', ethers.utils.formatEther(balance))

    // Check address.
    debug('address:', signer.address)

    // Load System contract.
    const System = new ethers.Contract(
        deployments.System.address,
        deployments.System.abi,
        signer
    )

    debug(`Starting torrent client`)
    debug(`Torrent data path: ${argv.torrentDataPath}`)

    let stateEngine = new StateEngine(
        System,
        signer.address
    )

    let torrentEngine = new TorrentEngine(
        stateEngine,
        PRIVATE_KEY,
        argv.torrentPort,
        argv.torrentDataPath
    )
    torrentEngine.start()


    // TODO: visit all existing files in uploads/[infohash]/* and begin seeding them.
    const uploadsDir = path.join(__dirname, '..', '..', 'uploads')
    debug(`uploadsDir: ${uploadsDir}`)
    const uploads = await fs.readdirSync(uploadsDir)
    debug(`uploads: ${uploads}`)
    for (let upload of uploads) {
        const infoHash = upload
        const uploadDir = path.join(uploadsDir, infoHash)
        debug(`uploadDir: ${uploadDir}`)
        const files = await fs.readdirSync(uploadDir)
        debug(`files: ${files}`)
        for (let file of files) {
            const filePath = path.join(uploadDir, file)
            debug(`filePath: ${filePath}`)
            const torrent = await torrentEngine.torrentClient.seed(
                filePath,
                {
                    path: uploadDir,
                },
                ready => {
                    debug(`preload: seeding torrent ${torrent.infoHash}`)
                    torrentEngine.torrents[torrent.infoHash] = torrent
                }
            )
            
        }
    }



    stateEngine.on('update', (pools: Record<string, any>) => {
        const columns = 'Pool ID | Ticker | Name | Torrents'
            .split(' | ')

        const poolSummaryTable = [columns]
            .concat(Object.values(pools).map((pool: Pool, i) => {
                let fields = [
                    pool.poolId,
                    pool.ticker,
                    pool.name,
                    pool.torrents.map(torrent => {
                        console.log(torrent)
                        // Short form, first 4 bytes of exactTopic.
                        const shortId = torrent.exactTopic.slice(0, 8)
                        return shortId
                    }).join(', ')
                ]
                return fields
            }))

        debug(table(poolSummaryTable))
    })

    setInterval(async () => {
        const columns = 'Pool ID | Torrent | % downloaded | Peers | Downloaded | Uploaded'
            .split(' | ')


        const summary = [columns]
            .concat(Object.values(torrentEngine.torrents).map((t, i) => {
                const name = t.files && t.files[0] && t.files[0].name || t.infoHash
                let fields = [
                    'todo',
                    name,
                    (t.progress * 100).toFixed(2) + '%',
                    t.numPeers,
                    byteSize(t.downloaded).toString(),
                    byteSize(t.uploaded).toString()
                ]
                return fields
            }))

        debug(table(summary))
    }, 1000)

    await stateEngine.load()
    stateEngine.listen()
}