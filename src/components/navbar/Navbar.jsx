import React, { useState, useEffect } from 'react';
import './Navbar.css';
import pragneysh from '../../assets/Pragneysh.png';
import AnchorLink from 'react-anchor-link-smooth-scroll';

const Navbar = () => {
  const [menu, setMenu] = useState("home");
  const [isScrolled, setIsScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  const handleMenuClick = (section) => {
    setMenu(section);
    setMenuOpen(false); // close on link click
  };

  return (
    <div className={isScrolled ? "navbar scrolled" : "navbar"}>
      <div className="nav-logo">
        <img src={pragneysh} alt="Pragneysh Dekate" />
      </div>

      <ul className={`nav-links ${menuOpen ? "open" : ""}`}>
        <AnchorLink className="nav-link" offset={50} href="#home"><li className={menu === "home" ? "active" : ""} onClick={() => handleMenuClick("home")}>Home</li></AnchorLink>
        <AnchorLink className="nav-link" offset={50} href="#about"><li className={menu === "about" ? "active" : ""} onClick={() => handleMenuClick("about")}>About</li></AnchorLink>
        <AnchorLink className="nav-link" offset={50} href="#experiences"><li className={menu === "experiences" ? "active" : ""} onClick={() => handleMenuClick("experiences")}>Experiences</li></AnchorLink>
        {/* <AnchorLink className="nav-link" offset={50} href="#portfolio"><li className={menu === "portfolio" ? "active" : ""} onClick={() => handleMenuClick("portfolio")}>Portfolio</li></AnchorLink> */}
        <AnchorLink className="nav-link" offset={50} href="#contacts"><li className={menu === "contacts" ? "active" : ""} onClick={() => handleMenuClick("contacts")}>Contacts</li></AnchorLink>
      </ul>

      <div className="hamburger" onClick={toggleMenu}>
        <div></div>
        <div></div>
        <div></div>
      </div>

      <AnchorLink className="nav-link" offset={50} href="#contacts">
        <button className="connect-button">Connect With Me</button>
      </AnchorLink>
    </div>
  );
};

export default Navbar;
