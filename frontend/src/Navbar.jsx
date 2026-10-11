import { useState } from "react";
import { Menu, X, ArrowUpRight } from "lucide-react";
import "./Navbar.css";

const links = [
  { label: "Home", href: "#home" },
  { label: "Portfolio", href: "#portfolio" },
  { label: "Services", href: "#services" },
  { label: "About", href: "#about" },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="navbar">
      <a
        href="#home"
        className="navbar-logo"
        onClick={() => setMenuOpen(false)}
      >
        FRAME<span>CRAFT</span>
        <span className="logo-dot">.</span>
      </a>

      <button
        className="navbar-menu-button"
        onClick={() => setMenuOpen(!menuOpen)}
        aria-label={menuOpen ? "Close menu" : "Open menu"}
        aria-expanded={menuOpen}
      >
        {menuOpen ? <X size={23} /> : <Menu size={23} />}
      </button>

      <nav
        className={`navbar-links ${
          menuOpen ? "navbar-links-open" : ""
        }`}
      >
        {links.map((link) => (
          <a
            key={link.label}
            href={link.href}
            onClick={() => setMenuOpen(false)}
          >
            {link.label}
          </a>
        ))}

        <a
          href="#contact"
          className="navbar-contact"
          onClick={() => setMenuOpen(false)}
        >
          Let's Talk <ArrowUpRight size={17} />
        </a>
      </nav>
    </header>
  );
}