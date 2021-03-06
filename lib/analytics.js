import ReactGA from 'react-ga'

export const initGA = () => {
  console.debug('GA init')
  ReactGA.initialize('UA-124806744-1')
}

export const logPageView = () => {
  console.debug(`Logging pageview for ${window.location.pathname}`)
  ReactGA.set({ page: window.location.pathname })
  ReactGA.pageview(window.location.pathname)
}

export const logEvent = (category = '', action = '') => {
  if (category && action) {
    ReactGA.event({ category, action })
  }
}

export const logException = (description = '', fatal = false) => {
  if (description) {
    ReactGA.exception({ description, fatal })
  }
}
