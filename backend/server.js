import express from "express";
import multer from "multer";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PORT = process.env.PORT || 5000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "change-me";
const DATA_DIR = path.join(__dirname, "data");
const DATA_FILE = path.join(DATA_DIR, "projects.json");
const UPLOAD_DIR = path.join(__dirname, "uploads");
const FRONTEND_DIST = path.join(__dirname, "..", "frontend", "dist");

if (!process.env.ADMIN_PASSWORD) {
  console.warn(
    'ADMIN_PASSWORD is not set — using "change-me". Set it in backend/.env before going live.'
  );
}

mkdirSync(DATA_DIR, { recursive: true });
mkdirSync(UPLOAD_DIR, { recursive: true });

/* ---------- Storage helpers ---------- */

async function readProjects() {
  try {
    return JSON.parse(await fs.readFile(DATA_FILE, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
}

// Write to a temp file then rename, so a crash never leaves half-written JSON.
async function writeProjects(projects) {
  const tempFile = `${DATA_FILE}.tmp`;
  await fs.writeFile(tempFile, JSON.stringify(projects, null, 2));
  await fs.rename(tempFile, DATA_FILE);
}

function cleanProject(input) {
  const asList = (value) =>
    Array.isArray(value)
      ? value.filter((item) => typeof item === "string" && item.trim())
      : [];
  const asText = (value) => (typeof value === "string" ? value.trim() : "");

  return {
    title: asText(input.title),
    category: asText(input.category),
    description: asText(input.description),
    price: asText(input.price),
    thumbnail: asText(input.thumbnail),
    images: asList(input.images),
    videos: asList(input.videos),
    youtubeUrl: asText(input.youtubeUrl),
  };
}

// Only removes files that live in our uploads folder.
async function deleteUploads(urls) {
  for (const url of urls) {
    if (!url?.startsWith("/uploads/")) continue;
    const filePath = path.join(UPLOAD_DIR, path.basename(url));
    await fs.unlink(filePath).catch(() => {});
  }
}

function mediaOf(project) {
  return [project.thumbnail, ...(project.images || []), ...(project.videos || [])];
}

/* ---------- Auth ---------- */

function passwordMatches(given) {
  const a = Buffer.from(String(given || ""));
  const b = Buffer.from(ADMIN_PASSWORD);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function requireAdmin(req, res, next) {
  if (!passwordMatches(req.get("x-admin-password"))) {
    return res.status(401).json({ error: "Wrong password." });
  }
  next();
}

/* ---------- Uploads ---------- */

const upload = multer({
  storage: multer.diskStorage({
    destination: UPLOAD_DIR,
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase().replace(/[^.a-z0-9]/g, "");
      cb(null, `${Date.now()}-${crypto.randomBytes(6).toString("hex")}${ext}`);
    },
  }),
  limits: { fileSize: 500 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ok = file.mimetype.startsWith("image/") || file.mimetype.startsWith("video/");
    cb(ok ? null : new Error("Only image and video files are allowed."), ok);
  },
});

/* ---------- App ---------- */

const app = express();
app.use(express.json({ limit: "1mb" }));
app.use("/uploads", express.static(UPLOAD_DIR, { maxAge: "7d" }));

app.get("/api/projects", async (req, res, next) => {
  try {
    res.json(await readProjects());
  } catch (error) {
    next(error);
  }
});

app.post("/api/login", (req, res) => {
  if (!passwordMatches(req.body?.password)) {
    return res.status(401).json({ error: "Wrong password." });
  }
  res.json({ ok: true });
});

app.post("/api/upload", requireAdmin, upload.array("files", 20), (req, res) => {
  res.json({
    files: req.files.map((file) => ({
      url: `/uploads/${file.filename}`,
      type: file.mimetype.startsWith("video/") ? "video" : "image",
      name: file.originalname,
    })),
  });
});

app.post("/api/projects", requireAdmin, async (req, res, next) => {
  try {
    const data = cleanProject(req.body || {});
    if (!data.title) return res.status(400).json({ error: "Title is required." });

    const projects = await readProjects();
    const project = { id: crypto.randomUUID(), ...data, createdAt: new Date().toISOString() };
    projects.unshift(project);
    await writeProjects(projects);
    res.status(201).json(project);
  } catch (error) {
    next(error);
  }
});

app.put("/api/projects/:id", requireAdmin, async (req, res, next) => {
  try {
    const data = cleanProject(req.body || {});
    if (!data.title) return res.status(400).json({ error: "Title is required." });

    const projects = await readProjects();
    const index = projects.findIndex((project) => String(project.id) === req.params.id);
    if (index === -1) return res.status(404).json({ error: "Project not found." });

    const previous = projects[index];
    const updated = { ...previous, ...data, updatedAt: new Date().toISOString() };
    projects[index] = updated;
    await writeProjects(projects);

    // Clean up files that were removed from this project.
    const kept = new Set(mediaOf(updated));
    await deleteUploads(mediaOf(previous).filter((url) => !kept.has(url)));

    res.json(updated);
  } catch (error) {
    next(error);
  }
});

app.put("/api/projects-order", requireAdmin, async (req, res, next) => {
  try {
    const ids = Array.isArray(req.body?.ids) ? req.body.ids.map(String) : [];
    const projects = await readProjects();
    const byId = new Map(projects.map((project) => [String(project.id), project]));
    const ordered = ids.map((id) => byId.get(id)).filter(Boolean);
    const rest = projects.filter((project) => !ids.includes(String(project.id)));
    await writeProjects([...ordered, ...rest]);
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

app.delete("/api/projects/:id", requireAdmin, async (req, res, next) => {
  try {
    const projects = await readProjects();
    const project = projects.find((item) => String(item.id) === req.params.id);
    if (!project) return res.status(404).json({ error: "Project not found." });

    await writeProjects(projects.filter((item) => item !== project));
    await deleteUploads(mediaOf(project));
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

// In production, serve the built frontend (run `npm run build` in /frontend).
if (existsSync(FRONTEND_DIST)) {
  app.use(express.static(FRONTEND_DIST));
  app.use((req, res, next) => {
    if (req.method !== "GET" || /^\/(api|uploads)\//.test(req.path)) return next();
    res.sendFile(path.join(FRONTEND_DIST, "index.html"));
  });
}

app.use((error, req, res, next) => {
  console.error(error);
  const status = error instanceof multer.MulterError ? 400 : 500;
  res.status(status).json({ error: error.message || "Something went wrong." });
});

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
