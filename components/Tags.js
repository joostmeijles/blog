import Tag from './Tag'

const Tags = ({ tags, className }) => {
  return (<div className={className}>
    { tags.map((tag, i) => <Tag key={i} tag={tag}/>) }
  </div>)
}

export default Tags
