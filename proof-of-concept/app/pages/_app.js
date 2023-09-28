import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Head from 'next/head'
import React from 'react'
import '../styles/globals.css'
import 'bootstrap-icons/font/bootstrap-icons.css'
import Script from 'next/script'

const queryClient = new QueryClient()

function MyApp({ Component, pageProps }) {
  const Layout = Component.layout || (({ children }) => <>{children}</>)
  return <Layout>
    <Head>
      <link rel="apple-touch-icon" href="apple-touch-icon.png"></link>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&display=swap" rel="stylesheet"></link>
      
      {/* Load all of these sync (blocking) */}

      {/* Webtorrent.js */}
      {/* <script src="https://cdn.jsdelivr.net/npm/webtorrent@latest/webtorrent.min.js" async={false}></script> */}
      <script src="https://cdn.jsdelivr.net/npm/webtorrent@1.8.0/webtorrent.min.js" async={false}></script>
      
      {/* <script src="https://cdn.jsdelivr.net/npm/webtorrent@2.1.20/dist/sw.min.js"></script> */}

      {/* <script>
        {`
          {
            // add the webtorrent script to the head
            const script = document.createElement('script');
            script.src = "https://cdn.jsdelivr.net/npm/webtorrent@2.1.20/dist/webtorrent.min.js";
            script.async = false;
            document.head.appendChild(script);
            alert(1)
          }
        `}
      </script> */}
      
      {/* Video.js */}
      <script src="https://cdnjs.cloudflare.com/ajax/libs/video.js/7.8.1/video.min.js"></script>
      <link rel="stylesheet" href="//cdnjs.cloudflare.com/ajax/libs/video.js/7.8.1/video-js.min.css" />
    </Head>
    
    <QueryClientProvider client={queryClient}>
      <Component {...pageProps} />
    </QueryClientProvider>


    <footer dangerouslySetInnerHTML={{
      __html: `<!--${comments}-->`
    }}>

    </footer>
  </Layout>
}

const comments = `
@virtualelena
i need to know who’s responsible for the “xx is lowkey goated in cases where yy is the vibe” copypasta, literally every thought i’ve had today has been reflexively converted into this format, absolutely insidious and powerful meme

when i was 12 i babysat this girl for a few years and she
would come to me and show me her art, drag me by my
wrists and point at the pieces she'd made during the
week. and she'd be like "do the voice" and id put on a
sports-announcer olympics-style voice and be like "such
form! this level of coloring! why i haven't seen such
perfection in crayola in a long time. and what is this? why
jeff, now this is a true risk... it seems she's made ... a
monochrome pink canvas.... i haven't seen this
attempted since winter 1932... and i gotta say, jeff, it's
absolutely splendid" and she'd fall back giggling. at the
end of every night she'd check with me: "did you really
like it?" and id say yes and talk about something i noticed
and tucked her in.
she was just accepted into 3 major art schools. she wrote
me a letter. inside was a picture from when she was
younger. monochrome pink.
"thank you," it said, "to somebody who saw the best in
me."


`

export default MyApp
