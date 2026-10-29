import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const db = new PrismaClient({ adapter });

async function main() {
  // Create the company
  const company = await db.company.upsert({
    where: { id: "grouh-academy" },
    update: {},
    create: {
      id: "grouh-academy",
      name: "Grouh Academy",
    },
  });

  console.log("Company:", company.name);

  // Create roles in order (parents first)
  const directors = await db.role.create({
    data: {
      companyId: company.id,
      title: "Director",
      level: 1,
      roleType: "human",
      description: "Define the organisation's overall vision, goals, and strategic direction.",
      responsibilities: [
        "Define the organisation's overall vision, goals, and strategic direction",
        "Set financial expectations, capital plans, and investment priorities",
        "Establish marketing targets, sales targets, and broader business objectives",
        "Work with the Project/Operations Manager to develop processes and SOPs that support company goals",
        "Review business performance and hold relevant teams accountable for results",
        "Make key strategic, financial, and operational decisions",
      ],
      requirements: [],
      qualifications: [],
    },
  });

  const opsManager = await db.role.create({
    data: {
      companyId: company.id,
      title: "Project Manager / Operations Manager",
      level: 2,
      parentRoleId: directors.id,
      roleType: "human-ai",
      description: "Translate organisational targets into actionable daily and weekly workflows.",
      responsibilities: [
        "Translate organisational targets into actionable daily and weekly workflows",
        "Design and document Standard Operating Procedures (SOPs) for staff",
        "Assign responsibilities, deadlines, and deliverables",
        "Ensure staff follow approved processes and workflows",
        "Monitor individual and departmental performance",
        "Identify operational problems and ensure corrective actions are taken",
        "Coordinate departments and report progress against organisational targets",
      ],
      requirements: [],
      qualifications: [],
    },
  });

  await db.role.createMany({
    data: [
      {
        companyId: company.id,
        title: "Content Strategist / Content Writer",
        level: 3,
        parentRoleId: opsManager.id,
        roleType: "human-ai",
        description: "Develop content strategies for the company and its clients.",
        responsibilities: [
          "Develop content strategies for the company and its clients",
          "Define content pillars and content direction",
          "Write content copies, captions, headlines, and scripts",
          "Plan content formats including short motion animations, single-page graphics, flyers, and carousels",
          "Provide clear creative briefs for the graphic designer and motion animator",
        ],
        requirements: [],
        qualifications: [],
      },
      {
        companyId: company.id,
        title: "Graphic Designer",
        level: 3,
        parentRoleId: opsManager.id,
        roleType: "human-ai",
        description: "Execute graphic design briefs provided by the Content Strategist.",
        responsibilities: [
          "Execute graphic design briefs provided by the Content Strategist",
          "Design single-page graphics, flyers, and carousels",
          "Maintain brand consistency, visual quality, and design standards",
          "Use AI tools to improve design speed, ideation, and execution",
        ],
        requirements: [],
        qualifications: [],
      },
      {
        companyId: company.id,
        title: "Social Media Manager",
        level: 3,
        parentRoleId: opsManager.id,
        roleType: "human",
        description: "Manage the company's and clients' social media accounts.",
        responsibilities: [
          "Manage the company's and clients' social media accounts",
          "Schedule and publish approved content",
          "Manage comments, engagement, and community interactions on social platforms",
          "Monitor account performance and prepare reports",
          "Coordinate content publishing with the Content Strategist and other creative staff",
        ],
        requirements: [],
        qualifications: [],
      },
      {
        companyId: company.id,
        title: "Admin Officer / Academy Support Officer",
        level: 3,
        parentRoleId: opsManager.id,
        roleType: "human",
        description: "Create, organise, upload, and manage courses and learning resources on the Academy platform.",
        responsibilities: [
          "Create, organise, upload, and manage courses and learning resources on the Academy platform",
          "Ensure videos and learning materials are uploaded and released at the appropriate times",
          "Communicate with interns and manage the Academy community",
          "Upload banners, notifications, and other platform announcements",
          "Provide general administrative support and oversee routine Academy operations",
        ],
        requirements: [],
        qualifications: [],
      },
      {
        companyId: company.id,
        title: "Sales Assistant / Customer Care Officer",
        level: 3,
        parentRoleId: opsManager.id,
        roleType: "human",
        description: "Respond promptly to customer and client inquiries received through WhatsApp.",
        responsibilities: [
          "Respond promptly to customer and client inquiries received through WhatsApp",
          "Call new inquiries as soon as possible",
          "Follow up with prospects until they make a decision",
          "Answer questions, explain relevant offers, and address objections",
          "Convert qualified inquiries into paying customers",
          "Maintain records of inquiries, follow-ups, and sales outcomes",
        ],
        requirements: [],
        qualifications: [],
      },
      {
        companyId: company.id,
        title: "Motion Animator",
        level: 3,
        parentRoleId: opsManager.id,
        roleType: "human-ai",
        description: "Execute short-form motion animations and kinetic text graphics.",
        responsibilities: [
          "Execute short-form motion animations and kinetic text graphics from briefs supplied by the Content Strategist",
          "Produce animated content for marketing campaigns, social media, and advertising",
          "Use AI tools to improve production speed and creative execution",
          "Maintain quality, brand consistency, and adherence to the creative brief",
        ],
        requirements: [],
        qualifications: [],
      },
      {
        companyId: company.id,
        title: "Finance Officer",
        level: 3,
        parentRoleId: opsManager.id,
        roleType: "human",
        description: "Maintain and update the company's financial records and statements.",
        responsibilities: [
          "Maintain and update the company's financial records and statements on the relevant app",
          "Keep financial information current and accurate",
          "Track income, expenses, cash flow, and other relevant financial figures",
          "Monitor the company's financial position and provide timely updates",
          "Support management decisions with reliable financial information",
        ],
        requirements: [],
        qualifications: [],
      },
      {
        companyId: company.id,
        title: "Developer / Chief Technology Officer (CTO)",
        level: 3,
        parentRoleId: opsManager.id,
        roleType: "human-ai",
        description: "Maintain, manage, and improve the company's existing software platforms.",
        responsibilities: [
          "Maintain, manage, and improve the company's existing software platforms, including Academy software",
          "Troubleshoot technical issues and maintain system reliability",
          "Develop software solutions that improve workflow, administration, and operational control",
          "Build new digital products and software solutions for commercial use",
          "Use AI-assisted development tools to improve productivity and implementation speed",
        ],
        requirements: [],
        qualifications: [],
      },
      {
        companyId: company.id,
        title: "Digital Marketing Strategist",
        level: 3,
        parentRoleId: opsManager.id,
        roleType: "human-ai",
        description: "Develop digital marketing strategies aligned with business objectives.",
        responsibilities: [
          "Develop digital marketing strategies aligned with business objectives",
          "Identify target audiences, channels, and campaign opportunities",
          "Build relationships with influencers, strategic partners, and other relevant collaborators",
          "Plan and execute marketing campaigns",
          "Optimise advertising budgets to improve return on investment (ROI)",
          "Monitor campaign performance and recommend improvements based on results",
        ],
        requirements: [],
        qualifications: [],
      },
    ],
  });

  console.log("Roles seeded successfully.");
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
