let client
export const getWebTorrentClient = async () => {
    if (!client) {
        console.log('WebTorrent', WebTorrent)
        client = new WebTorrent()
    }
    return client
}
