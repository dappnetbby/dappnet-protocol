import { runNode } from "./cmds/run_node"
import { DEFAULT_CONFIG_FILE, DEFAULT_MANIFEST_FILE } from "./config"

const yargs = require('yargs/yargs')
const { hideBin } = require('yargs/helpers')

yargs(hideBin(process.argv))
    .scriptName("niacin")
    .usage('$0 <cmd> [args]')
    .coerce('_', (arg: any) => arg)
    // @ts-ignore
    .command('node', 'runs the dappnet node', (yargs) => {
        return yargs
            .option('torrent-data-path', {
                required: true,
                type: 'string',
                description: 'path to the torrent data directory',
            })
    }, runNode)
    .help()
    .demandCommand()
    .parse()