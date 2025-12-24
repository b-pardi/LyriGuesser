/**
 * index.js
 *
 * This is the main backend entry point.
 * It starts an Express server and defines your API routes.
 */

require("dotenv").config(); // loads .env into process.env

const express = require("express");
const cors = require("cors");
const { PrismaClient } = require("@prisma/client");
const { register, verifyEmail, login } = require("./auth");
const { requireAuth, requireAdmin } = require("./middleware");

const prisma = new PrismaClient();
const app = express();

/**
 * CORS:
 * Your frontend runs on http://localhost:5173
 * Your backend runs on http://localhost:8080
 * Browsers block cross-origin calls unless the server explicitly allows it.
 */
app.use(
  cors({
    origin: process.env.APP_ORIGIN,
    credentials: false, // we use Bearer token auth (not cookies) for now
  })
);

// Parses JSON request bodies and places result in req.body
app.use(express.json());

/**
 * Because SQLite + Prisma v5 doesn't enforce enums,
 * we enforce allowed values here in the API.
 */
const GENRES = new Set(["EMO", "POP"]);
function isValidGenre(v) {
  return typeof v === "string" && GENRES.has(v);
}

/**
 * Health check endpoint
 * Useful to test if backend is running.
 */
app.get("/api/health", (req, res) => {
  return res.json({ ok: true });
});

/**
 * ============================
 * AUTH ROUTES
 * ============================
 */

app.post("/api/auth/register", async (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ error: "Missing email/password" });
  }

  try {
    const out = await register(prisma, { email, password });

    // In dev we include verifyUrl for convenience, so you aren't blocked by SMTP setup
    return res.json({ ok: true, user: out.user, verifyUrl: out.verifyUrl });
  } catch (err) {
    // Most common: email already exists (unique constraint)
    return res.status(400).json({ ok: false, error: "Register failed (email may already exist)" });
  }
});

app.post("/api/auth/verify", async (req, res) => {
  const { email, token } = req.body || {};
  if (!email || !token) {
    return res.status(400).json({ error: "Missing email/token" });
  }

  const out = await verifyEmail(prisma, { email, token });
  if (!out.ok) return res.status(400).json(out);

  return res.json(out);
});

app.post("/api/auth/login", async (req, res) => {
  const out = await login(prisma, req.body || {});
  if (!out.ok) return res.status(400).json(out);
  return res.json(out);
});

/**
 * ============================
 * LYRICS ROUTES
 * ============================
 */

// Anyone can read global lyrics (optionally filtered by genres)
app.get("/api/lyrics/global", async (req, res) => {
  /**
   * Optional query param:
   *   /api/lyrics/global?genreIds=id1,id2,id3
   * If omitted, returns all global lyrics.
   */
  const genreIdsRaw = req.query.genreIds; // string like "id1,id2"
  const genreIds =
    typeof genreIdsRaw === "string" && genreIdsRaw.trim().length > 0
      ? genreIdsRaw.split(",").map((s) => s.trim()).filter(Boolean)
      : null;

  const lyrics = await prisma.lyric.findMany({
    where: {
      scope: "GLOBAL",
      ...(genreIds ? { genreId: { in: genreIds } } : {}),
      genre: { isActive: true },
    },
    select: {
      id: true,
      text: true,
      songTitle: true,
      artist: true,
      genre: { select: { id: true, key: true, label: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return res.json({ ok: true, lyrics });
});

// Logged-in users can read their personal lyrics
app.get("/api/lyrics/mine", requireAuth, async (req, res) => {
  const lyrics = await prisma.lyric.findMany({
    where: { scope: "PERSONAL", ownerId: req.user.sub, genre: { isActive: true } },
    select: {
      id: true,
      text: true,
      songTitle: true,
      artist: true,
      genre: { select: { id: true, key: true, label: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return res.json({ ok: true, lyrics });
});

// Logged-in users can add a personal lyric
app.post("/api/lyrics/mine", requireAuth, async (req, res) => {
  const { text, genreId, songTitle, artist } = req.body || {};

  if (!text || !genreId || !songTitle || !artist) {
    return res.status(400).json({
      error: "Missing text, genreId, songTitle, or artist",
    });
  }

  // Ensure genre exists and is active
  const genre = await prisma.genre.findFirst({
    where: { id: genreId, isActive: true },
    select: { id: true },
  });
  if (!genre) return res.status(400).json({ error: "Invalid genreId" });

  const lyric = await prisma.lyric.create({
    data: {
      text: text.trim(),
      songTitle: songTitle.trim(),
      artist: artist.trim(),
      genreId,
      scope: "PERSONAL",
      ownerId: req.user.sub,
    },
    select: {
      id: true,
      text: true,
      songTitle: true,
      artist: true,
      genre: { select: { id: true, key: true, label: true } },
    },
  });

  return res.json({ ok: true, lyric });
});

// Admin can add global lyrics
app.post("/api/lyrics/global", requireAuth, requireAdmin, async (req, res) => {
  const { text, genreId, songTitle, artist } = req.body || {};

  if (!text || !genreId || !songTitle || !artist) {
    return res.status(400).json({
      error: "Missing text, genreId, songTitle, or artist",
    });
  }

  const genre = await prisma.genre.findFirst({
    where: { id: genreId, isActive: true },
    select: { id: true },
  });
  if (!genre) return res.status(400).json({ error: "Invalid genreId" });

  const lyric = await prisma.lyric.create({
    data: { text: text.trim(), genreId, scope: "GLOBAL" },
    select: {
      id: true,
      text: true,
      songTitle: true,
      artist: true,
      genre: { select: { id: true, key: true, label: true } },
    },
  });

  return res.json({ ok: true, lyric });
});

/**
 * ============================
 * GENRES ROUTES
 * ============================
 *
 * Public: anyone can read active genres.
 * Admin: can create genres.
 */

app.get("/api/genres", async (req, res) => {
  const genres = await prisma.genre.findMany({
    where: { isActive: true },
    select: { id: true, key: true, label: true },
    orderBy: { label: "asc" },
  });
  return res.json({ ok: true, genres });
});

app.post("/api/genres", requireAuth, requireAdmin, async (req, res) => {
  const { key, label } = req.body || {};

  // key: "metal" "pop" etc
  if (!key || !label) {
    return res.status(400).json({ error: "Missing key/label" });
  }

  const cleanKey = String(key).trim().toLowerCase();

  const genre = await prisma.genre.create({
    data: { key: cleanKey, label: String(label).trim(), isActive: true },
    select: { id: true, key: true, label: true },
  });

  return res.json({ ok: true, genre });
});


/**
 * Start the server
 */
const port = Number(process.env.PORT || 8080);
app.listen(port, () => {
  console.log(`Backend API running at http://localhost:${port}`);
  console.log(`Health check: http://localhost:${port}/api/health`);
});
