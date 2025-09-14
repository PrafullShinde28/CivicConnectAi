import { storage } from "../server/storage";

async function createTestIssues() {
  try {
    console.log("Creating test issues with GPS coordinates...");

    // Get departments first
    const departments = await storage.getDepartments();
    const publicWorks = departments.find(d => d.name === "Public Works");
    const sanitation = departments.find(d => d.name === "Sanitation");
    const electrical = departments.find(d => d.name === "Electrical");

    const testIssues = [
      {
        title: "Pothole on Main Road",
        description: "Large pothole causing traffic issues",
        issueType: "pothole",
        priority: "high",
        location: "Bandra West, Mumbai",
        latitude: 19.0596,
        longitude: 72.8295,
        address: "SV Road, Bandra West",
        ward: "H/W",
        assignedDepartment: publicWorks?.id || "",
        status: "submitted",
      },
      {
        title: "Streetlight Not Working",
        description: "Street light has been non-functional for 3 days",
        issueType: "streetlight",
        priority: "medium",
        location: "Andheri East, Mumbai",
        latitude: 19.1197,
        longitude: 72.8697,
        address: "WEH Metro Station, Andheri East",
        ward: "E",
        assignedDepartment: electrical?.id || "",
        status: "acknowledged",
      },
      {
        title: "Garbage Overflow",
        description: "Garbage bin overflowing on street corner",
        issueType: "garbage",
        priority: "high",
        location: "Dadar West, Mumbai",
        latitude: 19.0178,
        longitude: 72.8478,
        address: "Shivaji Park, Dadar West",
        ward: "G/N",
        assignedDepartment: sanitation?.id || "",
        status: "in_progress",
      },
      {
        title: "Water Pipe Leak",
        description: "Water leakage causing road flooding",
        issueType: "water_leakage",
        priority: "critical",
        location: "Colaba, Mumbai",
        latitude: 18.9067,
        longitude: 72.8147,
        address: "Gateway of India, Colaba",
        ward: "A",
        assignedDepartment: publicWorks?.id || "",
        status: "submitted",
      },
      {
        title: "Broken Road Barrier",
        description: "Safety barrier damaged near school",
        issueType: "other",
        priority: "medium",
        location: "Powai, Mumbai",
        latitude: 19.1176,
        longitude: 72.9060,
        address: "IIT Powai Campus Road",
        ward: "L",
        assignedDepartment: publicWorks?.id || "",
        status: "resolved",
      }
    ];

    for (const issue of testIssues) {
      const created = await storage.createIssue(issue);
      console.log(`✅ Created issue: ${created.title} at (${issue.latitude}, ${issue.longitude})`);
    }

    console.log("🎉 Test issues created successfully!");

    // Verify
    const allIssues = await storage.getIssues();
    const issuesWithCoords = allIssues.filter(issue => issue.latitude && issue.longitude);
    console.log(`📍 Total issues with GPS coordinates: ${issuesWithCoords.length}`);
    
  } catch (error) {
    console.error("❌ Error creating test issues:", error);
  }
}

createTestIssues();