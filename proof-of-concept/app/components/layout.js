import '@rainbow-me/rainbowkit/styles.css';
import {
    ConnectButton,
    createAuthenticationAdapter,
    getDefaultWallets,
    RainbowKitAuthenticationProvider,
    RainbowKitProvider,
} from '@rainbow-me/rainbowkit';
import { configureChains, createClient, useAccount, WagmiConfig, useSigner } from 'wagmi';
import { mainnet, foundry, optimism } from 'wagmi/chains';
import { getContract, getProvider } from '@wagmi/core'
import { alchemyProvider } from 'wagmi/providers/alchemy';
import { publicProvider } from 'wagmi/providers/public';
import Header from '../components/header';
import { jsonRpcProvider } from '@wagmi/core/providers/jsonRpc'

import { useNetwork } from 'wagmi'
import { useEffect, useState  } from 'react'
import { SiweMessage  } from 'siwe'


const { chains, provider } = configureChains(
    [foundry],
    [
        publicProvider(),
        jsonRpcProvider({
            rpc: (chain) => ({
                http: `https://localhost:8545`,
            }),
        }),
    ]
);

import { APP_NAME  } from '../common/config'

const { connectors } = getDefaultWallets({
    appName: APP_NAME,
    chains: [foundry]
});

const wagmiClient = createClient({
    autoConnect: true,
    connectors,
    provider
})


const authenticationAdapter = ({ onVerify }) => createAuthenticationAdapter({
    getNonce: async () => {
        return '1'.repeat(16)
        // const response = await fetch('/api/nonce');
        // return await response.text();
    },

    createMessage: ({ nonce, address, chainId }) => {
        const domain = window.location.host;
        const origin = window.location.origin;
        return new SiweMessage({
            domain,
            address,
            statement: 'Sign in with Ethereum to the app.',
            uri: origin,
            version: '1',
            chainId,
            nonce,
        });
    },

    getMessageBody: ({ message }) => {
        return message.prepareMessage();
    },

    verify: async ({ message, signature }) => {
        // const verifyRes = await fetch(`/api/v1/auth/login/`, {
        //     method: "POST",
        //     headers: {
        //         'Content-Type': 'application/json',
        //     },
        //     body: JSON.stringify({ message, signature }),
        //     credentials: 'include'
        // });

        // const res = await verifyRes.json()

        const ok = true
        // onVerify(true)
        onVerify(ok)

        return ok
    },

    signOut: async () => {
        // await fetch('/api/logout');
        return
    },
});


export const AppLayout = ({ children }) => {
    const [authStatus, setAuthStatus] = useState('unauthenticated')
    const onVerify = (ok) => {
        setAuthStatus(ok ? 'authenticated' : 'unauthenticated')
    }

    return (
        <WagmiConfig client={wagmiClient}>
            {/* <RainbowKitAuthenticationProvider
                adapter={authenticationAdapter({ onVerify })}
                status={authStatus}
                appInfo={{
                    appName: APP_NAME,
                }}
            > */}
                <RainbowKitProvider modalSize="compact" chains={chains} initialChain={foundry}>
                    <Body>{children}</Body>
                </RainbowKitProvider>

            {/* </RainbowKitAuthenticationProvider> */}
        </WagmiConfig>
    )
}

const Body = ({ children }) => {
    return <>
        {children}
    </>
}