import React from "react";
import { Form } from "react-bootstrap";
import Gravatar from "react-gravatar";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";

const LoginInfo = () => {
  const me = useSelector((state) => state.jwt)

  const isLoggedIn = (me === null || me === void 0 ? void 0 : me.id)

  if (isLoggedIn)
    return (
      <div>
        <span className="me-2">{me.name}</span>
        <Gravatar className="me-2 rounded-circle bg-light" email={me.email} size={36} default="robohash"></Gravatar>
        <Link 
          to="/" 
          className="btn btn-warning me-2" 
          onClick={() =>document.getElementById('hidden-form-for-logout').submit()}
        >Logout</Link>
        <Form method="post" id="hidden-form-for-logout" action="/api/logout">
            <input type="hidden" name="username" value="null" />
            <input type="hidden" />
        </Form>
      </div>
    )
  else
      return (
        <div>
          <Link to="/login" className="btn btn-outline-light me-2">Login</Link>
          <Link to="/register" className="btn btn-warning">Sign-up</Link>
        </div>
      )
}

export { LoginInfo }