import { getArticles, getAllTags, defaultCompare } from '../../content'
import Excerpt from '../../components/Excerpt'
import Layout from '../../components/Layout'

export default ({ articles }) => (
  <Layout>
    {articles.map((md, i) => <Excerpt key={i} md={md}/>)}
  </Layout>
)

export async function unstable_getStaticProps({ params }) {
  const articles = getArticles(0, -1, defaultCompare, [params.tag])
  return { props: { articles } }
}

export async function unstable_getStaticPaths() {
  return getAllTags().map(tag => { return { params: { tag } } })
}