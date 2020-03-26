import { FaStrava } from 'react-icons/fa'
import { FiGithub, FiLinkedin, FiMail, FiTwitter } from 'react-icons/fi'
// import { MdSearch } from 'react-icons/md'
import Link from 'next/link'

export default () => {
  return <div className="flex flex-row justify-between">
    <div className="flex flex-row items-center justify-start mb-8 mt-8">
      <Link href="/">
        <img className="w-20 cursor-pointer"
          src={require('../public/android-chrome-192x192.png')}
          alt="Joost"/>
      </Link>
      <Link href="/">
        <a className="invisible md:visible font-indie text-5xl">Joost Meijles</a>
      </Link>
    </div>
    <div className="flex flex-row items-center justify-end">
      {/* <Icon href="/">
        <MdSearch/>
      </Icon> */}
      <Icon href="mailto:joost@meijl.es" name="email">
        <FiMail/>
      </Icon>
      <Icon href="https://github.com/joostmeijles" name="github">
        <FiGithub/>
      </Icon>
      <Icon href="https://linkedin.com/in/joostmeijles" name="linkedin">
        <FiLinkedin/>
      </Icon>
      <Icon href="https://twitter.com/joostmeijles" name="twitter">
        <FiTwitter className="stroke-current text-blue-300"/>
      </Icon>
      <Icon href="http://strava.com/athletes/43905728" name="strava">
        <FaStrava className="stroke-current text-orange-700"/>
      </Icon>
    </div>
  </div>
}

const Icon = ({ href, name, children }) => (
  <a href={href} aria-label={name} target="_blank" rel="noopener noreferrer" className="p-2 transform scale-150">
    {children}
  </a>
)
