import {
  users,
  issues,
  issueStatusHistory,
  issueComments,
  departments,
  type User,
  type UpsertUser,
  type Issue,
  type InsertIssue,
  type IssueStatusHistory,
  type InsertIssueStatusHistory,
  type IssueComment,
  type InsertIssueComment,
  type Department,
  type InsertDepartment,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, asc, and, or, ilike, sql } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Issue operations
  createIssue(issue: InsertIssue): Promise<Issue>;
  getIssue(id: string): Promise<Issue | undefined>;
  getIssues(filters?: {
    reporterId?: string;
    status?: string;
    issueType?: string;
    department?: string;
    limit?: number;
    offset?: number;
  }): Promise<Issue[]>;
  updateIssue(id: string, updates: Partial<InsertIssue>): Promise<Issue>;
  
  // Issue status history
  addStatusHistory(history: InsertIssueStatusHistory): Promise<IssueStatusHistory>;
  getIssueStatusHistory(issueId: string): Promise<IssueStatusHistory[]>;
  
  // Issue comments
  addIssueComment(comment: InsertIssueComment): Promise<IssueComment>;
  getIssueComments(issueId: string): Promise<IssueComment[]>;
  
  // Departments
  getDepartments(): Promise<Department[]>;
  createDepartment(department: InsertDepartment): Promise<Department>;
  
  // Statistics
  getIssueStats(filters?: { department?: string }): Promise<{
    total: number;
    pending: number;
    inProgress: number;
    resolved: number;
    avgResolutionDays: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async createIssue(issue: InsertIssue): Promise<Issue> {
    const [newIssue] = await db.insert(issues).values(issue).returning();
    return newIssue;
  }

  async getIssue(id: string): Promise<Issue | undefined> {
    const [issue] = await db.select().from(issues).where(eq(issues.id, id));
    return issue;
  }

  async getIssues(filters?: {
    reporterId?: string;
    status?: string;
    issueType?: string;
    department?: string;
    limit?: number;
    offset?: number;
  }): Promise<Issue[]> {
    const conditions = [];
    if (filters?.reporterId) {
      conditions.push(eq(issues.reporterId, filters.reporterId));
    }
    if (filters?.status) {
      conditions.push(eq(issues.status, filters.status as any));
    }
    if (filters?.issueType) {
      conditions.push(eq(issues.issueType, filters.issueType as any));
    }
    if (filters?.department) {
      conditions.push(eq(issues.assignedDepartment, filters.department));
    }
    
    let queryBuilder = db.select().from(issues);
    
    if (conditions.length > 0) {
      queryBuilder = queryBuilder.where(and(...conditions));
    }
    
    queryBuilder = queryBuilder.orderBy(desc(issues.createdAt));
    
    if (filters?.limit) {
      queryBuilder = queryBuilder.limit(filters.limit);
    }
    if (filters?.offset) {
      queryBuilder = queryBuilder.offset(filters.offset);
    }
    
    return await queryBuilder;
  }

  async updateIssue(id: string, updates: Partial<InsertIssue>): Promise<Issue> {
    const [updatedIssue] = await db
      .update(issues)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(issues.id, id))
      .returning();
    return updatedIssue;
  }

  async addStatusHistory(history: InsertIssueStatusHistory): Promise<IssueStatusHistory> {
    const [newHistory] = await db.insert(issueStatusHistory).values(history).returning();
    return newHistory;
  }

  async getIssueStatusHistory(issueId: string): Promise<IssueStatusHistory[]> {
    return await db
      .select()
      .from(issueStatusHistory)
      .where(eq(issueStatusHistory.issueId, issueId))
      .orderBy(asc(issueStatusHistory.createdAt));
  }

  async addIssueComment(comment: InsertIssueComment): Promise<IssueComment> {
    const [newComment] = await db.insert(issueComments).values(comment).returning();
    return newComment;
  }

  async getIssueComments(issueId: string): Promise<IssueComment[]> {
    return await db
      .select()
      .from(issueComments)
      .where(eq(issueComments.issueId, issueId))
      .orderBy(asc(issueComments.createdAt));
  }

  async getDepartments(): Promise<Department[]> {
    return await db
      .select()
      .from(departments)
      .where(eq(departments.isActive, true))
      .orderBy(asc(departments.name));
  }

  async createDepartment(department: InsertDepartment): Promise<Department> {
    const [newDepartment] = await db.insert(departments).values(department).returning();
    return newDepartment;
  }

  async getIssueStats(filters?: { department?: string }): Promise<{
    total: number;
    pending: number;
    inProgress: number;
    resolved: number;
    avgResolutionDays: number;
  }> {
    let baseQueryBuilder = db.select().from(issues);
    
    if (filters?.department) {
      baseQueryBuilder = baseQueryBuilder.where(eq(issues.assignedDepartment, filters.department));
    }
    
    const allIssues = await baseQueryBuilder;
    
    const stats = {
      total: allIssues.length,
      pending: allIssues.filter(i => i.status === 'submitted' || i.status === 'acknowledged').length,
      inProgress: allIssues.filter(i => i.status === 'in_progress').length,
      resolved: allIssues.filter(i => i.status === 'resolved').length,
      avgResolutionDays: 0,
    };
    
    const resolvedIssues = allIssues.filter(i => i.status === 'resolved' && i.actualResolutionDate);
    if (resolvedIssues.length > 0) {
      const totalDays = resolvedIssues.reduce((sum, issue) => {
        const resolutionDate = new Date(issue.actualResolutionDate!);
        const createdDate = new Date(issue.createdAt!);
        const diffDays = Math.ceil((resolutionDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
        return sum + diffDays;
      }, 0);
      stats.avgResolutionDays = Math.round((totalDays / resolvedIssues.length) * 10) / 10;
    }
    
    return stats;
  }
}

export const storage = new DatabaseStorage();
