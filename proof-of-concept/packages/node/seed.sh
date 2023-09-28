#!/bin/bash
set -ex

export DEV=1 
export PRIVATE_KEY="0x2ce6a49f7f57e1b93c91d56ea80bfe83448bade8fc5222e78a3c692947faa92e" 

# Allow discovery.
# export AXON_TEST_NO_DISCOVERY=0
# export DEBUG=axon:*,webtorrent:*,bittorrent-protocol:*
# export DEBUG=axon:*,webtorrent:*
export DEBUG=axon:*

node --experimental-modules bin/axon.js node --torrent-data-path $(realpath ./uploads) --torrent-port 24333
