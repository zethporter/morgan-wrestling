import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { createInsertSchema, createSelectSchema, createUpdateSchema } from "drizzle-orm/zod";

export const calendars = sqliteTable("calendars", {
  id: text({ mode: "text" }).primaryKey(),
  name: text().notNull().unique(),
  color: text(),
  createdAt: integer("created_at", { mode: "timestamp" }).default(
    sql`(unixepoch())`,
  ),
  createdBy: text("created_by").notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).default(
    sql`(unixepoch())`,
  ),
  updatedBy: text("updated_by").notNull(),
});
export const calendarInsertSchema = createInsertSchema(calendars);
export const calendarSelectSchema = createSelectSchema(calendars);

export const calendarEventTypes = sqliteTable("calendar_event_types", {
  id: integer({ mode: "number" }).primaryKey({
    autoIncrement: true,
  }),
  name: text().notNull().unique(),
  calendarId: text("calendar_id")
    .notNull()
    .references(() => calendars.id, {
      onDelete: "cascade",
    }),
  iconType: text("icon_type").notNull().default("NONE"),
  icon: text(),
  color: text(),
});
export const calendarEventTypeInsertSchema =
  createInsertSchema(calendarEventTypes);
export const calendarEventTypeSelectSchema =
  createSelectSchema(calendarEventTypes);

export const calendarEvents = sqliteTable("calendar_events", {
  id: integer({ mode: "number" }).primaryKey({
    autoIncrement: true,
  }),
  title: text().notNull(),
  description: text(),
  location: text(),
  startTime: integer("start_time", { mode: "timestamp" }).notNull(),
  endTime: integer("end_time", { mode: "timestamp" }).notNull(),
  allDay: integer("all_day", { mode: "boolean" }).notNull().default(false),
  calendarId: text("calendar_id")
    .notNull()
    .references(() => calendars.id, {
      onDelete: "cascade",
    }),
  eventTypeId: integer("event_type_id")
    .notNull()
    .references(() => calendarEventTypes.id, {
      onDelete: "cascade",
    }),
  createdAt: integer("created_at", { mode: "timestamp" }).default(
    sql`(unixepoch())`,
  ),
  createdBy: text("created_by").notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).default(
    sql`(unixepoch())`,
  ),
  updatedBy: text("updated_by").notNull(),
});
export const calendarEventInsertSchema = createInsertSchema(calendarEvents);
export const calendarEventSelectSchema = createSelectSchema(calendarEvents);

export const teams = sqliteTable("teams", {
  id: text({ mode: "text" }).primaryKey(),
  name: text().notNull(),
  normalizedName: text("normalized_name").notNull(),
  homeContent: text("home_content"),
  homeContentMetadata: text("home_content_metadata"),
  defaultCalendarId: text("default_calendar_id").references(
    () => calendars.id,
    {
      onDelete: "set null",
    },
  ),
});
export const teamInsertSchema = createInsertSchema(teams, {
  id: (schema) => schema.optional(),
  normalizedName: (schema) => schema.optional(),
});
export const teamUpdateSchema = createUpdateSchema(teams);
export const teamSelectSchema = createSelectSchema(teams);

export const teamPages = sqliteTable("team_pages", {
  id: integer({ mode: "number" }).primaryKey({
    autoIncrement: true,
  }),
  teamId: text("team_id")
    .notNull()
    .references(() => teams.id, {
      onDelete: "cascade",
    }),
  title: text().notNull(),
  sequenceNumber: integer("sequence_number").notNull(),
  content: text(),
  contentMetadata: text('content_metadata'),
  createdAt: integer("created_at", { mode: "timestamp" }).default(
    sql`(unixepoch())`,
  ),
  createdBy: text("created_by").notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).default(
    sql`(unixepoch())`,
  ),
  updatedBy: text("updated_by").notNull(),
});
export const teamPageInsertSchema = createInsertSchema(teamPages);
export const teamPageSelectSchema = createSelectSchema(teamPages);

export const quickLinks = sqliteTable("quick_links", {
  id: integer({ mode: "number" }).primaryKey({
    autoIncrement: true,
  }),
  title: text().notNull(),
  url: text().notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).default(
    sql`(unixepoch())`,
  ),
  createdBy: text("created_by").notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).default(
    sql`(unixepoch())`,
  ),
  updatedBy: text("updated_by").notNull(),
});
export const quickLinkInsertSchema = createInsertSchema(quickLinks);
export const quickLinkSelectSchema = createSelectSchema(quickLinks);

export const teamQuickLinks = sqliteTable("team_quick_links", {
  id: integer({ mode: "number" }).primaryKey({
    autoIncrement: true,
  }),
  teamId: text("team_id").references(() => teams.id, {
    onDelete: "cascade",
  }),
  title: text().notNull(),
  url: text().notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).default(
    sql`(unixepoch())`,
  ),
  createdBy: text("created_by").notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).default(
    sql`(unixepoch())`,
  ),
  updatedBy: text("updated_by").notNull(),
});
export const teamQuickLinkInsertSchema = createInsertSchema(teamQuickLinks);
export const teamQuickLinkSelectSchema = createSelectSchema(teamQuickLinks);
