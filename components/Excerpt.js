import Markdown from 'react-markdown'
import Link from 'next/link'
import ArticleHeader from './ArticleHeader'

const Excerpt = ({ md }) => {
  const { tags, date, title, slug } = md.data

  return (<div className="flex flex-col mb-5 mt-5">
    <ArticleHeader date={date} tags={tags} title={title} slug={slug} />
    <Link href="/[slug]" as={`/${slug}`}>
      <Markdown className="article cursor-pointer" source={md.excerpt}/>
    </Link>
    <Link href="/[slug]" as={`/${slug}`}>
      <a className="font-sans font-light underline p-2 rounded-lg hover:bg-gray-200 self-end">Read more</a>
    </Link>
  </div>)
}

export default Excerpt
