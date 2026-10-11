import { ArrowRight } from "lucide-react";
import "./Home.css";
import { ShinyButton } from "../components/shiny-button";

export default function Home() {
  return (
    <main className="home-page">
      <section className="home-hero" id="home">
        {/* Background Video */}
        <video
          className="home-background-video"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
        >
          <source
  src="/videos/Background.mp4"
  type="video/mp4"
/>
        </video>

        {/* Dark overlay */}
        <div className="home-hero-overlay" />

        {/* Bottom-center buttons */}
        <div className="home-bottom-buttons">
  <ShinyButton
    href="/portfolio"
    className="home-work-button"
  >
    MY WORKS <span aria-hidden="true">→</span>
  </ShinyButton>

  <ShinyButton
    href="/#contact"
    className="home-contact-button"
  >
    CONTACT <span aria-hidden="true">→</span>
  </ShinyButton>
</div>
      </section>
    </main>
  );
}