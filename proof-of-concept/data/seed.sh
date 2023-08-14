file=$1
echo seeding $file

# Seeds a torrent file using webtorrent-hybrid, which can be downloaded via in-browser WebRTC peers and regular TCP/UDP clients.
DEBUG=webtorrent:* npx webtorrent-hybrid seed --keep-seeding --announce "udp://tracker.opentrackr.org:1337/announce" --announce "wss://tracker.openwebtorrent.com" $file --verbose -q