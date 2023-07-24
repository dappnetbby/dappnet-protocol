#!/bin/bash
set -ex

cd axon-lib/
npm link

cd ../bittorrent-protocol
npm link

cd ../webtorrent
npm link bittorrent-protocol axonproto-lib
npm link

cd ../webtorrent-cli
npm link webtorrent