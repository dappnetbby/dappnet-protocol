import Head from 'next/head';
import { useEffect, useState } from 'react';
import { AppLayout } from '../../components/layout';
import styles from '../../styles/Home.module.css';
import layoutStyles from '../../styles/Layout.module.css';

import { useAccount, useContractWrite, usePrepareContractWrite, useSigner, useWaitForTransaction } from 'wagmi';
import { getContract } from '@wagmi/core';
import Header from '../../components/header';
import { useDebounce } from '../../components/util';
import { ethers } from 'ethers';
import { polygon } from 'wagmi/chains';
import Link from 'next/link';
import { useRouter } from 'next/router';

/*
UI
*/

const compose = (...fns) => x => fns.reduceRight((y, f) => f(y), x);
const slugify = require('slugify')

function UI() {
    const account = useAccount()
    const { data: signer, isError, isLoading } = useSigner()

    let pools = [
        {
            id: 0,
            name: "Pool 0",
            ticker: "POOL0",
        },
        {
            id: 1,
            name: "Pool 1",
            ticker: "POOL0",
        },
        {
            id: 2,
            name: "Pool 2",
            ticker: "POOL0",
        }
    ]

    const ui = (
        <div className={layoutStyles.container}>
            <Head>
                <title>how to run a node &middot; axon</title>
                <meta name="description" content="some people are earning tokens for file-sharing tn, do you wanna come along?" />
                <link rel="icon" href="/favicon.ico" />
            </Head>

            <Header />

            <main className={layoutStyles.main}>
                <p>To start earning tokens in pools, you must run a node. The Axon node is a modified BitTorrent node that reports its work to the P2P network.</p>
                <p><strong>Anyone can run an Axon node</strong>. Even on your Macbook.</p>
                <p>Setup guide:</p>
                <ol>
                    <li>
                        <p>Install the axon-node software using NPM.</p>
                        <pre>
npm i -g axon-node
                        </pre>
                    </li>
                    <li>
                        <p>Run the node.</p>
<pre>
{`DEV=1 PRIVATE_KEY="0x8888888888888" axon-node node --torrent-data-path $(realpath ./uploads)`}
</pre>
                    </li>
                </ol>
                <p>Your node will automatically learn which pools you have joined, and start seeding their torrents. From there, you can use the Axon dapp to join/leave pools and claim token rewards.</p>
            </main>
        </div>
    )

    return ui
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

UI.layout = AppLayout
export default UI
