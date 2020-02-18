import Link from 'next/link'

export default ({ tag }) => (
  <Link href="/tags/[tag]" as={`/tags/${tag}`} >
    <a className="font-sans text-sm text-gray-600 font-hairline box-border border-2 m-1 py-1 px-2 rounded-lg hover:bg-gray-100">#{tag}</a>
  </Link>
)
