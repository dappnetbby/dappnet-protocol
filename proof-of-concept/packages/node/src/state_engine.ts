import * as ethers from 'ethers';
import path from 'path';
import debugLib from 'debug';
import EventEmitter from 'events';
const __dirname = path.dirname(__filename);
const debug = debugLib('axon:node')

const parseExtraTopic = (xtBytes: string) => {
    // 256 - 160 = 96
    // 96/4 = 24
    // split 24 chars
    // 0x89a3c475e1dfa91a05e7dcb50fe7f77ea2f79f28000000000000000000000000
    // 89a3c475e1dfa91a05e7dcb50fe7f77ea2f79f28 // 160 bits // 20 bytes
    return xtBytes.slice(2, 64 - 22)
}

// Torrent(uint256 indexed poolId, string indexed exactTopic, string uri, bool live);
const getTorrentsForPool = async (System: ethers.Contract, poolId: string) => {
    const torrentEvents = await System.queryFilter(
        System.filters.Torrent(poolId, undefined, undefined),
        0, 
        'latest'
    )
    if(!torrentEvents) throw new Error("Unexpected")

    console.log(torrentEvents)
    const torrents: Record<string, TorrentRecord> = {}

    torrentEvents.forEach(event => {
        const { exactTopic: xtBytes, uri, live } = event.args!
        const exactTopic = parseExtraTopic(xtBytes)
        torrents[exactTopic as string] = {
            exactTopic,
            uri,
            live
        }
    })

    return Object.values(torrents)
}

export interface State {
    pools: Record<string, Pool>
}

export interface Pool {
    poolId: string
    name: string
    ticker: string
    isMember: boolean
    torrents: TorrentRecord[]
}

export interface TorrentRecord {
    exactTopic: string
    uri: string
    live: boolean
}


// The state engine connects to the on-chain protocol, loads past and incoming events,
// and produces a state object that can be used by the torrent engine.
// 
// It handles:
// - pool membership
// - torrents added/removed from pools
// 
export class StateEngine extends EventEmitter implements State {
    public pools: Record<string, Pool>

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
        debug(`System: ${System.address}`)
        
        // Now load all events and reduce them into the pools a user should be a part of.
        debug(`Loading pools for ${this.account}`)

        // event PoolMember(uint256 indexed poolId, address indexed account, bool isMember);
        const events = await System.queryFilter(System.filters.PoolMember(null, this.account))
        if(!events) throw new Error("Unexpected")

        console.log(events.map(ev => ev.args))

        // console.log(events[0].args)
        debug(`Found ${events.length} events`)


        // Pools
        const poolIds = new Set()
        // @ts-ignore
        events.reduce((acc, event) => {
            const { poolId: poolBN, isMember } = event.args!
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
        const poolIdsArray = Array.from(poolIds) as string[]
        const poolInfos = await System.getPoolInfoBatch(poolIdsArray)

        // Now load all torrents for all pools.
        debug("Loading torrents for pools")
        const torrentsForPools = await Promise.all(
            poolIdsArray.map(poolId => getTorrentsForPool(System, poolId))
        )
        debug('torrentsForPools', torrentsForPools)

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
                torrents: torrentsForPools[i],
                isMember: true
            }
        })

        this.pools = poolsData

        this.emit('update', this.pools)
    }

    async listen() {
        const logEvent = (eventLog: ethers.Event) => {
            const { event, args } = eventLog
            debug('event', event)
        }

        // WORKAROUND: ethers.js replaying events from 1 block in the past on Hardhat
        // https://github.com/ethers-io/ethers.js/discussions/1939 
        const startBlockNumber = await this.System.provider.getBlockNumber();
        const isEventInPast = (event: any) => {
            if (event.blockNumber <= startBlockNumber) return true;
            return false
        }

        // Listen for changes in the state.
        this.System.on('PoolMember', () => {
            // @ts-ignore
            const event = Array.from(arguments).pop()
            if (isEventInPast(event)) return

            debug('event', 'PoolMember')
            this.processPoolMember(event)
        })

        this.System.on('Torrent', () => {
            // @ts-ignore
            const event = Array.from(arguments).pop()
            if (isEventInPast(event)) return

            // TODO: filter
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

    async processPoolMember(event: any) {
        // event PoolMember(uint256 indexed poolId, address indexed account, bool isMember);
        const { poolId: poolBN, isMember, account } = event.args
        const pool = poolBN.toString()
        
        // If this is not the user we are tracking, ignore.
        if (account !== this.account) return

        const { System } = this
        const poolId = poolBN.toNumber()

        if (isMember) {
            debug(`User joined pool ${poolId}`)
            const poolInfos = await System.getPoolInfoBatch([poolBN])
            const torrents = await getTorrentsForPool(System, poolId)

            const [
                name,
                ticker,
            ] = [
                poolInfos.names[0],
                poolInfos.tickers[0],
            ];

            this.pools[poolId] = {
                poolId,
                name,
                ticker,
                isMember: true,
                torrents: torrents,
            }
        } else {
            debug(`User left pool ${poolId}`)
            this.pools[poolId] = {
                ...this.pools[poolId],
                isMember: false,
            }
        }

        this.emit('update', this.pools)
    }

    processTorrentEvent(event: any) {
        const { poolId: poolBN, exactTopic: xtBytes, uri, live } = event.args
        const exactTopic = parseExtraTopic(xtBytes)
        const pool = this.pools[poolBN.toString()]

        if (!pool) {
            debug(`Pool ${poolBN.toString()} not found`)
            return
        }
        
        // Update the pool torrent.
        pool.torrents[exactTopic] = {
            exactTopic,
            uri,
            live
        }

        this.pools[poolBN.toString()] = pool
        this.emit('update', this.pools)
    }
}
