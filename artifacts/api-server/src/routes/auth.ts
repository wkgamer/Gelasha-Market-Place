import { Router, type IRouter } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import crypto from "crypto";

const router: IRouter = Router();

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password + "gelasha_salt").digest("hex");
}

function generateId(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

router.post("/signup", async (req, res) => {
  try {
    const { username, email, password, siteName, siteAddress, transportAddress, gstNumber, mobile1, mobile2, appUsage, fuelType } = req.body;

    if (!username || !email || !password || !mobile1) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const existing = await db.select().from(usersTable).where(eq(usersTable.email, email));
    if (existing.length > 0) {
      return res.status(400).json({ error: "Email already registered" });
    }

    const id = generateId();
    const passwordHash = hashPassword(password);

    await db.insert(usersTable).values({
      id,
      username,
      email,
      passwordHash,
      siteName: siteName || null,
      siteAddress: siteAddress || null,
      transportAddress: transportAddress || null,
      gstNumber: gstNumber || null,
      mobile1: mobile1 || null,
      mobile2: mobile2 || null,
      appUsage: appUsage || null,
      fuelType: fuelType || null,
      role: "customer",
    });

    const user = await db.select().from(usersTable).where(eq(usersTable.id, id));

    const { passwordHash: _, ...safeUser } = user[0];

    res.json({
      user: { ...safeUser, createdAt: safeUser.createdAt.toISOString() },
      token: id,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/signin", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Missing email or password" });
    }

    const users = await db.select().from(usersTable).where(eq(usersTable.email, email));

    if (users.length === 0) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const user = users[0];
    const passwordHash = hashPassword(password);

    if (user.passwordHash !== passwordHash) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const { passwordHash: _, ...safeUser } = user;

    res.json({
      user: { ...safeUser, createdAt: safeUser.createdAt.toISOString() },
      token: user.id,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/me", async (req, res) => {
  try {
    const userId = req.query.userId as string;
    if (!userId) return res.status(400).json({ error: "userId required" });

    const users = await db.select().from(usersTable).where(eq(usersTable.id, userId));
    if (users.length === 0) return res.status(404).json({ error: "User not found" });

    const { passwordHash: _, ...safeUser } = users[0];
    res.json({ ...safeUser, createdAt: safeUser.createdAt.toISOString() });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
