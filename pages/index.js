import Link from 'next/link'
import { getArticleFromSlug, getSlugs, getNumPages } from '../content'
import Excerpt from '../components/Excerpt'
import Layout from '../components/Layout'

const Older = ({ nextPage }) => (
  <Link href="/page/[n]" as={`/page/${nextPage}`}>
    <a className="self-center btn-nav">
      Older &gt;
    </a>
  </Link>
)

export default ({ articles, nextPage }) => (
  <Layout>
    {articles.map((md, i) => <Excerpt key={i} md={md}/>)}
    {nextPage !== undefined && <Older nextPage={nextPage}/>}
  </Layout>
)

// eslint-disable-next-line camelcase
export async function unstable_getStaticProps({ params }) {
  const slugs = getSlugs()
  const articles = slugs.map(getArticleFromSlug)

  const numPages = getNumPages()
  const nextPage = numPages > 1 ? 1 : undefined

  return { props: { articles, nextPage } }
}
