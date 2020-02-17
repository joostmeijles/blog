import styles from './Footer.module.css'

export default () => (
  <div className="flex flex-col items-center mb-8 mt-8">
    <a href="https://ko-fi.com/G2G5114YM" target="_blank" rel="noopener noreferrer" className={styles.hvr_buzz_out}>
      <img className="w-32"
        src={require('../public/kofi.png')} border="0"
        alt="Buy Me a Coffee at ko-fi.com" />
    </a>
    <p className="font-sans text-xs font-thin">© <a href="https://github.com/joostmeijles/blog">Joost Meijles</a> 2019</p>
  </div>
)
