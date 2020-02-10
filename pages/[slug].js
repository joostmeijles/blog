import { getArticleFromSlug, getSlugs } from '../content'
import Article from '../components/Article'
import Layout from '../components/Layout'

export default ({ article }) => (
  <Layout title={article.data.title}>
    <Article content={article.content} {...article.data} />
  </Layout>
)

export async function unstable_getStaticProps({ params }) {
  const article = getArticleFromSlug(params.slug)
  //TODO: similar articles
  //TODO: comments
  return { props: { article } }
}

export async function unstable_getStaticPaths() {
  const slugs = getSlugs(0, -1)

  return slugs.map(slug => {
    return { params: { slug } }
  })
}
