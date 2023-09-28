#!/bin/bash
set -ex

# Usage: ./scripts/run.sh [node | api]
type=$1

# case: "node"
if [ $type == "node" ]; then
    node --experimental-modules build/index.mjs
fi

# case: "api"
if [ $type == "api" ]; then
    node --experimental-modules build/server.mjs
fi