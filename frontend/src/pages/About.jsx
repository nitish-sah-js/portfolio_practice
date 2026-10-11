import { ArrowUpRight, CheckCircle2 } from "lucide-react";
import "./About.css";

const highlights = [
  "Creative storytelling and smooth transitions",
  "Professional color grading",
  "Sound design and beat synchronization",
  "Content optimized for social media",
];

export default function About() {
  return (
    <section className="about-section" id="about">
      <div className="about-image-wrapper">
        <img
          src="https://images.unsplash.com/photo-1536240478700-b869070f9279?auto=format&fit=crop&w=1000&q=85"
          alt="Video editing and filmmaking equipment"
          className="about-image"
          loading="lazy"
        />

        <div className="about-image-label">
          <span className="about-label-dot" />
          BEHIND EVERY FRAME
        </div>
      </div>

      <div className="about-content">
        <p className="about-eyebrow">03 / THE CREATIVE MIND</p>

        <h2>
          NOT JUST
          <br />
          AN EDITOR.
          <br />
          <span>A STORYTELLER.</span>
        </h2>

        <p className="about-description">
          Every video has a story worth telling. My approach combines
          creative vision, precise editing, music, and color to turn
          ordinary footage into memorable visual experiences.
        </p>

        <div className="about-highlights">
          {highlights.map((highlight) => (
            <div className="about-highlight" key={highlight}>
              <CheckCircle2 size={18} />
              <span>{highlight}</span>
            </div>
          ))}
        </div>

        <a href="#contact" className="about-contact-button">
          LET'S WORK TOGETHER
          <ArrowUpRight size={18} />
        </a>
      </div>
    </section>
  );
}