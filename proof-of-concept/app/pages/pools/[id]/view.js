import Head from 'next/head';
import { useEffect, useMemo, useState } from 'react';
import { AppLayout } from '../../../components/layout';
import styles from '../../../styles/Pool.module.css';
import layoutStyles from '../../../styles/Layout.module.css';

import { useAccount, useClient, useContractWrite, usePrepareContractWrite, useProvider, useSigner, useWaitForTransaction } from 'wagmi';
import { getContract } from '@wagmi/core';
import Header from '../../../components/header';
import { useDebounce } from '../../../components/util';
import { ethers } from 'ethers';
import { hardhat, polygon } from 'wagmi/chains';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Image from 'next/image';
import NoSSR from 'react-no-ssr';

import { 
    VscCloudDownload,
    VscCloudUpload
} from "react-icons/vsc";
import { SimpleLineChart } from '../../../components/chart'


import deployments from '../../../chain/deployments/local.json'

const byteSize = require('byte-size')


import { readContract } from '@wagmi/core'
import { multicall, watchMulticall, watchContractEvent } from '@wagmi/core'
import { createPublicClient, http, parseAbiItem } from 'viem'
import classNames from 'classnames';

import parseTorrent from 'parse-torrent'
import { AGGREGATOR_SERVER } from '../../../common/config';

export const publicClient = createPublicClient({
    chain: hardhat,
    transport: http()
})


function UI({ id }) {
    const account = useAccount()
    const { data: signer, isError, isLoading } = useSigner()
    const provider = useProvider()
    const router = useRouter()

    const [isMember, setIsMember] = useState(false)
    const [pool, setPool] = useState({
        id: 0,
        name: "Pool 0",
        ticker: "POOL0",
        description: "Yo man this is the pool for hosting dumb jpegs in.",
        torrents: [
        ],
        files: [
            {
                infohash: "",
                name: "sintel.mp4"
            }
        ],
        numMembers: 0,
        members: [
            {},
            {},
        ],
        admin: "0x" + "0".repeat(40),
        rewardModule: null,
    })

    // Upload measured in bytes.
    const [upload, setUpload] = useState(0)
    // Rewards measured in ether (18 decimals).
    const [rewards, setRewards] = useState(0)

    useEffect(() => {
        if (!account.address) return
        if (!pool.rewardModule) return

        // Long poll the API server to get the upload/download.
        const interval = setInterval(async () => {
            const response = await fetch(`${AGGREGATOR_SERVER}/upload-stats?node_id=${account.address}`)
            const json = await response.json()

            // Calculate unclaimed rewards.
            const RewardsModule = new ethers.Contract(
                pool.rewardModule,
                [
                    `function unclaimedRewards(address account, uint256 upload) external view returns (uint256)`
                ],
                provider
            )

            const rewardsBN = await RewardsModule.unclaimedRewards(account.address, json.upload)

            setUpload(json.upload)
            setRewards(rewardsBN.toString())
        }, 1000)

        return () => clearInterval(interval)
    }, [pool.rewardModule, account.address])

    
    useEffect(() => {
        (async function() {
            const poolId = '0' // TODO:axon

            const [
                name,
                ticker,
                description,
                owner,
                numTorrents,
                numMembers,
                rewardModule,
            ] = await readContract({
                address: deployments.System.address,
                abi: deployments.System.abi,
                functionName: 'getPoolInfo',
                args: [poolId],
            })

            const isMember = await readContract({
                address: deployments.System.address,
                abi: deployments.System.abi,
                functionName: 'isMember',
                args: [poolId, account.address],
            })


            // Now load all the torrent events for the pool.
            const logs = await publicClient.getLogs({
                address: deployments.System.address,
                event: parseAbiItem('event Torrent(uint256 indexed poolId, bytes32 indexed exactTopic, string uri, bool live)'),
                fromBlock: 0n,
                toBlock: 'latest'
            })
            
            const torrentURIs = new Set()
            logs.forEach(event => {
                const { exactTopic, uri, live } = event.args
                // TODO:axon verify exactTopic in URI
                if (live) torrentURIs.add(uri)
                else torrentURIs.delete(uri)
            })

            setPool({
                ...pool,
                name,
                ticker,
                admin: owner,
                description,
                numTorrents: numTorrents.toNumber(),
                numMembers: numMembers.toNumber(),
                rewardModule,
                torrents: [...torrentURIs],
            })
            setIsMember(isMember)
            console.log('isMember', isMember)

            const System = new ethers.Contract(
                deployments.System.address,
                deployments.System.abi,
                provider
            )

            // WORKAROUND: ethers.js replaying events from 1 block in the past on Hardhat
            // https://github.com/ethers-io/ethers.js/discussions/1939 
            const startBlockNumber = await provider.getBlockNumber();
            const isEventInPast = (event) => {
                if (event.blockNumber <= startBlockNumber) return true;
                return false
            }

            System.on('PoolMember', (poolId, member, isMember, event) => {
                if (isEventInPast(event)) return

                console.log('PoolMember', {poolId, member, isMember})

                if(member == account.address) {
                    setIsMember(isMember)
                }
            })
        })()
    }, [])

    const shortenAddress = (address) => {
        return address.slice(0, 6) + "..." + address.slice(-4)
    }

    const ui = (
        <div className={layoutStyles.container}>
            <Head>
                <title>{pool.name} &middot; axon</title>
                <link rel="icon" href="/favicon.ico" />
            </Head>

            <Header />

            <main className={layoutStyles.main}>
                <header>
                    <div className={layoutStyles.backTo} onClick={() => router.push('/pools')}>
                        <Image src="/back.png" width={48} height={48} />
                        <span> Back to <Link href="/pools/">pools</Link></span>
                    </div>
                </header>

                <div className={styles.poolOverview}>
                    <span className={styles.poolName}>{pool.name}</span>
                    {/* <span className={styles.poolTicker}>${pool.ticker}</span> */}
                    <span className={styles.poolDescription}>{pool.description}</span><br />
                    <span className={styles.poolMeta}>
                        <span className={styles.poolTicker}>${pool.ticker}</span>
                        &nbsp;&nbsp;&middot;&nbsp;&nbsp;
                        <span>Created by {shortenAddress(pool.admin)}</span>
                        &nbsp;&nbsp;&middot;&nbsp;&nbsp;
                        {/* <span>{pool.members.length} members</span> */}
                        <span>{pool.numMembers} members</span>
                        &nbsp;&nbsp;&middot;&nbsp;&nbsp;
                        <span>{pool.numTorrents} torrents</span>
                    </span>
                </div>

                <div className={styles.details1}>
                    <div className={styles.poolChart}>
                        <header>
                            <span>
                                <VscCloudDownload />
                                Downloads
                            </span>
                        </header>
                        <p>How much people are downloading this dataset. More downloads = more rewards.</p>
                        <NoSSR>
                            <div className={styles.poolChartContainer}>
                                <SimpleLineChart />
                            </div>
                        </NoSSR>
                    </div>

                    <div className={styles.poolStats}>
                        <div>
                            <header style={{ fontSize: "1.4rem", marginBottom: "1rem" }}>
                                <VscCloudUpload />
                                Uploads
                            </header>
                            <p>Run an axon node to earn rewards from serving downloaders.</p>
                        </div>

                        <div className={styles.statDetail}>
                            <header>Your Upload</header>
                            <span>{byteSize(upload).toString()}</span>
                        </div>
                        <div className={styles.statDetail}>
                            <header>Rewards</header>
                            <span>{rewards} ${pool.ticker}</span>
                        </div>
                        <div>
                            <button 
                                className={styles.btn} 
                                disabled={isMember == false}
                            >
                                Claim
                            </button>&nbsp;
                            
                            <JoinLeaveButton poolId={pool.id} isMember={isMember}/>
                        </div>
                    </div>

                </div>

                <div className={styles.poolFiles}>
                    <h2>Files</h2>
                    <div>
                        <table className={styles.poolFilesTable}>
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Torrent</th>
                                </tr>
                            </thead>
                            <tbody>
                                {
                                    pool.torrents.map((torrent, i) => {
                                        // Parse torrent URI
                                        // Extract the dn parameter.
                                        const url = new URL(torrent)
                                        const dn = url.searchParams.get('dn')
                                        const xt = url.searchParams.get('dn')
                                        const downloadHref = `/pools/${id}/download?magnet_uri=${encodeURIComponent(torrent)}&poolLabel=${encodeURIComponent(pool.ticker)}`
                                        // console.log(parsed)

                                        return <tr key={i}>
                                            <td>{dn}</td>
                                            <td>
                                                <button className={styles.btn} onClick={() => router.push(downloadHref)}>
                                                    View
                                                </button>
                                                {/* <Link href={}>View file</Link> */}
                                            </td>
                                        </tr>
                                    })
                                }
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* <div className={styles.poolDetailCard}>
                    <h2>Peers</h2>
                </div>

                <div className={styles.poolDetailCard}>
                    <h2>Files</h2>
                    <div></div>    
                </div> */}
            </main>
        </div>
    )

    return ui
}

const JoinLeaveButton = (props) => {
    const { poolId, isMember } = props
    
    const account = useAccount()
    const { data: signer, isError } = useSigner()

    const { config } = usePrepareContractWrite({
        address: deployments.System.address,
        abi: deployments.System.abi,
        functionName: 'joinLeavePool',
        args: [poolId, !isMember]
    })

    const { data, write, isLoading: isWriteLoading } = useContractWrite(config)
    const { isLoading: isTxConfirming, isSuccess, data: txReceipt } = useWaitForTransaction({
        hash: data && data.hash,
    })

    const onClick = async () => {
        await write()
    }

    return <button
        className={classNames(
            styles.btn,
            {
                [styles.btnLoading]: isTxConfirming
            }
        )}
        onClick={onClick}
        disabled={isWriteLoading || isTxConfirming}
    >
        {isMember ? "Leave" : "Join"}
    </button>
}

const PoolCard = ({ id, name, ticker, description }) => {
    const router = useRouter()
    return <div className={styles.poolCard} onClick={() => router.push(`/pools/${id}/view`)}>
        <header>
            <span className={styles.poolName}>{name}</span>
            <span className={styles.poolTicker}>${ticker}</span>
        </header>
    </div>
}


UI.getInitialProps = async ({ query }) => {
    const { id } = query
    return { id }
}

UI.layout = AppLayout
export default UI
