import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpRight, Pencil, Plus, Trash2 } from "lucide-react";
import { servicesApi } from "../data/api";
import { ServiceIcon, serviceIcons } from "../data/serviceIcons";
import "./Services.css";

const emptyService = {
  title: "",
  category: "",
  description: "",
  startingPrice: "",
  icon: "Sparkles",
};

export default function ServicesManager({ toast, showMessage, handleError }) {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyService);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    servicesApi
      .list()
      .then(setServices)
      .catch((err) => showMessage(err.message, true))
      .finally(() => setLoading(false));
  }, [showMessage]);

  function setField(name, value) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  function resetForm() {
    setForm(emptyService);
    setEditingId(null);
  }

  function startEditing(service) {
    setForm({ ...emptyService, ...service });
    setEditingId(service.id);
    showMessage(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        const updated = await servicesApi.update(editingId, form);
        setServices((list) => list.map((s) => (s.id === editingId ? updated : s)));
        showMessage("Service updated. It's live on the homepage.");
      } else {
        const created = await servicesApi.create(form);
        setServices((list) => [...list, created]);
        showMessage("Service added. It's live on the homepage.");
      }
      resetForm();
    } catch (err) {
      handleError(err);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(service) {
    if (!window.confirm(`Delete "${service.title}"? This can't be undone.`)) return;
    try {
      await servicesApi.remove(service.id);
      setServices((list) => list.filter((s) => s.id !== service.id));
      if (editingId === service.id) resetForm();
      showMessage("Service deleted.");
    } catch (err) {
      handleError(err);
    }
  }

  async function move(index, direction) {
    const next = [...services];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setServices(next);
    try {
      await servicesApi.reorder(next.map((s) => s.id));
    } catch (err) {
      handleError(err);
    }
  }

  const previewNumber = editingId
    ? services.findIndex((s) => s.id === editingId) + 1
    : services.length + 1;

  return (
    <>
      <section className="editor-heading">
        <div>
          <p className="editor-label">EDITOR / MANAGE SERVICES</p>
          <h1>
            {editingId ? "EDIT" : "ADD"} A
            <br />
            <span>SERVICE.</span>
          </h1>
        </div>
        <p className="editor-description">
          These are the cards in the "What I offer" section of your homepage,
          with their starting prices.
        </p>
      </section>

      {toast}

      <div className="editor-layout">
        <div className="editor-stack">
          <form className="editor-form" onSubmit={handleSubmit}>
            <label className="editor-field">
              <span>Title *</span>
              <input
                value={form.title}
                onChange={(e) => setField("title", e.target.value)}
                placeholder="e.g. Reels & Shorts"
                required
              />
            </label>

            <div className="editor-row">
              <label className="editor-field">
                <span>Small label</span>
                <input
                  value={form.category}
                  onChange={(e) => setField("category", e.target.value.toUpperCase())}
                  placeholder="e.g. SOCIAL MEDIA"
                />
              </label>

              <label className="editor-field">
                <span>Starting price</span>
                <input
                  value={form.startingPrice}
                  onChange={(e) => setField("startingPrice", e.target.value)}
                  placeholder="e.g. ₹499"
                />
              </label>
            </div>

            <label className="editor-field">
              <span>Description</span>
              <textarea
                rows={4}
                value={form.description}
                onChange={(e) => setField("description", e.target.value)}
                placeholder="What's included in this service…"
              />
            </label>

            <div className="editor-field">
              <span>Icon</span>
              <div className="editor-icon-grid" role="radiogroup" aria-label="Icon">
                {Object.entries(serviceIcons).map(([name, Icon]) => (
                  <button
                    key={name}
                    type="button"
                    role="radio"
                    aria-checked={form.icon === name}
                    aria-label={name}
                    title={name}
                    className={form.icon === name ? "editor-icon active" : "editor-icon"}
                    onClick={() => setField("icon", name)}
                  >
                    <Icon size={19} strokeWidth={1.6} />
                  </button>
                ))}
              </div>
            </div>

            <div className="editor-form-actions">
              <button className="editor-primary" type="submit" disabled={saving}>
                {saving ? "Saving…" : editingId ? "Save changes" : (
                  <>
                    <Plus size={16} /> Add service
                  </>
                )}
              </button>
              {editingId && (
                <button type="button" className="editor-ghost" onClick={resetForm}>
                  Cancel
                </button>
              )}
            </div>
          </form>

          {/* Live preview using the homepage card styles */}
          <div>
            <p className="editor-label">LIVE PREVIEW</p>
            <div className="editor-service-preview">
              <article className="service-card">
                <div className="service-card-top">
                  <span className="service-icon">
                    <ServiceIcon name={form.icon} size={25} strokeWidth={1.6} />
                  </span>
                  <span className="service-number">
                    {String(previewNumber).padStart(2, "0")}
                  </span>
                </div>
                <p className="service-category">{form.category || "LABEL"}</p>
                <h3>{form.title || "Service title"}</h3>
                <p className="service-description">
                  {form.description || "Your description will appear here."}
                </p>
                <div className="service-card-bottom">
                  <div className="service-price">
                    <span>STARTING AT</span>
                    <strong>{form.startingPrice || "₹—"}</strong>
                  </div>
                  <span className="service-select-button">
                    <ArrowUpRight size={21} />
                  </span>
                </div>
              </article>
            </div>
          </div>
        </div>

        <aside className="editor-list">
          <p className="editor-label">
            {String(services.length).padStart(2, "0")} / SERVICES
          </p>

          {loading && <p className="editor-muted">Loading…</p>}
          {!loading && services.length === 0 && (
            <p className="editor-muted">No services yet — add your first one.</p>
          )}

          {services.map((service, index) => {
            return (
              <article
                key={service.id}
                className={editingId === service.id ? "editor-item active" : "editor-item"}
              >
                <div className="editor-item-thumb editor-item-icon">
                  <ServiceIcon name={service.icon} size={18} strokeWidth={1.6} />
                </div>

                <div className="editor-item-info">
                  <h3>{service.title}</h3>
                  <p>
                    {service.category || "No label"}
                    {service.startingPrice && <span> · {service.startingPrice}</span>}
                  </p>
                </div>

                <div className="editor-item-actions">
                  <button onClick={() => move(index, -1)} disabled={index === 0} aria-label="Move up">
                    <ArrowUp size={14} />
                  </button>
                  <button
                    onClick={() => move(index, 1)}
                    disabled={index === services.length - 1}
                    aria-label="Move down"
                  >
                    <ArrowDown size={14} />
                  </button>
                  <button onClick={() => startEditing(service)} aria-label={`Edit ${service.title}`}>
                    <Pencil size={14} />
                  </button>
                  <button
                    className="editor-danger"
                    onClick={() => handleDelete(service)}
                    aria-label={`Delete ${service.title}`}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </article>
            );
          })}
        </aside>
      </div>
    </>
  );
}
