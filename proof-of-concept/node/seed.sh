#!/bin/bash
set -ex

# 0x2ce6a49f7f57e1b93c91d56ea80bfe83448bade8fc5222e78a3c692947faa92e
DEV=1 PRIVATE_KEY="0x2ce6a49f7f57e1b93c91d56ea80bfe83448bade8fc5222e78a3c692947faa92e" node --experimental-modules bin/dappnet.js node --torrent-data-path $(realpath ./uploads)
