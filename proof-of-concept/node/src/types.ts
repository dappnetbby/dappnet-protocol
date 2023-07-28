import { ethers } from "ethers"

// Use .pop to get the latest.
export const MANIFEST_VERSIONS = [
    '0.1.0'
]

export const CONFIG_VERSIONS = [
    '0.1.0'
]


export interface AllerConfig {
    version: string
    ignore: string[]
    scripts: {
        initialize: InitializeScript | null
    }
}

// 
// Aller Script Runtime.
// 
export interface InitializeScript {
    (runtime: AllerScriptRuntime): Promise<void>
}

export interface EthersContractMod extends ethers.Contract {
    _name: string
}

export interface AllerScriptRunStepArgs {
    contract: EthersContractMod,
    read?: string,
    readArgs?: any[],
    // read: () => Promise<any>,
    // expect: (actual: any) => Promise<any>,
    stale?: (input: any) => Promise<boolean>,
    // write: () => Promise<void>
    write: string,
    writeArgs: any[],
}

export interface AllerScriptInitializeArgs {
    contract: EthersContractMod,
    args: any[],
}

export interface AllerScriptRuntime {
    targets: Targets
    contracts: Record<string, EthersContractMod>
    runStep: (args: AllerScriptRunStepArgs) => Promise<void>
    initialize: (args: AllerScriptInitializeArgs) => Promise<void>
}






export interface Manifest {
    version: string
    targets: Targets
    deployments: Deployment[]
    vendor: Record<string, VendoredContractInfo>
}

export interface Targets {
    system: Record<string, ContractInfo>
    user: Record<string, ContractInfo>
}

export interface VersionControlInfo {
    type: 'git' | 'none'
    tag: string
    branch: string
    dirty: boolean
    descriptor: string
}

export interface Deployment {
    id: number
    deployer: string
    rpcUrl: string
    chainId: string
    
    events: DeploymentEvent[]
    time: number
    
    // A tag from a version control system. For Git, this is a git hash.
    revision: VersionControlInfo

    // Internal/WIP.
    _complete: boolean
}

export type DeploymentEvent = UpsertAddressProvider | UpsertProxyEvent | DeployImplEvent | ImportAddressesEvent | RebuildCacheEvent | InitializeContractEvent

interface GenericContractDeployEvent {
    address: string
    abi: ethers.utils.Fragment[]
    deployTx: any

    bytecode: {
        object: string
        sourceMap: string
        linkReferences: any
    }
    metadata: any
}

export interface UpsertAddressProvider extends GenericContractDeployEvent {
    type: 'upsert_address_provider'
    target: 'AddressProvider'
    address: string
    abi: ethers.utils.Fragment[]
    deployTx: any
}

export interface UpsertProxyEvent extends GenericContractDeployEvent {
    type: 'upsert_proxy'
    abi: ethers.utils.Fragment[]
    deployTx: any
    target: string,
    proxyName: string,
    address: string
}

export interface DeployImplEvent {
    type: 'deploy_impl'
    abi: ethers.utils.Fragment[]
    deployTx: any
    target: string
    version: number
    address: string
    from_impl: string
    to_impl: string,

    bytecode: {
        object: string
        sourceMap: string
        linkReferences: any
    }
    metadata: any
}

export interface InitializeContractEvent {
    type: 'initialize_contract'
    target: string
    version: number
    tx: string
    calldata: string
}

export interface ImportAddressesEvent {
    type: 'import_addresses'
}

export interface RebuildCacheEvent {
    type: 'rebuild_cache'
}

export type DeploymentNamespace = 'system' | 'user'

export const EMPTY_MANIFEST: Manifest = {
    version: "0.1.0",
    targets: {
        system: {},
        user: {}
    },
    vendor: {},
    deployments: []
}

export interface ContractInfo {
    target: string
    version: number
    address: string
    abi: ethers.utils.Fragment[]
    bytecode: {
        object: string
        sourceMap: string
        linkReferences: any
    }
    metadata: any
    deployTx: ethers.Transaction & { blockNumber: number }
}

export interface VendoredContractInfo {
    target: string
    address: string
    abi: ethers.utils.Fragment[]
}

export interface EVMBuildArtifact {
    ast: {
        absolutePath: string
    }
    bytecode: {
        object: string
        sourceMap: string
        linkReferences: any
    }
    abi: ethers.utils.Fragment[]
}

// TODO refactor this, it's temporary
export interface AllerArtifact extends EVMBuildArtifact {
    contractName: string
    hasPreviousVersion: boolean
    shouldUpgrade: boolean
    previousDeployment: ContractInfo
    isModified: boolean
    isNew: boolean
    proxyIdentity: ContractInfo

    // We deploy if there is no previous deployment, or if we should upgrade.
    shouldDeploy: boolean
    metadata: any
}