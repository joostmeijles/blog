import Head from 'next/head'
import Footer from './Footer'
import Header from './Header'

export default ({ title, children }) => {
  const myTitle = title ? `${title} | Joost Meijles` : 'Software Development by Joost Meijles'
  return (<>
    <Head>
      <meta charSet="utf-8" />
      <meta name="viewport" content="initial-scale=1.0, width=device-width" />
      <link rel="manifest" href="/manifest.json"></link>
      <title>{myTitle}</title>
    </Head>
    <div className="grid grid-cols-1 lg:grid-cols-5">
      <div className="flex flex-col col-start-1 col-span-1 ml-5 mr-5 lg:col-start-2 lg:col-span-3 lg:ml-0 lg:mr-0">
        <Header/>
        {children}
        <Footer/>
      </div>
    </div>
  </>)
}

// TODO: OpenGraph data
// <meta property="og:title" content="XC9 + K8S + AKS = Bingo?! 🌟 - Joost Meijles">
// <meta property="og:description" content="Sitecore 9 is moving towards a micro-service based architecture and is designed with the cloud in mind. The community has picked this development up by creating Docker images for Sitecore. This works great for local development, but it still has some challenges when deploying to the cloud. This changed with the recent introduction of Windows support for Kubernetes (K8S) and Azure Kubernetes Service (AKS) support for Windows containers.">
// <meta property="og:url" content="https://joost.meijles.com/xc9_k8s_aks/">
// <meta property="og:site_name" content="Joost Meijles">
// <meta property="og:type" content="article">
// <meta property="og:image" content="https://joost.meijles.com/android-chrome-512x512.png">
// <meta property="article:section" content="">
// <meta property="article:tag" content="Docker">
// <meta property="article:tag" content="Azure">
// <meta property="article:tag" content="XC9">
// <meta property="article:published_time" content="2019-11-06T00:00:00Z">
// <meta property="article:modified_time" content="2019-11-06T00:00:00Z">
// <meta name="twitter:card" content="summary">
// <meta name="twitter:site" content="@joostmeijles">
// <meta name="twitter:creator" content="@joostmeijles">

// TODO:
/* <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png"> */

// TODO: PWA
/*
<link rel="mask-icon" href="/safari-pinned-tab.svg" color="#5bbad5">
<meta name="msapplication-TileColor" content="#da532c">
<meta name="theme-color" content="#ffffff">
<link href="https://fonts.googleapis.com/css?family=Indie+Flower&amp;display=swap" rel="stylesheet"> */
