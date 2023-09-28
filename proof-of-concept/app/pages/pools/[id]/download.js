'use client';
/* eslint-disable @next/next/no-img-element */
import Head from 'next/head';
import { useEffect, useMemo, useState } from 'react';
import { AppLayout } from '../../../components/layout';
import styles from '../../../styles/Pool.module.css';
import layoutStyles from '../../../styles/Layout.module.css';
import Header from '../../../components/header';

import { useAccount, useClient, useContractWrite, usePrepareContractWrite, useProvider, useSigner, useWaitForTransaction } from 'wagmi';
import { getContract } from '@wagmi/core';
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

const byteSize = require('byte-size')
import { readContract } from '@wagmi/core'
import { multicall, watchMulticall, watchContractEvent } from '@wagmi/core'
import { createPublicClient, http, parseAbiItem } from 'viem'
import classNames from 'classnames';
import { useRef } from 'react';
import dynamic from 'next/dynamic'
import Script from 'next/script'
import parseTorrent from 'parse-torrent'
import { getWebTorrentClient } from '../../../common/torrenting';



let torrent$


async function loadWebTorrent({ magnet_uri, setDLProgress, el, el_video }) {
    // Load WebTorrent from the <head> in _app.js.
    // This is because I haven't figured out how to get it to play nicely with Next's webpack transpilation system.
    
    // console.log(import('webtorrent'))

    // const WebTorrent = await import('webtorrent')
    // const WebTorrent = require('webtorrent')
    console.log('WebTorrent', WebTorrent)

    console.log(WebTorrent)
    const client = await getWebTorrentClient()

    console.log(magnet_uri)

    if(client.get(magnet_uri)) {
        console.log('Torrent already exists')
        return
    }

    // Source: https://cdn.jsdelivr.net/npm/webtorrent@2.1.25/dist/sw.min.js
    const webtorrentServiceWorkerPath = "/webtorrent/sw.min.js"
    console.log('client', client)
    
    // client.createServer({ controller })
    // , { scope: './' }
    // navigator.serviceWorker.register(webtorrentServiceWorkerPath).then(reg => {
    //     const worker = reg.active || reg.waiting || reg.installing
    //     function checkState(worker) {
    //         if (!worker.state == 'activated') return
    //         // return worker.state === 'activated' && client.createServer({ controller: reg }) && download()
    //         download(reg)
    //     }
    //     if (!checkState(worker)) {
    //         worker.addEventListener('statechange', ({ target }) => checkState(target))
    //     }
    // })
    download()

    function download() {
        const torrent = client.add(
            magnet_uri,
            // "magnet:?xt=urn:btih:9b3d43a4f63f6a4b8e399e8d869db20f38647cd3&dn=imlovingit.jpeg&tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337%2Fannounce&tr=wss%3A%2F%2Ftracker.openwebtorrent.com" 
            torrent => {
                // Torrents can contain many files. Let's use the .mp4 file
                const file = torrent.files.find(file => file.name.endsWith('.mp4'))
                console.log(torrent.files)
                if (!file) return

                // Log streams emitted by the video player
                // file.on('stream', ({ stream, file, req }) => {
                //     if (req.destination === 'video') {
                //         console.log(`Video player requested data from ${file.name}! Ranges: ${req.headers.range}`)
                //     }
                // })

                // Stream to a <video> element by providing an the DOM element
                // file.streamTo(el_video.current)
                console.log('Ready to play!')
                file.renderTo("#video-container", {}, () => {
                    console.log("Ready to play!");
                });
            }
        )

        console.log(`torrent`, torrent)
        // torrent.createServer({ controller: reg })


        torrent$ = torrent

        const interval = setInterval(() => {
            let entries = [
                ['progress', (torrent.progress * 100).toFixed(1) + '%'],
                ['peers', torrent.numPeers],
                ['downloaded', byteSize(torrent.downloaded)]
            ]
            const s = entries.map(([key, value]) => `${key}: ${value}`).join(', ')
            const o = entries.reduce((o, [key, value]) => ({ ...o, [key]: value }), {})
            console.log(s)
            setDLProgress(o)
        }, 1000) // lel

        console.log('Client is downloading:', torrent.infoHash)

        torrent.on('done', async () => {
            console.log('Progress: 100%')
            clearInterval(interval)
            setDLProgress({
                progress: 100,
                peers: torrent.numPeers,
                downloaded: byteSize(torrent.downloaded)
            })

            // Render all files into to the page
            for (const file of torrent.files) {
                try {
                    file.getBlobURL(function (err, url) {
                        if (err) return console.log(err)

                        // if file name matches an image regex
                        const imageRegex = /\.(gif|jpe?g|tiff?|png|webp|bmp)$/i
                        if (file.name.match(imageRegex)) {
                            const img = document.createElement('img')
                            img.src = url
                            el.current.appendChild(img)
                        } else {
                            var a = document.createElement('a')
                            a.target = '_blank'
                            a.download = file.name
                            a.href = url
                            a.textContent = 'Download ' + file.name
                            el.current.appendChild(a)
                        }
                    })
                } catch (err) {
                    if (err) console.error(err.message)
                }
            }
        })
    }

}

function UI({ poolId, torrent, magnet_uri, poolLabel }) {
    const account = useAccount()
    const { data: signer, isError, isLoading } = useSigner()
    const provider = useProvider()
    const router = useRouter()

    const [browserLoad, setBrowserLoad] = useState(false)
    const [dlProgress, setDLProgress] = useState({
        progress: 0,
        peers: 0,
        downloaded: "0 kB"
    })

    const el = useRef(null);
    const el_video = useRef(null);

    const [magnetObj, setMagnetObj] = useState(null)

    useEffect(() => {
        async function x() {
            // Parse the magnet URI.
            const parsed = await parseTorrent(magnet_uri)
            console.log('parsed', parsed)
            setMagnetObj(parsed)
        }
        x()
    }, [])

    useEffect(() => {
        if (typeof window === 'undefined') return
        if (process.browser === false) return
        if (browserLoad) return

        setBrowserLoad(true)
        
        loadWebTorrent({
            magnet_uri, setDLProgress, el, el_video
        })
    }, [browserLoad, magnet_uri, setDLProgress, el, el_video])

    let trackers = []
    if (magnetObj) {
        trackers = magnetObj.tr
    }

    const ui = (
        <div className={layoutStyles.container}>
            <Head>
                <title>download &middot; axon</title>
                <link rel="icon" href="/favicon.ico" />
            </Head>

            <Header />

            <main className={layoutStyles.main}>
                <header>
                    <div className={layoutStyles.backTo} onClick={() => router.push(`/pools/${poolId}/view`)}>
                        <Image src="/back.png" width={48} height={48} />
                        <span> Back to <strong>${poolLabel}</strong></span>
                    </div>
                </header>

                <div className={styles.poolOverview}>
                    <h2>Downloading files...</h2>
                    <p>
                        {magnet_uri}
                    </p>
                    {dlProgress.downloaded != "100" && (<div>
                        <p>Progress: {dlProgress.progress}</p>
                        <p>Peers: {dlProgress.peers}</p>
                    </div>)}
                    
                    {/* <p>
                        Trackers: <ul>
                            {trackers.map((tracker, i) => (
                                <li key={i}>{tracker}</li>
                            ))}
                        </ul>
                    </p> */}
                    <p>Downloaded: {dlProgress.downloaded.toString()}</p>
                    
                    <NoSSR>
                    <div ref={el}/>
                    
                    <video id="video-container" ref={el_video} className="video-js" data-setup="{}" controls={true}></video>
                    </NoSSR>
                </div>
            </main>
        </div>
    )

    return ui
}

UI.getInitialProps = async ({ query }) => {
    console.log(query)
    const { id: poolId, poolLabel, torrent, magnet_uri } = query
    return { poolId, poolLabel, torrent, magnet_uri }
}

UI.layout = AppLayout

// const DynamicUI = dynamic(() => import('../components/header'), {
//     ssr: false,
// })

export default UI
