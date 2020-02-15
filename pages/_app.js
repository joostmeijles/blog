import React from 'react'
import Head from 'next/head'

import '../tailwind.css'
import 'typeface-indie-flower'

export default function MyApp({ Component, pageProps }) {
  return <>
    <Head>
      <meta charSet="utf-8" />
      <meta name="viewport" content="initial-scale=1.0, width=device-width" key="viewport" />
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
