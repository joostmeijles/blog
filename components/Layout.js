import Footer from './Footer'
import Header from './Header'

export default ({ title, children }) => {
  return (<>
    <div className="grid grid-cols-1 lg:grid-cols-5">
      <div className="flex flex-col col-start-1 col-span-1 ml-5 mr-5 lg:col-start-2 lg:col-span-3 lg:ml-0 lg:mr-0">
        <Header/>
        {children}
        <Footer/>
      </div>
    </div>
  </>)
}
