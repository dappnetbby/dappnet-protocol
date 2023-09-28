
import { ethers } from 'ethers'
import { getTargetsFromEvents } from '../src/cmds/deploy'
import { Manifest } from '../src/types'

async function main() {
    const manifest: Manifest = {
        version: "0.1.0",
        targets: {
            system: {},
            user: {},
        },
        deployments: [
            {
                events: [
                    {
                        type: 'deploy_impl',
                        abi: [],
                        deployTx: {},
                        target: 'Token',
                        version: 1,
                        from_impl: ethers.constants.AddressZero,
                        to_impl: "0xd2983525E903Ef198d5dD0777712EB66680463bc",
                        address: "0xd2983525E903Ef198d5dD0777712EB66680463bc",
                        bytecode: {
                            object: "",
                            sourceMap: "",
                            linkReferences: {},
                        },
                        metadata: {},
                    }
                ]
            },
            {
                events: [
                    {
                        type: 'deploy_impl',
                        abi: [],
                        deployTx: {},
                        target: 'Token',
                        version: 2,
                        from_impl: "0xd2983525E903Ef198d5dD0777712EB66680463bc",
                        to_impl: "0x36B81ebd01C31643BAF132240C8Bc6874B329c4C",
                        address: "0x36B81ebd01C31643BAF132240C8Bc6874B329c4C",
                        bytecode: {
                            object: "",
                            sourceMap: "",
                            linkReferences: {},
                        },
                        metadata: {},
                    }
                ]
            }
        ]
    }

    const events = manifest.deployments
        .map(d => d.events)
        .flat();

    let x = getTargetsFromEvents(events)
    console.log(x)
}

main().catch(console.error)