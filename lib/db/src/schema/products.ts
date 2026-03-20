import { boolean, integer, json, pgTable, text, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export interface ProductVariant {
  id: string;
  name: string;
  price: number;
  image?: string;
  group?: string;
}

export const productsTable = pgTable("products", {
  id: text("id").primaryKey(),
  name: varchar("name", { length: 500 }).notNull(),
  description: text("description").notNull(),
  price: integer("price").notNull(),
  originalPrice: integer("original_price"),
  category: varchar("category", { length: 100 }).notNull(),
  imageUrl: text("image_url").notNull(),
  images: json("images").$type<string[]>().notNull().default([]),
  rating: integer("rating").notNull().default(4),
  reviewCount: integer("review_count").notNull().default(0),
  inStock: boolean("in_stock").notNull().default(true),
  brand: varchar("brand", { length: 255 }).notNull(),
  discount: integer("discount").default(0),
  variants: json("variants").$type<ProductVariant[]>().default([]),
  createdAt: json("created_at").$type<string>(),
});

export const insertProductSchema = createInsertSchema(productsTable).omit({ createdAt: true });
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof productsTable.$inferSelect;
