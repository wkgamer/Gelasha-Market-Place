import { Router, type IRouter } from "express";
import { db, ordersTable, productsTable, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { sendPushNotifications } from "../lib/sendPushNotifications";

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
    variants: p.variants || [],
  };
}

function formatUser(u: typeof usersTable.$inferSelect) {
  return {
    id: u.id,
    username: u.username,
    email: u.email,
    siteName: u.siteName,
    siteAddress: u.siteAddress,
    transportAddress: u.transportAddress,
    gstNumber: u.gstNumber,
    mobile1: u.mobile1,
    mobile2: u.mobile2,
    appUsage: u.appUsage,
    fuelType: u.fuelType,
    role: u.role,
    createdAt: u.createdAt.toISOString(),
  };
}

router.get("/all", async (req, res) => {
  try {
    const orders = await db.select().from(ordersTable);

    const enriched = await Promise.all(
      orders.map(async (order) => {
        const [products, users] = await Promise.all([
          db.select().from(productsTable).where(eq(productsTable.id, order.productId)),
          db.select().from(usersTable).where(eq(usersTable.id, order.userId)),
        ]);

        return {
          id: order.id,
          userId: order.userId,
          productId: order.productId,
          product: products.length > 0 ? formatProduct(products[0]) : null,
          client: users.length > 0 ? formatUser(users[0]) : null,
          quantity: order.quantity,
          totalPrice: parseFloat(order.totalPrice as string),
          status: order.status,
          variants: order.variants || [],
          notes: order.notes || null,
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
          variants: order.variants || [],
          notes: order.notes || null,
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
    const { userId, productId, quantity, variants, notes } = req.body;
    if (!userId || !productId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const products = await db
      .select()
      .from(productsTable)
      .where(eq(productsTable.id, productId));

    if (products.length === 0) return res.status(404).json({ error: "Product not found" });

    const product = products[0];
    const qty = quantity || 1;
    const totalPrice = parseFloat(product.price as string) * qty;
    const id = generateId();

    await db.insert(ordersTable).values({
      id,
      userId,
      productId,
      quantity: qty,
      totalPrice: totalPrice.toFixed(2),
      status: "confirmed",
      variants: variants || [],
      notes: notes || null,
    });

    const order = (await db.select().from(ordersTable).where(eq(ordersTable.id, id)))[0];

    const operators = await db
      .select({ pushToken: usersTable.pushToken })
      .from(usersTable)
      .where(eq(usersTable.role, "operator"));

    const tokens = operators
      .map((o) => o.pushToken)
      .filter((t): t is string => !!t);

    sendPushNotifications(
      tokens,
      "New Purchase Order",
      "You received a new purchase order.",
      { screen: "operator/orders" }
    );

    res.json({
      id: order.id,
      userId: order.userId,
      productId: order.productId,
      product: formatProduct(product),
      quantity: order.quantity,
      totalPrice: parseFloat(order.totalPrice as string),
      status: order.status,
      variants: order.variants || [],
      notes: order.notes || null,
      createdAt: order.createdAt.toISOString(),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
