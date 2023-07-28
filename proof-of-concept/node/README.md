axon-node
=========

Start a node, join pools, earn tokens for hosting torrents.

You can join/leave hosting pools through the dapp, and the node will listen for on-chain events in order to automatically seed torrents in your pools. The upload/download logs are sent to the aggregator, which computes the work matrix and posts it on-chain, so you can earn rewards.

## Roadmap.

### v1.

 - [ ] Automatically listen to pools joined/left by the user.
 - [x] Automatically start seeding torrents in these pools.
 - [x] Automatically torrent and untorrent based on on-chain events.

### v2.

 - [ ] Download initial file from Arweave.
 - [ ] Report capacity (disk space, bandwidth speed) to aggregator. Automatic price controller for "axon" resources.

## Usage.

```sh
DEBUG=axon:* DEV=1 PRIVATE_KEY="0x2ce6a49f7f57e1b93c91d56ea80bfe83448bade8fc5222e78a3c692947faa92e" node --experimental-modules bin/dappnet.js node --torrent-data-path $(realpath ./uploads)
```

## Demo.

```sh
DEBUG=axon:* ./seed.sh
```

## Configuration.

