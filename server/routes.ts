import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { analyzeIssueImage, transcribeAudio, extractIssueFromText } from "./openai";
import { insertIssueSchema, insertIssueCommentSchema } from "@shared/schema";
import multer from "multer";
import path from "path";
import fs from "fs";

// Configure multer for file uploads
const upload = multer({
  dest: "uploads/",
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Get all issues with filtering
  app.get("/api/issues", async (req, res) => {
    try {
      const {
        reporterId,
        status,
        issueType,
        department,
        limit = "50",
        offset = "0"
      } = req.query;

      const issues = await storage.getIssues({
        reporterId: reporterId as string,
        status: status as string,
        issueType: issueType as string,
        department: department as string,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      });

      res.json(issues);
    } catch (error) {
      console.error("Error fetching issues:", error);
      res.status(500).json({ message: "Failed to fetch issues" });
    }
  });

  // Get specific issue
  app.get("/api/issues/:id", async (req, res) => {
    try {
      const issue = await storage.getIssue(req.params.id);
      if (!issue) {
        return res.status(404).json({ message: "Issue not found" });
      }
      res.json(issue);
    } catch (error) {
      console.error("Error fetching issue:", error);
      res.status(500).json({ message: "Failed to fetch issue" });
    }
  });

  // Create new issue with photo upload
  app.post("/api/issues", upload.fields([
    { name: "photo", maxCount: 1 },
    { name: "audio", maxCount: 1 }
  ]), async (req, res) => {
    try {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      let aiDetectionResult = null;
      let transcription = null;
      let extractedInfo = null;

      // Process photo if uploaded
      if (files?.photo?.[0]) {
        const photoFile = files.photo[0];
        const base64Image = fs.readFileSync(photoFile.path, { encoding: 'base64' });
        
        try {
          aiDetectionResult = await analyzeIssueImage(base64Image);
        } catch (error) {
          console.error("AI image analysis failed:", error);
        }
        
        // Clean up uploaded file
        fs.unlinkSync(photoFile.path);
      }

      // Process audio if uploaded
      if (files?.audio?.[0]) {
        const audioFile = files.audio[0];
        
        try {
          const transcriptionResult = await transcribeAudio(audioFile.path);
          transcription = transcriptionResult.text;
          
          extractedInfo = await extractIssueFromText(transcription, transcriptionResult.language);
        } catch (error) {
          console.error("Audio transcription failed:", error);
        }
        
        // Clean up uploaded file
        fs.unlinkSync(audioFile.path);
      }

      // Prepare issue data
      const issueData = {
        title: req.body.title || aiDetectionResult?.description || extractedInfo?.description || "New Issue",
        description: req.body.description || aiDetectionResult?.description || extractedInfo?.description,
        issueType: req.body.issueType || aiDetectionResult?.issueType || extractedInfo?.issueType || "other",
        priority: req.body.priority || aiDetectionResult?.severity || extractedInfo?.priority || "medium",
        location: req.body.location || extractedInfo?.location || "",
        latitude: req.body.latitude ? parseFloat(req.body.latitude) : null,
        longitude: req.body.longitude ? parseFloat(req.body.longitude) : null,
        address: req.body.address || "",
        ward: req.body.ward || "",
        assignedDepartment: req.body.assignedDepartment || aiDetectionResult?.suggestedDepartment || "",
        reporterId: req.body.reporterId || null,
        photoUrl: req.body.photoUrl || null,
        audioUrl: req.body.audioUrl || null,
        transcription,
        aiDetectionResult,
        aiConfidence: aiDetectionResult?.confidence || null,
        language: req.body.language || "en",
      };

      // Validate data
      const validatedData = insertIssueSchema.parse(issueData);
      
      // Create issue
      const newIssue = await storage.createIssue(validatedData);
      
      // Add initial status history
      await storage.addStatusHistory({
        issueId: newIssue.id,
        status: "submitted",
        notes: "Issue submitted",
        updatedBy: req.body.reporterId || null,
      });

      res.status(201).json(newIssue);
    } catch (error) {
      console.error("Error creating issue:", error);
      res.status(500).json({ message: "Failed to create issue", error: (error as Error).message });
    }
  });

  // Update issue status (admin only)
  app.patch("/api/issues/:id/status", async (req, res) => {
    try {
      const { status, notes, updatedBy, assignedDepartment, assignedTo } = req.body;
      
      const updateData: any = { status };
      if (assignedDepartment) updateData.assignedDepartment = assignedDepartment;
      if (assignedTo) updateData.assignedTo = assignedTo;
      if (status === "resolved") updateData.actualResolutionDate = new Date();

      const updatedIssue = await storage.updateIssue(req.params.id, updateData);
      
      // Add status history
      await storage.addStatusHistory({
        issueId: req.params.id,
        status,
        notes,
        updatedBy,
      });

      res.json(updatedIssue);
    } catch (error) {
      console.error("Error updating issue status:", error);
      res.status(500).json({ message: "Failed to update issue status" });
    }
  });

  // Get issue status history
  app.get("/api/issues/:id/history", async (req, res) => {
    try {
      const history = await storage.getIssueStatusHistory(req.params.id);
      res.json(history);
    } catch (error) {
      console.error("Error fetching issue history:", error);
      res.status(500).json({ message: "Failed to fetch issue history" });
    }
  });

  // Add comment to issue
  app.post("/api/issues/:id/comments", async (req, res) => {
    try {
      const commentData = {
        issueId: req.params.id,
        userId: req.body.userId,
        comment: req.body.comment,
        isInternal: req.body.isInternal || false,
      };

      const validatedData = insertIssueCommentSchema.parse(commentData);
      const newComment = await storage.addIssueComment(validatedData);
      
      res.status(201).json(newComment);
    } catch (error) {
      console.error("Error adding comment:", error);
      res.status(500).json({ message: "Failed to add comment" });
    }
  });

  // Get issue comments
  app.get("/api/issues/:id/comments", async (req, res) => {
    try {
      const comments = await storage.getIssueComments(req.params.id);
      res.json(comments);
    } catch (error) {
      console.error("Error fetching comments:", error);
      res.status(500).json({ message: "Failed to fetch comments" });
    }
  });

  // Get departments
  app.get("/api/departments", async (req, res) => {
    try {
      const departments = await storage.getDepartments();
      res.json(departments);
    } catch (error) {
      console.error("Error fetching departments:", error);
      res.status(500).json({ message: "Failed to fetch departments" });
    }
  });

  // Get statistics
  app.get("/api/stats", async (req, res) => {
    try {
      const { department } = req.query;
      const stats = await storage.getIssueStats({
        department: department as string,
      });
      res.json(stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ message: "Failed to fetch statistics" });
    }
  });

  // AI image analysis endpoint
  app.post("/api/analyze-image", upload.single("image"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No image file provided" });
      }

      const base64Image = fs.readFileSync(req.file.path, { encoding: 'base64' });
      const result = await analyzeIssueImage(base64Image);
      
      // Clean up uploaded file
      fs.unlinkSync(req.file.path);
      
      res.json(result);
    } catch (error) {
      console.error("Error analyzing image:", error);
      res.status(500).json({ message: "Failed to analyze image" });
    }
  });

  // Audio transcription endpoint
  app.post("/api/transcribe-audio", upload.single("audio"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No audio file provided" });
      }

      const result = await transcribeAudio(req.file.path);
      
      // Extract issue information from transcription
      const extractedInfo = await extractIssueFromText(result.text, result.language);
      
      // Clean up uploaded file
      fs.unlinkSync(req.file.path);
      
      res.json({
        transcription: result.text,
        language: result.language,
        extractedInfo
      });
    } catch (error) {
      console.error("Error transcribing audio:", error);
      res.status(500).json({ message: "Failed to transcribe audio" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
