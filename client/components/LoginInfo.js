import React from "react";
import Gravatar from "react-gravatar";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { apiPost } from "../api/client";

const Avatar = ({me}) => {
  if (me.avatar)
    return (<img className="me-2 rounded-circle bg-light d-md" height={36} src={me.avatar}></img>)
  else
    return (<Gravatar className="me-2 rounded-circle bg-light d-md" email={me.email} size={36} default="robohash"></Gravatar>)
}

const LoginInfo = () => {
  const me = useSelector((state) => state.jwt)

  const isLoggedIn = (me === null || me === void 0 ? void 0 : me.id)

  const onLogout = async (e) => {
    e.preventDefault()
    try {
      await apiPost('/auth/logout')
    } catch (err) {
      // ignore; navigate away regardless
    }
    window.location.assign('/')
  }

  if (isLoggedIn)
    return (
      <div>
        <span className="me-2 d-lg-inline d-none">{me.name}</span>
        <Avatar me={me}></Avatar>
        <Link to="/" className="btn btn-warning me-2" onClick={onLogout}>Logout</Link>
      </div>
    )
  else
      return (
        <div>
          <Link to="/login" className="btn btn-outline-light me-2">Login</Link>
          <Link to="/register" className="btn btn-success me-2 d-none d-md-inline">Sign-up</Link>
        </div>
      )
}

export { LoginInfo }