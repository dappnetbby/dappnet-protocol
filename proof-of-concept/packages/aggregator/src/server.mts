import express from 'express';
import sqlite3 from 'sqlite3'
import { open } from 'sqlite'
import { computeRewardsMatrix } from './matrix.js';

/**
 * API DESIGN.
 * - getStats(node_id, pool_id, node_auth_proof) -> (torrent, upload, download, last_seen)
 * - getDnStats(torrent_id, time_range) -> ([t, dn])
 */

const app = express();
import cors from 'cors';

app.use(cors())

app.get('/upload-stats', async (req, res, next) => {
    const { node_id, pool_id, node_auth_proof } = req.query;

    // open the database.
    const db = await open({
        filename: 'database.sqlite3',
        driver: sqlite3.Database
    })

    const {
        totalUpload,
        totalDownload,
        rewardMatrix
    } = await computeRewardsMatrix(db);

    
    // DEMO: For the demo, we are only computing for one pool.


    // Get the node-specific data.
    const record = rewardMatrix
        .find(({ peer_eth_wallet }) => {
            return peer_eth_wallet === node_id
        })
    
    if(!record) {
        return res.send({ 
            // error: "Node not found in reward matrix." 
            upload: 0,
            download: 0,
        })
    }

    const { upload, download } = record;

    res.send({
        upload,
        download,
    })
})

app.get('/download-stats', async (req, res) => {
    const { torrent_id } = req.query;

    // open the database.
    const db = await open({
        filename: 'database.sqlite3',
        driver: sqlite3.Database
    })

    // search all rows
    const rows = await db.all(`
        SELECT SUM(piece) as total_pieces
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
})


const port = process.env.PORT || 24338;
app.listen(port, () => {
    console.log(`API server listening on port http://0.0.0.0:${port}`)
})