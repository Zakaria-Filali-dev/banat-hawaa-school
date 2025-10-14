import React from "react";
import { Link } from "react-router-dom";
import siteLogo from "../assets/site-logo.png";
import "./GlobalNav.css";

const GlobalNav = () => {
  return (
    <nav className="global-nav">
      <Link to="/" className="nav-logo">
        <img src={siteLogo} alt="Site Logo" />
        <span>BANAT-HAWAA-SCHOOL</span>
      </Link>
    </nav>
  );
};

export default GlobalNav;
