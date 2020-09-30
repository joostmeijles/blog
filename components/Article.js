import React from 'react'
import Markdown from 'react-markdown/with-html'
import ArticleHeader from './ArticleHeader'

export default ({ date, title, tags, canonical, content }) => {
  return (<>
    {/* canonical */}
    <ArticleHeader date={date} title={title} tags={tags} />
    <Markdown source={content} escapeHtml={false} className="article" />
    {/* <SimilarArticles/> */}
    <Utterances/>
  </>)
}

class Utterances extends React.Component {
  componentDidMount() {
    const script = document.createElement('script')

    script.src = 'https://utteranc.es/client.js'
    script.async = true
    script.setAttribute('repo', 'joostmeijles/blog')
    script.setAttribute('issue-term', 'url')
    script.label = 'comment'
    script.setAttribute('theme', 'github-light')
    script.setAttribute('crossorigin', 'anonymous')

    this.instance.appendChild(script)
  }

  render() {
    return <div ref={el => (this.instance = el)} />
  }
}
