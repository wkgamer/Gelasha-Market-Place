import { Router, type IRouter } from "express";
import { db, likesTable, productsTable } from "@workspace/db";
import { and, eq } from "drizzle-orm";

const router: IRouter = Router();

function generateId(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

function formatProduct(p: typeof productsTable.$inferSelect) {
  return {
    id: p.id,
    name: p.name,
    description: p.description,
    price: parseFloat(p.price as string),
    originalPrice: p.originalPrice ? parseFloat(p.originalPrice as string) : undefined,
    category: p.category,
    imageUrl: p.imageUrl,
    images: p.images || [],
    rating: parseFloat(p.rating as string),
    reviewCount: p.reviewCount,
    inStock: p.inStock,
    brand: p.brand,
    discount: p.discount || 0,
  };
}

router.get("/", async (req, res) => {
  try {
    const userId = req.query.userId as string;
    if (!userId) return res.status(400).json({ error: "userId required" });

    const likes = await db
      .select()
      .from(likesTable)
      .where(eq(likesTable.userId, userId));

    const products = await Promise.all(
      likes.map(async (like) => {
        const prods = await db
          .select()
          .from(productsTable)
          .where(eq(productsTable.id, like.productId));
        return prods.length > 0 ? formatProduct(prods[0]) : null;
      })
    );

    res.json(products.filter(Boolean));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { userId, productId } = req.body;
    if (!userId || !productId) return res.status(400).json({ error: "Missing fields" });

    const existing = await db
      .select()
      .from(likesTable)
      .where(and(eq(likesTable.userId, userId), eq(likesTable.productId, productId)));

    if (existing.length > 0) {
      await db
        .delete(likesTable)
        .where(and(eq(likesTable.userId, userId), eq(likesTable.productId, productId)));
      res.json({ liked: false });
    } else {
      await db.insert(likesTable).values({
        id: generateId(),
        userId,
        productId,
      });
      res.json({ liked: true });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
