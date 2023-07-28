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




// 
// PoolMember -> isMember? (yes) -> new pool    -> load torrents -> add torrents
//                         (no)  -> delete pool -> remove torrents 
// 
// Torrent    -> live?     (yes) -> add torrent
//                         (no)  -> remove torrent
// 


// Torrent(uint256 indexed poolId, string indexed exactTopic, string uri, bool live);
const getTorrentsForPool = async (System: ethers.Contract, poolId: string) => {
    const torrentEvents = await System.queryFilter(System.filters.Torrent(poolId, null))
    const torrentURIs = new Set()
    torrentEvents.forEach(event => {
        const { exactTopic, uri, live } = event.args
        // TODO:axon verify exactTopic in URI
        if (live) torrentURIs.add(uri)
        else torrentURIs.delete(uri)
    })
    return Array.from(torrentURIs)
}

class StateEngine extends EventEmitter {
    public pools: Record<string, any>

    constructor(
        public System: ethers.Contract,
        public account: string
    ) {
        super()
        this.System = System
        this.account = account
        this.pools = {}
    }

    async load() {
        const { System } = this
        // Now load all events and reduce them into the pools a user should be a part of.
        debug(`Loading pools for ${this.account}`)
        const events = await System.queryFilter(System.filters.PoolMember(null, this.account))
        debug(`Found ${events.length} events`)

        // Pools
        const poolIds = new Set()
        events.reduce((acc, event) => {
            const { poolId: poolBN, isMember } = event.args
            const pool = poolBN.toString()

            if (isMember) {
                poolIds.add(pool)
            } else if (!isMember) {
                poolIds.delete(pool)
            }
        }, [])

        // Now get the info for all of these pools.
        // Using multicall.
        debug(`Member of ${poolIds.size} pool(s)`)
        poolIds.forEach(pool => debug(`- ${pool}`))
        const poolIdsArray = Array.from(poolIds)
        const poolInfos = await System.getPoolInfoBatch(poolIdsArray)

        // Now load all torrents for all pools.
        debug("Loading torrents for pools")
        const torrentsForPools = await Promise.all(
            poolIdsArray.map(poolId => getTorrentsForPool(System, poolId))
        )
        debug(torrentsForPools)

        let poolsData: Record<string, any> = {}
        poolIdsArray.forEach((poolId, i) => {
            const [
                name,
                ticker,
            ] = [
                poolInfos.names[i],
                poolInfos.tickers[i],
            ]
            poolsData[poolId] = {
                poolId,
                name,
                ticker,
                torrents: torrentsForPools[i]
            }
        })

        this.pools = poolsData

        this.emit('update', this.pools)
    }

    listen() {
        const logEvent = (event) => {
            const { event, args } = event
            debug('event', event.event)
            // for(let [k,v] of ) {
            //     // if arg is 
            // }
        }

        // Listen for changes in the state.
        this.System.on('PoolMember', (event: any) => {
            const event = Array.from(arguments).pop()
            debug('event', 'PoolMember')
            this.processPoolMember(event)
        })

        this.System.on('Torrent', () => {
            const event = Array.from(arguments).pop()
            debug('event', 'Torrent')
            this.processTorrentEvent(event)
        })
    }

    async _loadPool(id: string) {
        // Get pool info.
        const poolInfo = await this.System.getPoolInfoBatch([id])
        const [[name, ticker]] = poolInfo
        const torrents = await getTorrentsForPool(this.System, id)
        return {
            id,
            name,
            ticker,
            torrents
        }
    }

    processPoolMember(event: any) {
        const { poolId: poolBN, isMember } = event.args
        const pool = poolBN.toString()
    }

    processTorrentEvent(event: any) {
        const { poolId: poolBN, exactTopic, uri, live } = event.args
        const pool = this.pools[poolBN.toString()]

        // TODO:axon verify exactTopic in URI
        const torrentsSet = new Set()
        pool.torrents.forEach((uri: string) => {
            torrentsSet.add(uri)
        })

        if (live) {
            torrentsSet.add(uri)
        } else {
            torrentsSet.delete(uri)
        }
        
        pool.torrents = Array.from(torrentsSet)
        this.pools[poolBN.toString()] = pool
        this.emit('update', this.pools)
    }
}

class TorrentEngine {
    public torrentClient: WebTorrent
    public torrents: Record<string, any>

    constructor(
        private stateEngine: StateEngine,
        private privateKey: string,
    ) {
        this.stateEngine = stateEngine
        this.torrentClient = new WebTorrent({
            ethereumWallet: privateKey,
            peerId: '1'.repeat(40),
            tracker: true,
            torrentPort: 24333,
        })
        this.torrents = {}
    }

    start() {
        this.stateEngine.on('update', (pools) => {
            debug('state update')
            const torrentURIs = new Set()

            Object.values(pools).forEach((pool: any) => {
                pool.torrents.forEach((uri: string) => {
                    torrentURIs.add(uri)
                })
            })

            // Stop torrents.
            for (let [uri, torrent] of Object.entries(this.torrents)) {
                if (!torrentURIs.has(uri)) {
                    // Stop torrent.
                    debug(`Stopping torrent: ${uri}`)
                    const torrent = this.torrentClient.remove(uri)
                }
            }

            // Start torrents.
            for (const uri of Array.from(torrentURIs)) {
                if (this.torrents[uri]) {
                    // debug(`Torrent already started: ${uri}`)
                    continue
                }

                debug(`Adding torrent: ${uri}`)
                const torrent = this.torrentClient.add(uri)
                this.torrents[uri] = torrent
            }
        })
    }
}



interface RunNodeArgs {
    torrentDataPath: string
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

    // const columns = 'Pool ID | Ticker | Name | Torrents'
    //     .split(' | ')
    
    // const poolSummaryTable = [columns]
    //     .concat(poolIds.map((id, i) => {
    //         let fields = [
    //             poolIds[i],
    //             poolInfos.tickers[i],
    //             poolInfos.names[i],
    //             torrentsForPools[i].length
    //         ]
    //         return fields
    //     }))

    // debug(table(poolSummaryTable))
    
    // debug(`\nLoading torrents for ${signer.address}`)

    debug(`Starting torrent client`)
    debug(`Torrent data path: ${argv.torrentDataPath}`)

    let stateEngine = new StateEngine(
        System,
        signer.address
    )

    let torrentEngine = new TorrentEngine(
        stateEngine,
        PRIVATE_KEY
    )
    torrentEngine.start()

    await stateEngine.load(await signer.getAddress())
    stateEngine.listen()
}