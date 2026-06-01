import { pgTable, text, serial, timestamp, integer, real, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const captionStyleSchema = z.object({
  fontFamily: z.string(),
  fontSize: z.number().int(),
  fontWeight: z.string(),
  color: z.string(),
  backgroundColor: z.string(),
  position: z.enum(["bottom", "top", "middle"]),
  textAlign: z.enum(["left", "center", "right"]),
  textShadow: z.boolean(),
  italic: z.boolean(),
  uppercase: z.boolean(),
});

export type CaptionStyle = z.infer<typeof captionStyleSchema>;

export const defaultCaptionStyle: CaptionStyle = {
  fontFamily: "Inter",
  fontSize: 32,
  fontWeight: "700",
  color: "#FFFFFF",
  backgroundColor: "rgba(0,0,0,0.5)",
  position: "bottom",
  textAlign: "center",
  textShadow: true,
  italic: false,
  uppercase: false,
};

export const projectsTable = pgTable("projects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  mediaUrl: text("media_url"),
  duration: real("duration"),
  style: jsonb("style").notNull().$type<CaptionStyle>().default(defaultCaptionStyle),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertProjectSchema = createInsertSchema(projectsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projectsTable.$inferSelect;
