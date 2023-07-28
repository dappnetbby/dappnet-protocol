import sqlite3 from 'sqlite3'
import { open } from 'sqlite'
// @ts-ignore
import contracts from './contracts.json' assert { type: "json" };
import ethers from 'ethers'

async function computeRewards() {
    const db = await open({
        filename: 'database.sqlite3',
        driver: sqlite3.Database
    })
    
    // Select all unique peer ids.
    const rows_uniquePeers = await db.all(`
        SELECT from_peer as peer, eth_wallet
        FROM peer_logs
        WHERE from_peer IS NOT NULL
        GROUP BY from_peer
    `)
    console.log(rows_uniquePeers)

    // Select all unique torrent ids.
    const rows_uniqueTorrents = await db.all(`
        SELECT torrent
        FROM peer_logs
        WHERE torrent IS NOT NULL
        GROUP BY torrent
    `)
    console.log(rows_uniqueTorrents)

    // Select all upload with matching download.
    // AND piece_size IS NOT NULL
    // AND piece_size = peer_logs.piece_size
    const rows_validUploads = await db.all(`
        SELECT from_peer, to_peer, piece, eth_wallet
        FROM peer_logs
        WHERE key = 'upload'
        AND from_peer IS NOT NULL
        AND to_peer IS NOT NULL
        AND torrent IS NOT NULL
        AND eth_wallet IS NOT NULL
        AND EXISTS (
            SELECT 1
            FROM peer_logs
            WHERE key = 'download'
            AND from_peer = peer_logs.from_peer
            AND to_peer = peer_logs.to_peer
            AND torrent = peer_logs.torrent
            AND piece = peer_logs.piece
        )
        GROUP BY piece
    `)
    console.log(rows_validUploads)

    const rows_validDownloads = await db.all(`
        SELECT from_peer, to_peer, piece, eth_wallet
        FROM peer_logs
        WHERE key = 'download'
        AND from_peer IS NOT NULL
        AND to_peer IS NOT NULL
        AND torrent IS NOT NULL
        AND eth_wallet IS NOT NULL
        AND EXISTS (
            SELECT 1
            FROM peer_logs
            WHERE key = 'download'
            AND from_peer = peer_logs.from_peer
            AND to_peer = peer_logs.to_peer
            AND torrent = peer_logs.torrent
            AND piece = peer_logs.piece
        )
        GROUP BY piece
    `)
    console.log(rows_validDownloads)

    let peerInfo: Record<string, any> = {}
    rows_uniquePeers.map(({ peer, eth_wallet }) => {
        peerInfo[eth_wallet] = {
            upload: 0,
            download: 0
        }
    })
    
    const PIECE_SIZE = 4096
    for (let upload of rows_validUploads) {
        peerInfo['' + upload.eth_wallet].upload += PIECE_SIZE
    }
    for (let download of rows_validDownloads) {
        peerInfo['' + download.eth_wallet].download += PIECE_SIZE
    }

    console.log(peerInfo)

    const totalUpload = Object.values(peerInfo).reduce((acc, { upload }) => acc + upload, 0)
    const totalDownload = Object.values(peerInfo).reduce((acc, { download }) => acc + download, 0)

    let rewardMatrix = []
    for (let peer_eth_wallet of Object.keys(peerInfo)) {
        const { upload, download } = peerInfo[peer_eth_wallet]
        // const reward = upload / totalUpload * download / totalDownload
        rewardMatrix.push({
            peer_eth_wallet,
            upload,
            download,
        })
    }

    const rewardMatrixData = {
        totalUpload,
        totalDownload,
        rewardMatrix
    }

    console.log(rewardMatrixData)
    
    const provider = new ethers.providers.JsonRpcProvider('http://localhost:8545')
    // 0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266
    const wallet = new ethers.Wallet('0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80', provider)

    const System = new ethers.Contract(
        contracts.System.address,
        contracts.System.abi,
        wallet
    )

    const POOL_ID = '1' // TODO:axon
    const tx = await System.updateWorkMatrix(
        POOL_ID,
        rewardMatrix.map(({ peer_eth_wallet }) => peer_eth_wallet),
        rewardMatrix.map(({ upload }) => upload),
    )

    await tx.wait(1)

    console.log('System.updateRewardsMatrix() tx:', tx)
}

computeRewards()

// Read the database.
// for each row:
//  (peer, torrent, upload, download) = reduce peers:
//    acc = 0
//    corroborate uploads:
//    valid_records = []
//    for each upload:
//      valid = if there is a matching download record, where the download.to_peer == upload.from_peer
//      if valid:
//        valid_records.push(upload)
//      acc += upload.piece_size
//    return [(peer, to_peer, upload=acc)]
// now we have accumualted the total upload for each peer, weight it using EBSL
// (belief=0.5, uncertainty=power_law(token_stake), prior=0.2)
// compute this inside a ZK-STARK proof or do it in cairo.
// submit it on-chain.
// 
// 