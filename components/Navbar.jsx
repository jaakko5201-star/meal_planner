import React from "react";
import { Link, useLocation } from "react-router-dom";
import "./navbar.css";

function Navbar() {
  const location = useLocation();

  const isActive = (path) =>
    location.pathname === path || location.pathname.startsWith(path) ? "active" : "";

  return (
    <nav className="navbar">
      <div className="logo">
        <Link to="/" className="logo-link">
          Budget Bites - Jaakko Räty
        </Link>
      </div>

      <div className="nav-links">
        <Link className={isActive("/")} to="/">
          Calendar
        </Link>
        <Link className={isActive("/meals")} to="/meals">
          Meals
        </Link>
        <Link className={isActive("/groceries")} to="/groceries">
          Groceries
        </Link>
        <Link className={isActive("/budget")} to="/budget">
          Budget
        </Link>
      </div>
    </nav>
  );
}

export default Navbar;