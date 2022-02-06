import React, { useEffect } from 'react'
import { useSelector } from "react-redux"
import { useLocation } from 'react-router';
import { Link } from "react-router-dom"

const LoggedInContent = props => {
  const location = useLocation();
  const redirect = encodeURIComponent(location.pathname);
  const { children, message, requireSuperuser, showLoginLink } = props

  const me = useSelector((state) => state.jwt)

  const isLoggedIn = (me === null || me === void 0 ? void 0 : me.id) && (!requireSuperuser || me.superuser)

  if (isLoggedIn)
    return children
  else if (showLoginLink ?? true)
    return (<div><Link to={`/login?redirect=${redirect}`}>{message ?? "Log in"}</Link></div>)
  else 
    return (<div></div>)
}

export default LoggedInContent