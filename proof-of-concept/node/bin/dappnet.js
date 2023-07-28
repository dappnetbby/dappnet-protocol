#!/usr/bin/env node
if(process.env.DEV) require('../build/dappnet')
else require('../dist/dappnet')