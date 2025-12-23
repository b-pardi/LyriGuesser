/**
 * auth.js
 *
 * This file contains the core authentication logic:
 *  - register: create user + create verification token + attempt to email it
 *  - verifyEmail: validate token and mark user verified
 *  - login: check password + verified status + return JWT token
 */

const bcrypt = require("bcrypt");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const { makeTransport } = require("./mailer");

/**
 * Hash helper.
 * We store token hashes in the DB (safer than storing raw tokens).
 */
function sha256(s) {
  return crypto.createHash("sha256").update(s).digest("hex");
}

/**
 * register(prisma, {email, password})
 */
async function register(prisma, { email, password }) {
  const cleanEmail = email.toLowerCase().trim();

  // Hash password so we NEVER store plaintext passwords
  const passwordHash = await bcrypt.hash(password, 12);

  // Create user
  const user = await prisma.user.create({
    data: {
      email: cleanEmail,
      passwordHash,
      role: "USER",        // stored as string in SQLite
      isVerified: false,
    },
    select: { id: true, email: true, isVerified: true, role: true },
  });

  // Create verification token
  const rawToken = crypto.randomBytes(32).toString("hex"); // what user sees
  const tokenHash = sha256(rawToken);                      // what DB stores

  // Token expires in 24 hours
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24);

  await prisma.verifyToken.create({
    data: { tokenHash, expiresAt, userId: user.id },
  });

  // Build verify URL for frontend
  const verifyUrl =
    `${process.env.APP_ORIGIN}/verify` +
    `?token=${rawToken}&email=${encodeURIComponent(user.email)}`;

  // Attempt to send email, but do not crash if SMTP isn't running
  try {
    const transport = makeTransport();
    await transport.sendMail({
      from: process.env.SMTP_FROM,
      to: user.email,
      subject: "Verify your email",
      text: `Click to verify: ${verifyUrl}`,
    });
  } catch (err) {
    // In dev, it's super common you don't have SMTP. We'll log the link instead.
    console.log("\n[DEV EMAIL FALLBACK] Could not send email.");
    console.log("Verification link (copy/paste into browser):");
    console.log(verifyUrl, "\n");
  }

  // Return user data (not passwordHash)
  return { user, verifyUrl }; // verifyUrl included to help dev
}

/**
 * verifyEmail(prisma, {email, token})
 */
async function verifyEmail(prisma, { email, token }) {
  const cleanEmail = email.toLowerCase().trim();
  const tokenHash = sha256(token);

  // Look up token row that matches BOTH tokenHash and the user's email
  const vt = await prisma.verifyToken.findFirst({
    where: {
      tokenHash,
      user: { email: cleanEmail },
    },
  });

  if (!vt) return { ok: false, error: "Invalid token" };
  if (vt.expiresAt < new Date()) return { ok: false, error: "Token expired" };

  // Mark user verified
  await prisma.user.update({
    where: { id: vt.userId },
    data: { isVerified: true },
  });

  // Delete token so it cannot be used twice
  await prisma.verifyToken.delete({ where: { id: vt.id } });

  return { ok: true };
}

/**
 * login(prisma, {email, password})
 */
async function login(prisma, { email, password }) {
  const cleanEmail = email.toLowerCase().trim();

  const user = await prisma.user.findUnique({
    where: { email: cleanEmail },
  });

  if (!user) return { ok: false, error: "Invalid credentials" };

  // Compare plaintext password to hashed password
  const okPw = await bcrypt.compare(password, user.passwordHash);
  if (!okPw) return { ok: false, error: "Invalid credentials" };

  if (!user.isVerified) return { ok: false, error: "Email not verified" };

  // JWT token payload: store user id + email + role
  const token = jwt.sign(
    { sub: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  return {
    ok: true,
    token,
    user: { email: user.email, role: user.role },
  };
}

module.exports = { register, verifyEmail, login };
