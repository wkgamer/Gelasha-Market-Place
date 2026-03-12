import { Router, type IRouter } from "express";
import { db, ordersTable, productsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

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

    const orders = await db
      .select()
      .from(ordersTable)
      .where(eq(ordersTable.userId, userId));

    const enriched = await Promise.all(
      orders.map(async (order) => {
        const products = await db
          .select()
          .from(productsTable)
          .where(eq(productsTable.id, order.productId));

        return {
          id: order.id,
          userId: order.userId,
          productId: order.productId,
          product: products.length > 0 ? formatProduct(products[0]) : null,
          quantity: order.quantity,
          totalPrice: parseFloat(order.totalPrice as string),
          status: order.status,
          createdAt: order.createdAt.toISOString(),
        };
      })
    );

    res.json(enriched.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { userId, productId, quantity } = req.body;
    if (!userId || !productId || !quantity) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const products = await db
      .select()
      .from(productsTable)
      .where(eq(productsTable.id, productId));

    if (products.length === 0) return res.status(404).json({ error: "Product not found" });

    const product = products[0];
    const totalPrice = parseFloat(product.price as string) * quantity;
    const id = generateId();

    await db.insert(ordersTable).values({
      id,
      userId,
      productId,
      quantity,
      totalPrice: totalPrice.toFixed(2),
      status: "confirmed",
    });

    const order = (await db.select().from(ordersTable).where(eq(ordersTable.id, id)))[0];

    res.json({
      id: order.id,
      userId: order.userId,
      productId: order.productId,
      product: formatProduct(product),
      quantity: order.quantity,
      totalPrice: parseFloat(order.totalPrice as string),
      status: order.status,
      createdAt: order.createdAt.toISOString(),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
