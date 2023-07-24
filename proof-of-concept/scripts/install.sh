#!/bin/bash
set -ex

cd aggregator/
npm i

cd axon-lib/
npm i

cd bittorrent-protocol/
npm i

cd bittorrent-tracker/
npm i

cd webtorrent/
npm i

cd webtorrent-cli/
npm i