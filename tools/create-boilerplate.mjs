#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const ROOT_DIR = process.cwd();
const TEMPLATE_DIR = path.join(ROOT_DIR, "templates");

const PROVIDERS = new Set(["render", "vercel", "neon", "trycloudflare"]);

function parseArgs(argv) {
  const args = {
    template: "express-api",
    providers: ["render", "vercel", "neon", "trycloudflare"],
    outDir: ROOT_DIR
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];

    if (token === "--name") {
      args.name = argv[i + 1];
      i += 1;
      continue;
    }

    if (token === "--template") {
      args.template = argv[i + 1];
      i += 1;
      continue;
    }

    if (token === "--providers") {
      args.providers = argv[i + 1].split(",").map((item) => item.trim().toLowerCase()).filter(Boolean);
      i += 1;
      continue;
    }

    if (token === "--out") {
      args.outDir = path.resolve(argv[i + 1]);
      i += 1;
      continue;
    }

    if (token === "-h" || token === "--help") {
      printHelp();
      process.exit(0);
    }
  }

  return args;
}

function printHelp() {
  console.log(`\nUsage:\n  node tools/create-boilerplate.mjs --name my-app [options]\n\nOptions:\n  --name <project-name>               Required\n  --template <template-name>          Default: express-api\n  --providers <p1,p2,...>             Default: render,vercel,neon,trycloudflare\n  --out <directory>                   Default: current directory\n  -h, --help                          Show this help\n\nSupported providers:\n  render, vercel, neon, trycloudflare\n`);
}

function ensureValidArgs(args) {
  if (!args.name) {
    throw new Error("Missing required argument: --name");
  }

  const templatePath = path.join(TEMPLATE_DIR, args.template);
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Template not found: ${args.template}`);
  }

  for (const provider of args.providers) {
    if (!PROVIDERS.has(provider)) {
      throw new Error(`Unsupported provider: ${provider}`);
    }
  }

  return templatePath;
}

function copyTemplate(templatePath, targetDir) {
  if (fs.existsSync(targetDir)) {
    throw new Error(`Target directory already exists: ${targetDir}`);
  }

  fs.cpSync(templatePath, targetDir, { recursive: true });
}

function replacePlaceholders(dir, replacements) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      replacePlaceholders(fullPath, replacements);
      continue;
    }

    const ext = path.extname(entry.name);
    const shouldProcess = [".js", ".json", ".md", ".yaml", ".yml", ".toml", ".env", ".sql", ""].includes(ext);

    if (!shouldProcess) {
      continue;
    }

    const raw = fs.readFileSync(fullPath, "utf8");
    let updated = raw;

    for (const [key, value] of Object.entries(replacements)) {
      updated = updated.replaceAll(key, value);
    }

    if (updated !== raw) {
      fs.writeFileSync(fullPath, updated, "utf8");
    }
  }
}

function applyProviderFiles(targetDir, providers) {
  const providerSet = new Set(providers);

  if (!providerSet.has("render")) {
    safeRemove(path.join(targetDir, "render.yaml"));
  }

  if (!providerSet.has("vercel")) {
    safeRemove(path.join(targetDir, "vercel.json"));
    safeRemove(path.join(targetDir, "api"));
  }

  if (!providerSet.has("neon")) {
    safeRemove(path.join(targetDir, "db"));
  }

  if (!providerSet.has("trycloudflare")) {
    removeTunnelScript(targetDir);
  }
}

function removeTunnelScript(targetDir) {
  const packagePath = path.join(targetDir, "package.json");
  if (!fs.existsSync(packagePath)) return;

  const pkg = JSON.parse(fs.readFileSync(packagePath, "utf8"));
  if (pkg.scripts && pkg.scripts.tunnel) {
    delete pkg.scripts.tunnel;
    fs.writeFileSync(packagePath, `${JSON.stringify(pkg, null, 2)}\n`, "utf8");
  }
}

function safeRemove(filePath) {
  if (fs.existsSync(filePath)) {
    fs.rmSync(filePath, { recursive: true, force: true });
  }
}

function writeDeployGuide(targetDir, projectName, providers) {
  const steps = [];

  if (providers.includes("render")) {
    steps.push("- Render: crea un Web Service y apunta al repositorio. `render.yaml` ya viene preparado.");
  }
  if (providers.includes("vercel")) {
    steps.push("- Vercel: importa el repo y despliega. `vercel.json` enruta todo a `api/index.js`.");
  }
  if (providers.includes("neon")) {
    steps.push("- Neon: crea DB PostgreSQL, copia `DATABASE_URL` y ejecuta `db/schema.sql`.");
  }
  if (providers.includes("trycloudflare")) {
    steps.push("- TryCloudflare: ejecuta `npm run dev` y luego `npm run tunnel`.");
  }

  const content = `# Deploy Guide: ${projectName}\n\nProviders activos: ${providers.join(", ")}\n\n## Pasos rapidos\n1. npm install\n2. cp .env.example .env\n3. npm run dev\n\n## Proveedores\n${steps.join("\n")}\n`;

  fs.writeFileSync(path.join(targetDir, "DEPLOY.md"), content, "utf8");
}

function main() {
  try {
    const args = parseArgs(process.argv.slice(2));
    const templatePath = ensureValidArgs(args);
    const targetDir = path.join(args.outDir, args.name);

    copyTemplate(templatePath, targetDir);
    replacePlaceholders(targetDir, {
      "__PROJECT_NAME__": args.name
    });
    applyProviderFiles(targetDir, args.providers);
    writeDeployGuide(targetDir, args.name, args.providers);

    console.log(`Boilerplate created: ${targetDir}`);
    console.log(`Template: ${args.template}`);
    console.log(`Providers: ${args.providers.join(", ")}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

main();
