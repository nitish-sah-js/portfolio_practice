import "./shiny-button.css";

export function ShinyButton({ children, href, className = "" }) {
  return (
    <a href={href} className={`shiny-cta ${className}`}>
      <span className="shiny-button-content">{children}</span>
    </a>
  );
}