import { useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  ArrowDown,
  ArrowUp,
  ImagePlus,
  Film,
  Pencil,
  Trash2,
  X,
  LogOut,
  Plus,
} from "lucide-react";
import { categories } from "../data/projects";
import {
  getSavedPassword,
  login,
  projectsApi,
  savePassword,
  uploadFiles,
} from "../data/api";
import ServicesManager from "./EditorServices";
import "./Editor.css";

const emptyProject = {
  title: "",
  category: "",
  description: "",
  price: "",
  thumbnail: "",
  images: [],
  videos: [],
  youtubeUrl: "",
};

export default function Editor() {
  const [authed, setAuthed] = useState(Boolean(getSavedPassword()));

  if (!authed) return <EditorLogin onLogin={() => setAuthed(true)} />;

  return (
    <EditorDashboard
      onLogout={() => {
        savePassword("");
        setAuthed(false);
      }}
    />
  );
}

function EditorLogin({ onLogin }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await login(password);
      savePassword(password);
      onLogin();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="editor-page editor-login-page">
      <form className="editor-login" onSubmit={handleSubmit}>
        <p className="editor-label">PRIVATE / EDITOR</p>
        <h1>
          WELCOME
          <br />
          <span>BACK.</span>
        </h1>

        <label className="editor-field">
          <span>Password</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoFocus
            required
          />
        </label>

        {error && <p className="editor-error">{error}</p>}

        <button className="editor-primary" type="submit" disabled={busy}>
          {busy ? "Checking…" : "Enter editor"}
        </button>

        <a className="editor-back" href="/">
          <ArrowLeft size={15} /> Back to site
        </a>
      </form>
    </main>
  );
}

function EditorDashboard({ onLogout }) {
  const [tab, setTab] = useState("work");
  const [message, setMessage] = useState(null);

  // Stable so the managers can load their data once on mount.
  const showMessage = useCallback((text, isError = false) => {
    setMessage(text ? { text, isError } : null);
  }, []);

  // A 401 means the saved password is no longer valid — send back to login.
  function handleError(err) {
    if (err.status === 401) return onLogout();
    showMessage(err.message, true);
  }

  function switchTab(next) {
    setTab(next);
    setMessage(null);
  }

  const toast = message && (
    <p className={message.isError ? "editor-toast editor-toast-error" : "editor-toast"}>
      {message.text}
      <button onClick={() => setMessage(null)} aria-label="Dismiss">
        <X size={14} />
      </button>
    </p>
  );

  const Manager = tab === "work" ? WorkManager : ServicesManager;

  return (
    <main className="editor-page">
      <header className="editor-topbar">
        <a href="/" className="editor-logo">
          niikzz<span>static.in</span>
        </a>
        <div className="editor-topbar-actions">
          <a href={tab === "work" ? "/#portfolio" : "/#services"} className="editor-ghost">
            View site <ArrowUpRight size={15} />
          </a>
          <button className="editor-ghost" onClick={onLogout}>
            <LogOut size={15} /> Log out
          </button>
        </div>
      </header>

      <nav className="editor-tabs" aria-label="Editor sections">
        <button
          className={tab === "work" ? "editor-tab active" : "editor-tab"}
          onClick={() => switchTab("work")}
        >
          Work
        </button>
        <button
          className={tab === "services" ? "editor-tab active" : "editor-tab"}
          onClick={() => switchTab("services")}
        >
          Services
        </button>
      </nav>

      <Manager toast={toast} showMessage={showMessage} handleError={handleError} />
    </main>
  );
}

function WorkManager({ toast, showMessage, handleError }) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyProject);
  const [editingId, setEditingId] = useState(null);
  const [uploading, setUploading] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    projectsApi.list()
      .then(setProjects)
      .catch((err) => showMessage(err.message, true))
      .finally(() => setLoading(false));
  }, [showMessage]);

  const categoryOptions = [
    ...new Set([...categories, ...projects.map((p) => p.category).filter(Boolean)]),
  ];

  function setField(name, value) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  function resetForm() {
    setForm(emptyProject);
    setEditingId(null);
  }

  function startEditing(project) {
    setForm({ ...emptyProject, ...project, images: project.images || [], videos: project.videos || [] });
    setEditingId(project.id);
    showMessage(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleUpload(event, kind) {
    const files = event.target.files;
    if (!files?.length) return;

    setUploading(kind);
    try {
      const uploaded = await uploadFiles(files);
      const urls = uploaded.map((file) => file.url);

      if (kind === "thumbnail") setField("thumbnail", urls[0]);
      else setForm((current) => ({ ...current, [kind]: [...current[kind], ...urls] }));
    } catch (err) {
      handleError(err);
    } finally {
      setUploading("");
      event.target.value = "";
    }
  }

  function removeMedia(kind, url) {
    setForm((current) => ({
      ...current,
      [kind]: current[kind].filter((item) => item !== url),
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        const updated = await projectsApi.update(editingId, form);
        setProjects((list) => list.map((p) => (p.id === editingId ? updated : p)));
        showMessage("Work updated. It's live on the homepage.");
      } else {
        const created = await projectsApi.create(form);
        setProjects((list) => [created, ...list]);
        showMessage("Work added. It's live on the homepage.");
      }
      resetForm();
    } catch (err) {
      handleError(err);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(project) {
    if (!window.confirm(`Delete "${project.title}"? This can't be undone.`)) return;
    try {
      await projectsApi.remove(project.id);
      setProjects((list) => list.filter((p) => p.id !== project.id));
      if (editingId === project.id) resetForm();
      showMessage("Work deleted.");
    } catch (err) {
      handleError(err);
    }
  }

  async function move(index, direction) {
    const next = [...projects];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setProjects(next);
    try {
      await projectsApi.reorder(next.map((p) => p.id));
    } catch (err) {
      handleError(err);
    }
  }

  return (
    <>
      <section className="editor-heading">
        <div>
          <p className="editor-label">EDITOR / MANAGE WORK</p>
          <h1>
            {editingId ? "EDIT" : "ADD"} YOUR
            <br />
            <span>WORK.</span>
          </h1>
        </div>
        <p className="editor-description">
          Everything you save here shows up instantly in the portfolio section
          of your homepage.
        </p>
      </section>

      {toast}

      <div className="editor-layout">
        <form className="editor-form" onSubmit={handleSubmit}>
          <label className="editor-field">
            <span>Title *</span>
            <input
              value={form.title}
              onChange={(e) => setField("title", e.target.value)}
              placeholder="e.g. Luxury Villa Walkthrough"
              required
            />
          </label>

          <div className="editor-row">
            <label className="editor-field">
              <span>Category</span>
              <input
                list="editor-categories"
                value={form.category}
                onChange={(e) => setField("category", e.target.value)}
                placeholder="Pick or type a new one"
              />
              <datalist id="editor-categories">
                {categoryOptions.map((category) => (
                  <option key={category} value={category} />
                ))}
              </datalist>
            </label>

            <label className="editor-field">
              <span>Charges</span>
              <input
                value={form.price}
                onChange={(e) => setField("price", e.target.value)}
                placeholder="e.g. ₹1,499 or Starting ₹999"
              />
            </label>
          </div>

          <label className="editor-field">
            <span>Description</span>
            <textarea
              rows={5}
              value={form.description}
              onChange={(e) => setField("description", e.target.value)}
              placeholder="What was the project, what did you do, what tools…"
            />
          </label>

          <label className="editor-field">
            <span>YouTube link (optional)</span>
            <input
              type="url"
              value={form.youtubeUrl}
              onChange={(e) => setField("youtubeUrl", e.target.value)}
              placeholder="https://youtube.com/watch?v=…"
            />
          </label>

          {/* Cover image */}
          <div className="editor-field">
            <span>Cover image</span>
            <div className="editor-media-grid">
              {form.thumbnail && (
                <MediaTile
                  url={form.thumbnail}
                  type="image"
                  onRemove={() => setField("thumbnail", "")}
                />
              )}
              {!form.thumbnail && (
                <UploadTile
                  icon={<ImagePlus size={20} />}
                  label={uploading === "thumbnail" ? "Uploading…" : "Upload cover"}
                  accept="image/*"
                  disabled={Boolean(uploading)}
                  onChange={(e) => handleUpload(e, "thumbnail")}
                />
              )}
            </div>
            <input
              className="editor-subinput"
              value={form.thumbnail.startsWith("/uploads/") ? "" : form.thumbnail}
              onChange={(e) => setField("thumbnail", e.target.value)}
              placeholder="…or paste an image URL"
            />
          </div>

          {/* Images */}
          <div className="editor-field">
            <span>Images</span>
            <div className="editor-media-grid">
              {form.images.map((url) => (
                <MediaTile key={url} url={url} type="image" onRemove={() => removeMedia("images", url)} />
              ))}
              <UploadTile
                icon={<ImagePlus size={20} />}
                label={uploading === "images" ? "Uploading…" : "Add images"}
                accept="image/*"
                multiple
                disabled={Boolean(uploading)}
                onChange={(e) => handleUpload(e, "images")}
              />
            </div>
          </div>

          {/* Videos */}
          <div className="editor-field">
            <span>Videos</span>
            <div className="editor-media-grid">
              {form.videos.map((url) => (
                <MediaTile key={url} url={url} type="video" onRemove={() => removeMedia("videos", url)} />
              ))}
              <UploadTile
                icon={<Film size={20} />}
                label={uploading === "videos" ? "Uploading…" : "Add videos"}
                accept="video/*"
                multiple
                disabled={Boolean(uploading)}
                onChange={(e) => handleUpload(e, "videos")}
              />
            </div>
          </div>

          <div className="editor-form-actions">
            <button className="editor-primary" type="submit" disabled={saving || Boolean(uploading)}>
              {saving ? "Saving…" : editingId ? "Save changes" : (
                <>
                  <Plus size={16} /> Add to portfolio
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

        <aside className="editor-list">
          <p className="editor-label">
            {String(projects.length).padStart(2, "0")} / PUBLISHED WORK
          </p>

          {loading && <p className="editor-muted">Loading…</p>}
          {!loading && projects.length === 0 && (
            <p className="editor-muted">Nothing yet — add your first work.</p>
          )}

          {projects.map((project, index) => (
            <article
              key={project.id}
              className={editingId === project.id ? "editor-item active" : "editor-item"}
            >
              <div className="editor-item-thumb">
                {project.thumbnail || project.images?.[0] ? (
                  <img src={project.thumbnail || project.images[0]} alt="" />
                ) : (
                  <Film size={18} />
                )}
              </div>

              <div className="editor-item-info">
                <h3>{project.title}</h3>
                <p>
                  {project.category || "No category"}
                  {project.price && <span> · {project.price}</span>}
                </p>
              </div>

              <div className="editor-item-actions">
                <button onClick={() => move(index, -1)} disabled={index === 0} aria-label="Move up">
                  <ArrowUp size={14} />
                </button>
                <button
                  onClick={() => move(index, 1)}
                  disabled={index === projects.length - 1}
                  aria-label="Move down"
                >
                  <ArrowDown size={14} />
                </button>
                <button onClick={() => startEditing(project)} aria-label={`Edit ${project.title}`}>
                  <Pencil size={14} />
                </button>
                <button
                  className="editor-danger"
                  onClick={() => handleDelete(project)}
                  aria-label={`Delete ${project.title}`}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </article>
          ))}
        </aside>
      </div>
    </>
  );
}

function MediaTile({ url, type, onRemove }) {
  return (
    <div className="editor-media-tile">
      {type === "video" ? (
        <video src={url} muted preload="metadata" />
      ) : (
        <img src={url} alt="" />
      )}
      <button type="button" onClick={onRemove} aria-label="Remove">
        <X size={14} />
      </button>
    </div>
  );
}

function UploadTile({ icon, label, onChange, ...inputProps }) {
  return (
    <label className={`editor-upload-tile ${inputProps.disabled ? "disabled" : ""}`}>
      {icon}
      <span>{label}</span>
      <input type="file" onChange={onChange} hidden {...inputProps} />
    </label>
  );
}
