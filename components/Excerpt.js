import Link from 'next/link'
import ArticleHeader from './ArticleHeader'

export default ({ md }) => {
  const { tags, date, title, slug } = md.data

  return (<div className="flex flex-col mb-5 mt-5">
    <ArticleHeader date={date} tags={tags} title={title} slug={slug} />
    <Link href="/[slug]" as={`/${slug}`}>
      <p className="font-sans font-light cursor-pointer">{md.excerpt}</p>
    </Link>
    <Link href="/[slug]" as={`/${slug}`}>
      <a className="font-sans font-light underline p-2 rounded-lg hover:bg-gray-200 self-end">Read more</a>
    </Link>
  </div>)
}
