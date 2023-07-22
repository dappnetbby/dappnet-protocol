
axon
====

Axon is a proof-of-concept protocol which allows anyone to summon BitTorrent swarms to host files.

By running an Axon node, you will earn tokens for hosting BitTorrent content, based on how much you upload.

Publishers can incent hosting rewards in their own token. For example, you can designate hosting rewards in $SNX.

## wen token?

\[[telegram](https://t.me/+Vr5fdICI1bI0Njk1)\]

## How it works.

In BitTorrent, nodes called peers share chunks of a torrent called pieces with other peers. They keep track of the upload/downloads for each peer they interact with, via an economic protocol called tit-for-tat. Tit-for-tat ensures that torrenting is positive-sum - peers who upload more will get higher better download too.

The BT ecosystem is suppored by trackers. Trackers are centralized servers which track which peers are part of a torrent swarm, as well as serve as a centralized authority of seed ratios (upload/download ratios). Peer discovery hapepns through trackers (centralized) and the Mainline DHT (decentralized) - meaning it is still robust against censorship. Trackers are a tradeoff of more trust for better performance.

We extend BitTorrent in the following ways:

 - Axon protocol allows anyone to create permissionless on-chain pools for incentivising torrent swarms to seed content.
 - An Axon pool consists of a set of tokens (the hosting rewards) and a custom distribution function, which are distributed to peers based on the reward matrix.
 - The reward matrix is computed by an off-chain entity called the aggregator.
   - The aggregator receives upload/download logs from BitTorrent peers and trackers. It combines these logs using ML to determine a reward distribution for a hosting epoch.
   - It then generates a ZK-STARK which proves this computation, and then posts it on-chain.

## why not arweave/filecoin?

Axon complements them. Arweave/Filecoin are good at data storage, though aren't as performant as BitTorrent for data sharing. BitTorrent swarms, while making no guarantees about data storage, are much more scalable when it comes to sharing large data sets worldwide - since anyone can join as a server.

## Technical proof-of-concept.

 - [ ] Modify webtorrent [bittorrent-tracker](https://github.com/webtorrent/bittorrent-tracker) and [node](https://github.com/webtorrent/webtorrent):
   - [ ] register public/private keypair for receiving rewards.
   - [ ] log upload/downloads to disk (signed).
 - [ ] Aggregator 
   - [ ] weight upload/download logs by uncertainty using ML/EBSL/EigenTrust.
   - [ ] compute reward matrix from upload/download logs.
   - [ ] generate ZK proof of claim
   - [ ] submit on-chain
 - [ ] Protocol
   - [ ] create hosting pool for a single torrent hash
   - [ ] stake token rewards
   - [ ] claim rewards
 - [ ] Axon Desktop client
   - [ ] Runs a torrent client + axon node automatically.
   - [ ] Allows user to simply "join/leave" swarms for different content.
   - [ ] Allows user to hit one button to "claim" rewards.




