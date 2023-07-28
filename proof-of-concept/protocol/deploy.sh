#!/bin/bash

set -ex

niacin deploy -y System

DEV=1 niacin generate-npm-pkg --json > deployments/local.json
DEV=1 niacin generate-npm-pkg --json > ../aggregator/src/contracts.json
DEV=1 niacin generate-npm-pkg --json > ../axon-lib/src/contracts.json
DEV=1 niacin generate-npm-pkg --json > ../node/src/contracts.json

# forge script --gas-estimate-multiplier 200 --rpc-url "http://localhost:8545" --broadcast --sender 0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266 --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 script/Init.s.sol