import React, { useEffect } from 'react'
import { useSelector } from "react-redux"
import { useLocation } from 'react-router';

const AnonymousContent = props => {
  const location = useLocation();
  const { children } = props

  const me = useSelector((state) => state.jwt)

  const isLoggedIn = (me === null || me === void 0 ? void 0 : me.id)

  if (!isLoggedIn)
    return children
  else 
    return (<div></div>)
}

export default AnonymousContent