import { Router, type IRouter } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

router.post("/push-token", async (req, res) => {
  try {
    const { userId, pushToken } = req.body;
    if (!userId || !pushToken) {
      return res.status(400).json({ error: "userId and pushToken required" });
    }

    await db
      .update(usersTable)
      .set({ pushToken })
      .where(eq(usersTable.id, userId));

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
