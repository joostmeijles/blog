import Link from 'next/link'

export default ({ tag }) => (
  <Link href={`/tags/${tag}`} >
    <a className="font-sans text-sm text-gray-600 font-hairline box-border border-2 m-1 p-1 rounded-lg hover:bg-gray-100">#{tag}</a>
  </Link>
)
