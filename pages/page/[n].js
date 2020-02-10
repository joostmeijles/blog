import Link from 'next/link'
import { getArticles, pageSize, getNumPages } from '../../content'
import Excerpt from '../../components/Excerpt'
import Layout from '../../components/Layout'

export default ({ articles, prevPage, nextPage }) => (
  <Layout>
    {articles.map((md, i) => <Excerpt key={i} md={md}/>)}
    {prevPage ? <Link href="/page/[n]" as={`/page/${prevPage}`}><a>Prev</a></Link> : <Link href={'/'}><a>Prev</a></Link>}
    {nextPage !== undefined && <Link href="/page/[n]" as={`/page/${nextPage}`}><a>Next</a></Link>}
  </Layout>
)

export async function unstable_getStaticProps({ params }) {
  const pageNum = parseInt(params.n)
  const pageFrom = pageNum * pageSize
  const articles = getArticles(pageFrom, pageFrom + pageSize)

  const numPages = getNumPages()
  const prevPage = pageNum > 0 ? pageNum - 1 : undefined
  const nextPage = pageNum === numPages - 1 ? undefined : pageNum + 1

  return { props: { articles, prevPage, nextPage } }
}

export async function unstable_getStaticPaths() {
  const numPages = getNumPages()

  const paths = []
  for (let i = 0; i < numPages; i++) {
    paths.push({ params: { n: `${i}` } })
  }

  return paths
}
