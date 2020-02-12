import Markdown from 'react-markdown'
import ReactUtterences from 'react-utterances'
import ArticleHeader from './ArticleHeader'

export default ({ date, title, tags, canonical, content }) => {
  return (<>
    {/* canonical */}
    <ArticleHeader date={date} title={title} tags={tags} />
    <Markdown source={content} className="article" />
    {/* <SimilarArticles/> */}
    <ReactUtterences repo='joostmeijles/blog' type='url'/>
  </>)
}
