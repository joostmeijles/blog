import Tag from './Tag'

export default ({ tags, className }) => {
  return (<div className={className}>
    { tags.map((tag, i) => <Tag key={i} tag={tag}/>) }
  </div>)
}
