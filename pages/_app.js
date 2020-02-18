import React, { useEffect } from 'react'
import Head from 'next/head'
import Router from 'next/router'
import { initGA, logPageView } from '../lib/analytics'
import '../tailwind.css'
import 'typeface-indie-flower'

export default function MyApp({ Component, pageProps }) {
  useEffect(() => {
    initGA()
    logPageView()
    Router.events.on('routeChangeComplete', logPageView)
  }, [])

  return <>
    <Head>
      <meta charSet="utf-8" />
      <meta name="viewport" content="initial-scale=1.0, width=device-width" key="viewport" />
      <meta name="description" content="Software Development by Joost Meijles"/>
      <meta name="twitter:card" content="summary" key="twitter:card"/>
      <meta name="twitter:site" content="@joostmeijles" key="twitter:site"/>
      <meta name="twitter:creator" content="@joostmeijles" key="twitter:creator"/>
      <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png"/>
      <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png"/>
      <link rel="manifest" href="/manifest.json"/>
      <title>Software Development by Joost Meijles</title>
    </Head>
    <Component {...pageProps} />
  </>
}
