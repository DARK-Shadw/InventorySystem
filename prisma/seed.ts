import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { hash } from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  // Departments
  const departments = [
    { code: "STORE", name: "Store Department", isStore: true },
    { code: "SUR", name: "Survey Department", isStore: false },
    { code: "ROV", name: "ROV Department", isStore: false },
    { code: "RND", name: "R & D Department", isStore: false },
    { code: "DIV", name: "Diving Department", isStore: false },
    { code: "HSE", name: "HSE Department", isStore: false },
    { code: "USV", name: "USV Department", isStore: false },
    { code: "PMT", name: "PMT Department", isStore: false },
  ];

  for (const dept of departments) {
    await prisma.department.upsert({
      where: { code: dept.code },
      update: { name: dept.name, isStore: dept.isStore },
      create: dept,
    });
  }

  console.log(`Seeded ${departments.length} departments`);

  // Default storeroom
  await prisma.storeroom.upsert({
    where: { code: "SSMAIN" },
    update: {},
    create: {
      code: "SSMAIN",
      name: "Main Store - Safeen Survey & Subsea",
      site: "SS",
    },
  });

  console.log("Seeded default storeroom");

  // Admin user
  const storeDept = await prisma.department.findUnique({
    where: { code: "STORE" },
  });

  const passwordHash = await hash("admin123", 12);
  await prisma.user.upsert({
    where: { email: "admin@safeen.ae" },
    update: {},
    create: {
      email: "admin@safeen.ae",
      passwordHash,
      name: "Store Admin",
      badgeNumber: "00001",
      role: "SUPER_ADMIN",
      departmentId: storeDept!.id,
    },
  });

  console.log("Seeded admin user (admin@safeen.ae / admin123)");

  // Demo users for each role
  const surveyDept = await prisma.department.findUnique({ where: { code: "SUR" } });
  const rovDept = await prisma.department.findUnique({ where: { code: "ROV" } });

  const demoUsers = [
    { email: "survey.head@safeen.ae", name: "Ahmed Al Rashid", badgeNumber: "10050", role: "DEPT_HEAD" as const, departmentId: surveyDept!.id },
    { email: "rov.head@safeen.ae", name: "James Thompson", badgeNumber: "10051", role: "DEPT_HEAD" as const, departmentId: rovDept!.id },
    { email: "store.staff@safeen.ae", name: "Mohammed Ali", badgeNumber: "10052", role: "STORE_STAFF" as const, departmentId: storeDept!.id },
    { email: "requester@safeen.ae", name: "Sarah Kumar", badgeNumber: "10120", role: "REQUESTER" as const, departmentId: surveyDept!.id },
  ];

  for (const u of demoUsers) {
    const exists = await prisma.user.findUnique({ where: { email: u.email } });
    if (!exists) {
      await prisma.user.create({
        data: { ...u, passwordHash },
      });
    }
  }

  console.log("Seeded demo users (all use password: admin123)");

  // Sample locations (vessels/barges from the requisition form)
  const locations = [
    { name: "ASTRO ARCHERNER", type: "VESSEL" as const, region: "UAE" },
    { name: "UAE/Rigmove", type: "BARGE" as const, region: "UAE" },
  ];

  for (const loc of locations) {
    const existing = await prisma.location.findFirst({
      where: { name: loc.name },
    });
    if (!existing) {
      await prisma.location.create({ data: loc });
    }
  }

  console.log(`Seeded ${locations.length} locations`);

  // Sample project
  const existingProject = await prisma.project.findUnique({
    where: { code: "2035" },
  });
  if (!existingProject) {
    await prisma.project.create({
      data: { code: "2035", name: "Project 2035" },
    });
  }

  console.log("Seeded sample project");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
