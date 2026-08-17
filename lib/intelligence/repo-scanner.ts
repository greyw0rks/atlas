import * as fs from "fs/promises";
import * as path from "path";
import { updateRepositoryContext } from "@/lib/memory/writer";

interface ScanResult {
  techStack: string[];
  importantFiles: string[];
  architecture: string | null;
  constraints: string | null;
}

/**
 * Scan package.json to discover tech stack.
 */
async function scanPackageJson(repoPath: string): Promise<string[]> {
  const pkgPath = path.join(repoPath, "package.json");

  try {
    const content = await fs.readFile(pkgPath, "utf-8");
    const pkg = JSON.parse(content);
    const stack: string[] = [];

    const deps = { ...pkg.dependencies, ...pkg.devDependencies };

    // Frameworks
    if (deps.next) stack.push("Next.js");
    if (deps.react) stack.push("React");
    if (deps.vue) stack.push("Vue");
    if (deps.express) stack.push("Express");
    if (deps.fastify) stack.push("Fastify");
    if (deps["@nestjs/core"]) stack.push("NestJS");

    // Databases
    if (deps.prisma || deps["@prisma/client"]) stack.push("Prisma");
    if (deps.mongoose) stack.push("MongoDB");
    if (deps.pg) stack.push("PostgreSQL");
    if (deps.mysql || deps.mysql2) stack.push("MySQL");

    // Testing
    if (deps.jest) stack.push("Jest");
    if (deps.vitest) stack.push("Vitest");
    if (deps.playwright) stack.push("Playwright");

    // TypeScript
    if (deps.typescript || pkg.devDependencies?.typescript) stack.push("TypeScript");

    return stack;
  } catch {
    return [];
  }
}

/**
 * Scan requirements.txt for Python stack.
 */
async function scanRequirementsTxt(repoPath: string): Promise<string[]> {
  const reqPath = path.join(repoPath, "requirements.txt");

  try {
    const content = await fs.readFile(reqPath, "utf-8");
    const stack: string[] = ["Python"];

    if (content.includes("django")) stack.push("Django");
    if (content.includes("flask")) stack.push("Flask");
    if (content.includes("fastapi")) stack.push("FastAPI");
    if (content.includes("sqlalchemy")) stack.push("SQLAlchemy");
    if (content.includes("pytest")) stack.push("pytest");

    return stack;
  } catch {
    return [];
  }
}

/**
 * Scan go.mod for Go stack.
 */
async function scanGoMod(repoPath: string): Promise<string[]> {
  const goModPath = path.join(repoPath, "go.mod");

  try {
    const content = await fs.readFile(goModPath, "utf-8");
    const stack: string[] = ["Go"];

    if (content.includes("gin-gonic/gin")) stack.push("Gin");
    if (content.includes("gorilla/mux")) stack.push("Gorilla Mux");
    if (content.includes("gorm.io/gorm")) stack.push("GORM");

    return stack;
  } catch {
    return [];
  }
}

/**
 * Scan Cargo.toml for Rust stack.
 */
async function scanCargoToml(repoPath: string): Promise<string[]> {
  const cargoPath = path.join(repoPath, "Cargo.toml");

  try {
    const content = await fs.readFile(cargoPath, "utf-8");
    const stack: string[] = ["Rust"];

    if (content.includes("actix-web")) stack.push("Actix");
    if (content.includes("rocket")) stack.push("Rocket");
    if (content.includes("tokio")) stack.push("Tokio");

    return stack;
  } catch {
    return [];
  }
}

/**
 * Read README.md and extract architecture section.
 */
async function extractArchitectureFromReadme(repoPath: string): Promise<string | null> {
  const readmePath = path.join(repoPath, "README.md");

  try {
    const content = await fs.readFile(readmePath, "utf-8");

    // Look for ## Architecture or ## System Design section
    const archMatch = content.match(/##\s+(Architecture|System Design)[^\n]*\n([\s\S]*?)(?=\n##|\n$)/i);
    if (archMatch) {
      return archMatch[2].trim().substring(0, 500); // First 500 chars
    }

    // Fallback: first paragraph if it mentions "architecture" or "built with"
    const firstPara = content.split("\n\n")[0];
    if (firstPara.toLowerCase().includes("architecture") || firstPara.toLowerCase().includes("built with")) {
      return firstPara.trim().substring(0, 300);
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Discover important files by common patterns.
 */
async function discoverImportantFiles(repoPath: string): Promise<string[]> {
  const important: string[] = [];

  const candidates = [
    "package.json",
    "tsconfig.json",
    "next.config.js",
    "next.config.mjs",
    "vite.config.ts",
    "tailwind.config.js",
    "prisma/schema.prisma",
    ".env.example",
    "docker-compose.yml",
    "Dockerfile",
    "README.md",
    "CONTRIBUTING.md",
  ];

  for (const file of candidates) {
    try {
      await fs.access(path.join(repoPath, file));
      important.push(file);
    } catch {
      // File doesn't exist, skip
    }
  }

  return important;
}

/**
 * Full repository scan: tech stack, architecture, important files.
 */
export async function scanRepository(repoPath: string, repoId: string): Promise<ScanResult> {
  const techStack: string[] = [];

  // Scan manifest files
  techStack.push(...(await scanPackageJson(repoPath)));
  techStack.push(...(await scanRequirementsTxt(repoPath)));
  techStack.push(...(await scanGoMod(repoPath)));
  techStack.push(...(await scanCargoToml(repoPath)));

  // Deduplicate
  const uniqueStack = Array.from(new Set(techStack));

  const architecture = await extractArchitectureFromReadme(repoPath);
  const importantFiles = await discoverImportantFiles(repoPath);

  // Update repository context
  await updateRepositoryContext(repoId, {
    techStack: uniqueStack,
    importantFiles,
    architecture: architecture || undefined,
  });

  return {
    techStack: uniqueStack,
    importantFiles,
    architecture,
    constraints: null, // populated manually or by agent
  };
}
