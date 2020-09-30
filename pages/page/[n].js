import Link from 'next/link'
import { getArticles, pageSize, getNumPages } from '../../content'
import Excerpt from '../../components/Excerpt'
import Layout from '../../components/Layout'

const NavLink = ({ pageNum, children }) => (
  <Link href="/page/[n]" as={`/page/${pageNum}`}>
    <a className="self-center btn-nav">
      {children}
    </a>
  </Link>
)

export default ({ articles, prevPage, nextPage }) => (
  <Layout>
    {articles.map((md, i) => <Excerpt key={i} md={md}/>)}
    <div className="flex flex-row self-center">
      {prevPage ? <NavLink pageNum={prevPage}>&lt; Prev</NavLink> : <Link href={'/'}><a className="self-center btn-nav">&lt; Prev</a></Link>}
      {nextPage && <NavLink pageNum={nextPage}>Next &gt;</NavLink>}
    </div>
  </Layout>
)

export async function getStaticProps({ params }) {
  const pageNum = parseInt(params.n)
  const pageFrom = pageNum * pageSize
  const articles = getArticles(pageFrom, pageFrom + pageSize)

  const numPages = getNumPages()
  const prevPage = pageNum > 0 ? pageNum - 1 : null
  const nextPage = pageNum === (numPages - 1) ? null : pageNum + 1

  return { props: { articles, prevPage, nextPage } }
}

export async function getStaticPaths() {
  const numPages = getNumPages()

  const paths = []
  for (let i = 0; i < numPages; i++) {
    paths.push({ params: { n: `${i}` } })
  }

  return {
    paths,
    fallback: false
  }
}
