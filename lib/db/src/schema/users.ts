import { pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const usersTable = pgTable("users", {
  id: text("id").primaryKey(),
  username: varchar("username", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  siteName: varchar("site_name", { length: 255 }),
  siteAddress: text("site_address"),
  transportAddress: text("transport_address"),
  gstNumber: varchar("gst_number", { length: 50 }),
  mobile1: varchar("mobile1", { length: 20 }),
  mobile2: varchar("mobile2", { length: 20 }),
  appUsage: text("app_usage"),
  fuelType: text("fuel_type"),
  role: varchar("role", { length: 20 }).notNull().default("customer"),
  pushToken: text("push_token"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({ createdAt: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;
