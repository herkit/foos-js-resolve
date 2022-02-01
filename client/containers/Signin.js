import React from 'react'
import { Helmet } from 'react-helmet'
import { Outlet } from 'react-router'
import { useStaticResolver } from '@resolve-js/react-hooks'

const SigninContainer = () => { 
  const staticResolver = useStaticResolver()
  const bootstrapLink = {
    rel: 'stylesheet',
    type: 'text/css',
    href: staticResolver('/style.css'),
  }
  const stylesheetLink = {
    rel: 'stylesheet',
    type: 'text/css',
    href: staticResolver('/bootstrap.min.css'),
  }
  const signinLink = {
    rel: 'stylesheet',
    type: 'text/css',
    href: staticResolver('/signin.css'),
  }
  const faviconLink = {
    rel: 'icon',
    type: 'image/png',
    href: staticResolver('/favicon.png'),
  }
  const links = [bootstrapLink, stylesheetLink, signinLink, faviconLink]
  const meta = {
    name: 'viewport',
    content: 'width=device-width, initial-scale=1',
  }
  return(
    <div>
      <Helmet link={links} meta={[meta]} title="Signin"><body className='text-center'></body></Helmet>
      <Outlet></Outlet>
    </div>
  )
}

export default SigninContainer