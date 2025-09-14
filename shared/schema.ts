import { sql } from "drizzle-orm";
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  real,
  integer,
  pgEnum,
  boolean,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const issueTypeEnum = pgEnum("issue_type", [
  "pothole",
  "garbage",
  "streetlight",
  "water_leakage",
  "road_damage",
  "other"
]);

export const issueStatusEnum = pgEnum("issue_status", [
  "submitted",
  "acknowledged", 
  "in_progress",
  "resolved",
  "rejected"
]);

export const priorityEnum = pgEnum("priority", [
  "low",
  "medium", 
  "high",
  "critical"
]);

export const languageEnum = pgEnum("language", [
  "en",
  "hi", 
  "mr"
]);

// Session storage table (required for auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Users table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  phone: varchar("phone"),
  preferredLanguage: languageEnum("preferred_language").default("en"),
  isAdmin: boolean("is_admin").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Issues table  
export const issues = pgTable("issues", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  reporterId: varchar("reporter_id").references(() => users.id),
  title: text("title").notNull(),
  description: text("description"),
  issueType: issueTypeEnum("issue_type").notNull(),
  priority: priorityEnum("priority").default("medium"),
  status: issueStatusEnum("status").default("submitted"),
  location: text("location").notNull(),
  latitude: real("latitude"),
  longitude: real("longitude"),
  address: text("address"),
  ward: varchar("ward"),
  assignedDepartment: varchar("assigned_department"),
  assignedTo: varchar("assigned_to"),
  photoUrl: varchar("photo_url"),
  audioUrl: varchar("audio_url"),
  transcription: text("transcription"),
  aiDetectionResult: jsonb("ai_detection_result"),
  aiConfidence: real("ai_confidence"),
  estimatedResolutionDays: integer("estimated_resolution_days"),
  actualResolutionDate: timestamp("actual_resolution_date"),
  smsNotificationSent: boolean("sms_notification_sent").default(false),
  language: languageEnum("language").default("en"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Issue status history for tracking
export const issueStatusHistory = pgTable("issue_status_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  issueId: varchar("issue_id").references(() => issues.id),
  status: issueStatusEnum("status").notNull(),
  notes: text("notes"),
  updatedBy: varchar("updated_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Comments/updates on issues
export const issueComments = pgTable("issue_comments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  issueId: varchar("issue_id").references(() => issues.id),
  userId: varchar("user_id").references(() => users.id),
  comment: text("comment").notNull(),
  isInternal: boolean("is_internal").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Departments for assignment
export const departments = pgTable("departments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  description: text("description"),
  contactEmail: varchar("contact_email"),
  contactPhone: varchar("contact_phone"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertIssueSchema = createInsertSchema(issues).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertIssueStatusHistorySchema = createInsertSchema(issueStatusHistory).omit({
  id: true,
  createdAt: true,
});

export const insertIssueCommentSchema = createInsertSchema(issueComments).omit({
  id: true,
  createdAt: true,
});

export const insertDepartmentSchema = createInsertSchema(departments).omit({
  id: true,
  createdAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpsertUser = typeof users.$inferInsert;

export type Issue = typeof issues.$inferSelect;
export type InsertIssue = z.infer<typeof insertIssueSchema>;

export type IssueStatusHistory = typeof issueStatusHistory.$inferSelect;
export type InsertIssueStatusHistory = z.infer<typeof insertIssueStatusHistorySchema>;

export type IssueComment = typeof issueComments.$inferSelect;
export type InsertIssueComment = z.infer<typeof insertIssueCommentSchema>;

export type Department = typeof departments.$inferSelect;
export type InsertDepartment = z.infer<typeof insertDepartmentSchema>;
