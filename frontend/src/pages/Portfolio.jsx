import { useEffect, useState } from "react";
import { Play, ArrowUpRight, Film } from "lucide-react";
import { categories, projects as fallbackProjects } from "../data/projects";
import { fetchProjects } from "../data/api";
import "./Portfolio.css";
import VioletPlasma from "../components/VioletPlasma";
export default function Portfolio() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [selectedProject, setSelectedProject] = useState(null);
  const [projects, setProjects] = useState(fallbackProjects);

  // Load work added from /editor; keep the built-in list if the backend is offline.
  useEffect(() => {
    fetchProjects()
      .then((data) => {
        if (Array.isArray(data)) setProjects(data);
      })
      .catch(() => {});
  }, []);

  const allCategories = [
    "All",
    ...new Set([
      ...categories,
      ...projects.map((project) => project.category).filter(Boolean),
    ]),
  ];

  const filteredProjects =
    activeCategory === "All"
      ? projects
      : projects.filter(
          (project) => project.category === activeCategory
        );

  function getCover(project) {
    return project.thumbnail || project.images?.[0] || "";
  }

  function getYouTubeEmbedUrl(url) {
    if (!url) return null;

    try {
      const parsedUrl = new URL(url);
      const hostname = parsedUrl.hostname.toLowerCase();

      let videoId = null;

      if (hostname === "youtu.be") {
        videoId = parsedUrl.pathname.split("/").filter(Boolean)[0];
      } else if (
        hostname === "youtube.com" ||
        hostname.endsWith(".youtube.com")
      ) {
        if (parsedUrl.pathname === "/watch") {
          videoId = parsedUrl.searchParams.get("v");
        } else {
          const match = parsedUrl.pathname.match(
            /^\/(?:embed|shorts|live)\/([^/?]+)/
          );

          videoId = match ? match[1] : null;
        }
      }

      if (!videoId) return null;

      return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(
        videoId
      )}`;
    } catch {
      return null;
    }
  }

  return (
    <section className="portfolio-section" id="portfolio">
        <div className="portfolio-plasma-background">
  <VioletPlasma />
</div>
      <div className="portfolio-heading">
        <div>
          <p className="portfolio-label">01 / SELECTED PROJECTS</p>

          <h2>
            THE ART OF
            <br />
            <span>THE EDIT.</span>
          </h2>
        </div>

        <p className="portfolio-description">
          Explore different video editing styles and find inspiration
          for your next creative project.
        </p>
      </div>

      {/* Category boxes */}
      <div className="portfolio-filters">
        {allCategories.map((category) => (
          <button
            key={category}
            className={
              activeCategory === category
                ? "portfolio-filter active"
                : "portfolio-filter"
            }
            onClick={() => setActiveCategory(category)}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Reference cards */}
      <div className="portfolio-grid">
        {filteredProjects.map((project, index) => (
          <article className="portfolio-card" key={project.id}>
            <button
              className="portfolio-thumbnail"
              onClick={() => setSelectedProject(project)}
              aria-label={`View ${project.title}`}
            >
              {getCover(project) ? (
                <img
                  src={getCover(project)}
                  alt={project.title}
                  loading="lazy"
                />
              ) : (
                <span className="portfolio-placeholder">
                  <Film size={30} />
                  <span>{project.category || "VIDEO"}</span>
                </span>
              )}

              <span className="portfolio-number">
                {String(index + 1).padStart(2, "0")}
              </span>

              <span className="portfolio-play">
                <Play size={22} fill="currentColor" />
              </span>
            </button>

            <div className="portfolio-card-info">
              <div>
                <h3>{project.title}</h3>
                <p>
                  {project.category}
                  {project.price && (
                    <span className="portfolio-price">
                      {project.price}
                    </span>
                  )}
                </p>
              </div>

              <button
                className="portfolio-arrow"
                onClick={() => setSelectedProject(project)}
                aria-label={`Open ${project.title}`}
              >
                <ArrowUpRight size={21} />
              </button>
            </div>
          </article>
        ))}
      </div>

      {/* Video preview modal */}
      {selectedProject && (
        <div
          className="portfolio-modal-backdrop"
          onClick={() => setSelectedProject(null)}
        >
          <div
            className="portfolio-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="portfolio-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="portfolio-modal-close"
              onClick={() => setSelectedProject(null)}
              aria-label="Close preview"
            >
              ×
            </button>

            <h3 id="portfolio-modal-title">
              {selectedProject.title}
            </h3>

            <p className="portfolio-modal-category">
              {selectedProject.category}
              {selectedProject.price && (
                <span className="portfolio-modal-price">
                  {selectedProject.price}
                </span>
              )}
            </p>

            {getYouTubeEmbedUrl(selectedProject.youtubeUrl) ? (
              <iframe
                className="portfolio-youtube-player"
                src={getYouTubeEmbedUrl(selectedProject.youtubeUrl)}
                title={selectedProject.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            ) : selectedProject.videos?.length ? null : (
              getCover(selectedProject) && (
                <img
                  className="portfolio-modal-image"
                  src={getCover(selectedProject)}
                  alt={selectedProject.title}
                />
              )
            )}

            {selectedProject.videos?.map((video) => (
              <video
                key={video}
                className="portfolio-modal-video"
                src={video}
                poster={selectedProject.thumbnail || undefined}
                controls
                playsInline
                preload="metadata"
              />
            ))}

            {selectedProject.images?.length > 0 && (
              <div className="portfolio-modal-gallery">
                {selectedProject.images.map((image) => (
                  <a
                    key={image}
                    href={image}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <img
                      src={image}
                      alt={selectedProject.title}
                      loading="lazy"
                    />
                  </a>
                ))}
              </div>
            )}

            <p className="portfolio-modal-description">
              {selectedProject.description}
            </p>
          </div>
        </div>
      )}
    </section>
  );
}