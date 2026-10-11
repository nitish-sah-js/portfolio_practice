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

const dataFile = (collection) => path.join(DATA_DIR, `${collection}.json`);

async function readCollection(collection) {
  try {
    return JSON.parse(await fs.readFile(dataFile(collection), "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
}

// Write to a temp file then rename, so a crash never leaves half-written JSON.
async function writeCollection(collection, items) {
  const file = dataFile(collection);
  const tempFile = `${file}.tmp`;
  await fs.writeFile(tempFile, JSON.stringify(items, null, 2));
  await fs.rename(tempFile, file);
}

const asList = (value) =>
  Array.isArray(value)
    ? value.filter((item) => typeof item === "string" && item.trim())
    : [];
const asText = (value) => (typeof value === "string" ? value.trim() : "");

function cleanProject(input) {
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

function cleanService(input) {
  return {
    title: asText(input.title),
    category: asText(input.category),
    description: asText(input.description),
    startingPrice: asText(input.startingPrice),
    icon: asText(input.icon),
  };
}

// Each editable homepage section is one JSON file in /data.
const COLLECTIONS = {
  projects: cleanProject,
  services: cleanService,
};

function collectionParam(req, res, next) {
  if (!Object.hasOwn(COLLECTIONS, req.params.collection)) {
    return res.status(404).json({ error: "Unknown section." });
  }
  next();
}

// Only removes files that live in our uploads folder.
async function deleteUploads(urls) {
  for (const url of urls) {
    if (!url?.startsWith("/uploads/")) continue;
    const filePath = path.join(UPLOAD_DIR, path.basename(url));
    await fs.unlink(filePath).catch(() => {});
  }
}

function mediaOf(item) {
  return [item.thumbnail, ...(item.images || []), ...(item.videos || [])];
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

app.get("/api/:collection", collectionParam, async (req, res, next) => {
  try {
    res.json(await readCollection(req.params.collection));
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

app.post("/api/:collection", requireAdmin, collectionParam, async (req, res, next) => {
  try {
    const { collection } = req.params;
    const data = COLLECTIONS[collection](req.body || {});
    if (!data.title) return res.status(400).json({ error: "Title is required." });

    const items = await readCollection(collection);
    const item = { id: crypto.randomUUID(), ...data, createdAt: new Date().toISOString() };
    // New work goes first; new services go at the end, like adding a card.
    if (collection === "projects") items.unshift(item);
    else items.push(item);
    await writeCollection(collection, items);
    res.status(201).json(item);
  } catch (error) {
    next(error);
  }
});

// Registered before "/:id" so "order" is not treated as an id.
app.put("/api/:collection/order", requireAdmin, collectionParam, async (req, res, next) => {
  try {
    const { collection } = req.params;
    const ids = Array.isArray(req.body?.ids) ? req.body.ids.map(String) : [];
    const items = await readCollection(collection);
    const byId = new Map(items.map((item) => [String(item.id), item]));
    const ordered = ids.map((id) => byId.get(id)).filter(Boolean);
    const rest = items.filter((item) => !ids.includes(String(item.id)));
    await writeCollection(collection, [...ordered, ...rest]);
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

app.put("/api/:collection/:id", requireAdmin, collectionParam, async (req, res, next) => {
  try {
    const { collection, id } = req.params;
    const data = COLLECTIONS[collection](req.body || {});
    if (!data.title) return res.status(400).json({ error: "Title is required." });

    const items = await readCollection(collection);
    const index = items.findIndex((item) => String(item.id) === id);
    if (index === -1) return res.status(404).json({ error: "Not found." });

    const previous = items[index];
    const updated = { ...previous, ...data, updatedAt: new Date().toISOString() };
    items[index] = updated;
    await writeCollection(collection, items);

    // Clean up files that were removed from this item.
    const kept = new Set(mediaOf(updated));
    await deleteUploads(mediaOf(previous).filter((url) => !kept.has(url)));

    res.json(updated);
  } catch (error) {
    next(error);
  }
});

app.delete("/api/:collection/:id", requireAdmin, collectionParam, async (req, res, next) => {
  try {
    const { collection, id } = req.params;
    const items = await readCollection(collection);
    const item = items.find((entry) => String(entry.id) === id);
    if (!item) return res.status(404).json({ error: "Not found." });

    await writeCollection(collection, items.filter((entry) => entry !== item));
    await deleteUploads(mediaOf(item));
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
