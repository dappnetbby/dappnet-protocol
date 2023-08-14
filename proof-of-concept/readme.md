proof of concept
================

This is a proof-of-concept of the Axon Protocol for Dappnet.

Work-in-progress. See [../README.md](../README.md) for tasks.

The protocol is written in Solidity, using Forge and Niacin for deployment.

The BitTorrent node and aggregator communicate via libp2p, E2E encrypted.

The basic flow of this demo:

 1. Create a pool by calling `System.createPool`.
 2. Add a torrent to it.
 3. BitTorrent nodes automatically join the pool and start seeding.
 4. They report their uploads/downloads to the aggregator.
 5. The aggregator validates these contributions, computes the reward matrix, and posts it on chain.
 6. Nodes listen for the `RewardsUpdate` event to check their rewards.


### Layout

```py
aggregator             # Aggregator. Receives logs from BitTorrent peers over libp2p.

axon-lib               # Axon logic to integrate into BitTorrent node software.

bittorrent-protocol    # BitTorrent wire protocol.
webtorrent             # BitTorrent business logic.
webtorrent-cli         # CLI for running BitTorrent node.
  ./seed.sh            # Seeds a torrent, sending upload logs to aggregator.
  ./download.sh        # Downloads a torrent, sending download logs to aggregator.

protocol               # Solidity smart contracts.

scripts/
  ./link.sh            # Links the axonprotocol-lib, bittorrent-protocol, webtorrent, and webtorrent-cli together for NPM.
```

### Setup.

```sh
```

### Protocol.

```sh
cd protocol
forge build
./deploy.sh anew
```