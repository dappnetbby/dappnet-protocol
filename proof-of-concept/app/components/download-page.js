import Head from 'next/head';
import { useEffect, useMemo, useState } from 'react';
import { AppLayout } from './components/layout';
import styles from '../../../../../styles/Pool.module.css';
import layoutStyles from '../../../../../styles/Layout.module.css';

import { useAccount, useClient, useContractWrite, usePrepareContractWrite, useProvider, useSigner, useWaitForTransaction } from 'wagmi';
import { getContract } from '@wagmi/core';
import Header from '../../../../../components/header';
import { useDebounce } from '../../../../../components/util';
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
import { SimpleLineChart } from '../../../../../components/chart'
import deployments from '../../../../../chain/deployments/local.json'

const byteSize = require('byte-size')
import { readContract } from '@wagmi/core'
import { multicall, watchMulticall, watchContractEvent } from '@wagmi/core'
import { createPublicClient, http, parseAbiItem } from 'viem'
import classNames from 'classnames';




function UI({ id }) {
    const account = useAccount()
    const { data: signer, isError, isLoading } = useSigner()
    const provider = useProvider()
    const router = useRouter()
    

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
                    <h2>Downloading files...</h2>

                    <NoSSR>
                        <TorrentDownloader />
                    </NoSSR>
                </div>
            </main>
        </div>
    )

    return ui
}

const TorrentDownloader = () => {
    console.log(webtorrent)

    useEffect(() => {
        async function loadWebTorrent() {
            // const WebTorrent = (await import('webtorrent')).default
            console.log(WebTorrent)
        }

        loadWebTorrent()
    }, [])

    return <div>
    </div>
}

UI.getInitialProps = async ({ query }) => {
    const { id } = query
    return { id }
}

UI.layout = AppLayout

export default UI
