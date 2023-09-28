import WebTorrent from 'axon-webtorrent';
import * as ethers from 'ethers';
import path from 'path';
import debugLib from 'debug';
import { Pool, StateEngine } from './state_engine';
const __dirname = path.dirname(__filename);
const debug = debugLib('axon:node')

type ExactTopic = string

export class TorrentEngine {
    public torrentClient: WebTorrent.Instance
    public torrents: Record<ExactTopic, any>

    constructor(
        private stateEngine: StateEngine,
        private privateKey: string,
        private torrentPort: number,
        private torrentDataPath: string
    ) {
        this.stateEngine = stateEngine
        this.torrentDataPath = torrentDataPath
        debug('starting WebTorrent on port ' + torrentPort)
        const wallet = new ethers.Wallet(privateKey)

        this.torrentClient = new WebTorrent({
            ethereumWallet: privateKey,
            peerId: wallet.address.slice(2),
            tracker: true,
            torrentPort,
        })
        this.torrents = {}
    }

    start() {
        this.stateEngine.on('update', (pools: Record<string, Pool>) => {
            debug('processing state update', pools)
            
            // Construct torrent state.
            const isTorrentLive: Record<string, boolean> = {}
            const torrents = []

            for(let pool of Object.values(pools)) {
                for(let torrent of pool.torrents) {
                    const isLive = pool.isMember && torrent.live
                    isTorrentLive[torrent.exactTopic] = isLive

                    torrents.push({
                        exactTopic: torrent.exactTopic,
                        uri: torrent.uri,
                        live: isLive
                    })
                }
            }

            // Stop torrents.
            for (let [exactTopic, torrent] of Object.entries(this.torrents)) {
                if (!isTorrentLive[exactTopic]) {
                    // Stop torrent.
                    debug(`Stopping torrent: ${exactTopic}`)
                    // TODO:
                    // const torrent = this.torrentClient.remove(exactTopic)
                }
            }

            // Start torrents.
            debug(torrents)
            for (let torrentRecord of torrents) {
                // if(torrentRecord.exactTopic != "1f4c4f170cd7314c55b13f4888f263fe4aab487d") continue
                if (!torrentRecord.live) continue

                // Get the torrent first.
                const torrent = this.torrentClient.get(torrentRecord.exactTopic)
                if (torrent) {
                    // Torrent already started.
                    debug(`Torrent already started: ${torrentRecord.exactTopic}`)
                    continue
                } else {
                    // Start torrent.
                    debug(`Starting torrent: ${torrentRecord.exactTopic}`)
                    const torrent = this.torrentClient.add(
                        torrentRecord.uri,
                        {
                            path: this.torrentDataPath + '/' + torrentRecord.exactTopic,
                            maxWebConns: 100
                        },
                        ready => {
                            torrent.pause()
                        }
                    )
                    this.torrents[torrentRecord.exactTopic] = torrent
                }
            }
        })
    }
}
