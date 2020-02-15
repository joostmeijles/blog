import Head from 'next/head'
import { getArticleFromSlug, getSlugs } from '../content'
import Article from '../components/Article'
import Layout from '../components/Layout'

const mkAbsUrl = (path) => `https://joost.meijles.com/${path}`

export default ({ article }) => {
  const title = `${article.data.title} - Joost Meijles`

  return <>
    <Head>
      <title>{title}</title>
      <meta property="og:title" content={title}/>
      <meta property="og:description" content={article.excerpt}/>
      <meta property="og:url" content={mkAbsUrl(article.data.slug)}/>
      <meta property="og:site_name" content="Joost Meijles"/>
      <meta property="og:type" content="article"/>
      <meta property="og:image" content={mkAbsUrl('android-chrome-512x512.png')}/>
      <meta property="article:section" content=""/>
      {article.data.tags.map((tag, i) => <meta property="article:tag" key={i} content={tag}/>)}
      <meta property="article:published_time" content={article.data.date}/>
      <meta property="article:modified_time" content={article.data.date}/>
    </Head>
    <Layout title={article.data.title}>
      <Article content={article.content} {...article.data} />
    </Layout>
  </>
}

export async function unstable_getStaticProps({ params }) {
  const article = getArticleFromSlug(params.slug)
  //TODO: similar articles
  return { props: { article } }
}

export async function unstable_getStaticPaths() {
  const slugs = getSlugs(0, -1)

  return slugs.map(slug => {
    return { params: { slug } }
  })
}
