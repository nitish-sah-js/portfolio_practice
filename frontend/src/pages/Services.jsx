import { useEffect, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { services as fallbackServices } from "../data/services";
import { ServiceIcon } from "../data/serviceIcons";
import { fetchServices } from "../data/api";
import "./Services.css";

export default function Services() {
  const [services, setServices] = useState(fallbackServices);

  // Load services edited in /editor; keep the built-in list if the backend is offline.
  useEffect(() => {
    fetchServices()
      .then((data) => {
        if (Array.isArray(data)) setServices(data);
      })
      .catch(() => {});
  }, []);

  return (
    <section className="services-section" id="services">
      <div className="services-heading">
        <div>
          <p className="services-label">02 / WHAT I OFFER</p>

          <h2>
            YOUR IDEA.
            <br />
            <span>MY EXPERTISE.</span>
          </h2>
        </div>

        <p className="services-description">
          Every project is different. Choose the service that fits your
          vision, and let's create something worth watching.
        </p>
      </div>

      <div className="services-grid">
        {services.map((service, index) => {
          return (
            <article className="service-card" key={service.id}>
              <div className="service-card-top">
                <span className="service-icon">
                  <ServiceIcon name={service.icon} size={25} strokeWidth={1.6} />
                </span>

                <span className="service-number">
                  {String(index + 1).padStart(2, "0")}
                </span>
              </div>

              <p className="service-category">{service.category}</p>

              <h3>{service.title}</h3>

              <p className="service-description">
                {service.description}
              </p>

              <div className="service-card-bottom">
                <div className="service-price">
                  <span>STARTING AT</span>
                  <strong>{service.startingPrice}</strong>
                </div>

                <a
                  href="#contact"
                  className="service-select-button"
                  onClick={() => {
                    sessionStorage.setItem(
                      "selectedVideoService",
                      service.title
                    );
                  }}
                  aria-label={`Request ${service.title}`}
                >
                  <ArrowUpRight size={21} />
                </a>
              </div>
            </article>
          );
        })}
      </div>

      <p className="services-note">
        FINAL PRICING DEPENDS ON VIDEO LENGTH, COMPLEXITY, AND PROJECT
        REQUIREMENTS.
      </p>
    </section>
  );
}