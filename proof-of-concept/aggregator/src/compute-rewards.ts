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