import moment from 'moment'
import Link from 'next/link'
import Tags from './Tags'

export default ({ tags, date, title, slug }) => (
  <div className="flex flex-col">
    <Tags tags={tags} className="self-end" />
    <h2 className="font-sans text-sm text-gray-600 font-hairline">{moment(date).format('MMMM DD, YYYY')}</h2>
    <Title slug={slug} title={title} />
  </div>
)

const Title = ({ slug, title }) => {
  const h = <h1 className="font-sans text-2xl font-thin hover:underline">{title}</h1>

  if (!slug) {
    return h
  }

  return (<Link href={`/${slug}`}>
    <a>
      {h}
    </a>
  </Link>)
}
