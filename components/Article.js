import React, { useEffect } from 'react'
import Markdown from 'react-markdown'
import ArticleHeader from './ArticleHeader'

export default ({ date, title, tags, canonical, content }) => {
  return (<>
    {/* canonical */}
    <ArticleHeader date={date} title={title} tags={tags} />
    <Markdown source={content} className="article" />
    {/* <SimilarArticles/> */}
    <Utterances/>
  </>)
}

const Utterances = () => {
  useEffect(() => {
    const script = document.createElement('script')

    script.src = 'https://utteranc.es/client.js'
    script.setAttribute('repo', 'joostmeijles/blog')
    script.setAttribute('issue-term', 'url')
    script.label = 'comment'
    script.setAttribute('theme', 'github-light')
    script.setAttribute('crossorigin', 'anonymous')
    script.async = true

    document.body.appendChild(script)

    return () => {
      document.body.removeChild(script)
    }
  }, [])

  return <div></div>
}
