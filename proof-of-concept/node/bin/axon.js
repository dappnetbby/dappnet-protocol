#!/usr/bin/env node
if(process.env.DEV) require('../build/axon')
else require('../build/axon')