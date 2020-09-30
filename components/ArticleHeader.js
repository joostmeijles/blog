import Link from 'next/link'
import Tags from './Tags'

const months = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December'
]

const ArticleHeader = ({ tags, date, title, slug }) => {
  const d = new Date(date)
  const dateStr = `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`

  return (<div className="flex flex-col">
    <div className="flex flex-row justify-between">
      <h2 className="font-sans text-sm text-gray-600 font-hairline">{dateStr}</h2>
      <Tags tags={tags} />
    </div>
    <Title slug={slug} title={title} />
  </div>)
};

export default ArticleHeader;

const Title = ({ slug, title }) => {
  const h = <h1 className="font-sans text-2xl font-thin hover:underline">{title}</h1>

  if (!slug) {
    return h
  }

  return (<Link href="/[slug]" as={`/${slug}`}>
    <a>
      {h}
    </a>
  </Link>)
}
