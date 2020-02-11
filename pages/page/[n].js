import Link from 'next/link'
import { getArticles, pageSize, getNumPages } from '../../content'
import Excerpt from '../../components/Excerpt'
import Layout from '../../components/Layout'

const NavLink = ({ pageNum, children }) => (
  <Link href="/page/[n]" as={`/page/${pageNum}`}>
    <a className="self-center font-sans text-sm font-hairline box-border border-2 mt-5 ml-1 mr-1 p-1 rounded-lg hover:bg-gray-100">
      {children}
    </a>
  </Link>
)

export default ({ articles, prevPage, nextPage }) => (
  <Layout>
    {articles.map((md, i) => <Excerpt key={i} md={md}/>)}
    <div className="flex flex-row self-center">
      {prevPage ? <NavLink pageNum={prevPage}>&lt; Prev</NavLink> : <Link href={'/'}><a className="self-center font-sans text-sm font-hairline box-border border-2 mt-5 ml-1 mr-1 p-1 rounded-lg hover:bg-gray-100">&lt; Prev</a></Link>}
      {nextPage !== undefined && <NavLink pageNum={nextPage}>Next &gt;</NavLink>}
    </div>
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
