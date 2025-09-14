import { storage } from "../server/storage";

async function seedDepartments() {
  try {
    console.log("Creating seed departments...");

    const departments = [
      {
        name: "Public Works",
        description: "Handles road repairs, potholes, and infrastructure maintenance",
        contactEmail: "publicworks@city.gov",
        contactPhone: "+1-555-0101",
      },
      {
        name: "Sanitation",
        description: "Handles garbage collection, waste management, and street cleaning",
        contactEmail: "sanitation@city.gov",
        contactPhone: "+1-555-0102",
      },
      {
        name: "Electrical",
        description: "Handles streetlights, traffic signals, and electrical infrastructure",
        contactEmail: "electrical@city.gov",
        contactPhone: "+1-555-0103",
      },
      {
        name: "Water & Utilities",
        description: "Handles water leaks, pipe repairs, and utility maintenance",
        contactEmail: "utilities@city.gov",
        contactPhone: "+1-555-0104",
      },
    ];

    for (const dept of departments) {
      const created = await storage.createDepartment(dept);
      console.log(`Created department: ${created.name}`);
    }

    console.log("✅ Departments seeded successfully!");

    // Verify
    const allDepartments = await storage.getDepartments();
    console.log(`Total departments: ${allDepartments.length}`);
    
  } catch (error) {
    console.error("❌ Error seeding departments:", error);
  }
}

seedDepartments();