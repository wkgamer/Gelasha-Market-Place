import { Router, type IRouter } from "express";
import { db, productsTable } from "@workspace/db";
import type { ProductVariant } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

function generateId(): string {
  return "prod_" + Date.now().toString() + Math.random().toString(36).substr(2, 5);
}

function toInt(value: unknown): number {
  const n = Math.round(parseFloat(String(value)));
  return isNaN(n) ? 0 : n;
}

function formatProduct(p: typeof productsTable.$inferSelect) {
  return {
    id: p.id,
    name: p.name,
    description: p.description,
    price: Number(p.price),
    originalPrice: p.originalPrice != null ? Number(p.originalPrice) : undefined,
    category: p.category,
    imageUrl: p.imageUrl,
    images: (p.images as string[]) || [],
    rating: Number(p.rating),
    reviewCount: p.reviewCount,
    inStock: p.inStock,
    brand: p.brand,
    discount: p.discount || 0,
    variants: (p.variants as ProductVariant[]) || [],
    createdAt: p.createdAt,
  };
}

router.get("/", async (req, res) => {
  try {
    const { category, search } = req.query;
    let products = await db.select().from(productsTable);

    if (category && category !== "All") {
      products = products.filter((p) => p.category === category);
    }
    if (search) {
      const q = (search as string).toLowerCase();
      products = products.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q)
      );
    }

    res.json(products.map(formatProduct));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/categories", async (req, res) => {
  try {
    const products = await db.select({ category: productsTable.category }).from(productsTable);
    const cats = ["All", ...new Set(products.map((p) => p.category))];
    res.json(cats);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const products = await db
      .select()
      .from(productsTable)
      .where(eq(productsTable.id, req.params.id));

    if (products.length === 0) return res.status(404).json({ error: "Product not found" });
    res.json(formatProduct(products[0]));
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/", async (req, res) => {
  try {
    const {
      name, description, price, originalPrice, category,
      imageUrl, images, brand, inStock, discount, variants,
    } = req.body;

    if (!name || price === undefined || price === "" || !category || !imageUrl || !brand || !description) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const id = generateId();
    const priceInt = toInt(price);
    const origPriceInt = originalPrice != null && originalPrice !== "" ? toInt(originalPrice) : null;
    const discountCalc = origPriceInt && priceInt
      ? Math.max(0, Math.round(((origPriceInt - priceInt) / origPriceInt) * 100))
      : toInt(discount ?? 0);

    const imagesArr: string[] = Array.isArray(images)
      ? images
      : imageUrl ? [imageUrl] : [];

    await db.insert(productsTable).values({
      id,
      name: name.trim(),
      description: description.trim(),
      price: priceInt,
      originalPrice: origPriceInt,
      category: category.trim(),
      imageUrl: imageUrl.trim(),
      images: imagesArr,
      brand: brand.trim(),
      inStock: inStock !== false,
      discount: discountCalc,
      variants: variants || [],
      rating: 4,
      reviewCount: 0,
    });

    const created = await db.select().from(productsTable).where(eq(productsTable.id, id));
    res.json(formatProduct(created[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const {
      name, description, price, originalPrice, category,
      imageUrl, images, brand, inStock, discount, variants,
    } = req.body;

    const existing = await db.select().from(productsTable).where(eq(productsTable.id, req.params.id));
    if (existing.length === 0) return res.status(404).json({ error: "Product not found" });

    const priceInt = price != null && price !== "" ? toInt(price) : Number(existing[0].price);
    const origPriceInt = originalPrice != null && originalPrice !== ""
      ? toInt(originalPrice)
      : existing[0].originalPrice != null ? Number(existing[0].originalPrice) : null;

    const discountCalc = origPriceInt && priceInt
      ? Math.max(0, Math.round(((origPriceInt - priceInt) / origPriceInt) * 100))
      : discount != null ? toInt(discount) : (existing[0].discount ?? 0);

    const imagesArr: string[] = images != null
      ? (Array.isArray(images) ? images : [])
      : ((existing[0].images as string[]) || []);

    await db
      .update(productsTable)
      .set({
        name: name?.trim() ?? existing[0].name,
        description: description?.trim() ?? existing[0].description,
        price: priceInt,
        originalPrice: origPriceInt,
        category: category?.trim() ?? existing[0].category,
        imageUrl: imageUrl?.trim() ?? existing[0].imageUrl,
        images: imagesArr,
        brand: brand?.trim() ?? existing[0].brand,
        inStock: inStock !== undefined ? inStock : existing[0].inStock,
        discount: discountCalc,
        variants: variants !== undefined ? variants : (existing[0].variants ?? []),
      })
      .where(eq(productsTable.id, req.params.id));

    const updated = await db.select().from(productsTable).where(eq(productsTable.id, req.params.id));
    res.json(formatProduct(updated[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const existing = await db.select().from(productsTable).where(eq(productsTable.id, req.params.id));
    if (existing.length === 0) return res.status(404).json({ error: "Product not found" });

    await db.delete(productsTable).where(eq(productsTable.id, req.params.id));
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
