#!/usr/bin/env node
// scripts/generate-module.cjs
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const [, , action, moduleName, ...flags] = process.argv; // actions: create | delete

if (!action || !moduleName) {
    console.error("⚠️  Usage: node scripts/generate-module.cjs <create|delete> <moduleName> [--skip-cli]");
    process.exit(1);
}

const base = path.join(__dirname, "..", "src");
const skipCli = flags.includes("--skip-cli"); // cho phép bỏ qua Nest CLI khi create

// Những file theo Clean Architecture (không trùng với file Nest CLI tạo)
const skeletonFiles = [
    `domain/${moduleName}/entities/${moduleName}.ts`,
    `domain/${moduleName}/repos/${moduleName}.repo.ts`,
    `application/${moduleName}/dto/create-${moduleName}.dto.ts`,
    `application/${moduleName}/mappers/${moduleName}.mapper.ts`,
    `application/${moduleName}/use-cases/create-${moduleName}.usecase.ts`,
    `infrastructure/${moduleName}/repos/prisma-${moduleName}.repo.ts`,
    `presentation/${moduleName}/dto/create-${moduleName}.request.ts`,
    // 2 file dưới có thể được Nest CLI tạo, nên chỉ tạo nếu chưa có
    `presentation/${moduleName}/${moduleName}.controller.ts`,
    `presentation/${moduleName}/${moduleName}.module.ts`,
];

function writeIfMissing(fileRel, content) {
    const abs = path.join(base, fileRel);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    if (!fs.existsSync(abs)) {
        fs.writeFileSync(abs, content);
        console.log("✅ Created", abs);
    } else {
        console.log("ℹ️  Exists", abs);
    }
}

function run(cmd) {
    console.log(`▶ ${cmd}`);
    execSync(cmd, { stdio: "inherit" });
}

function createWithCli() {
    if (skipCli) {
        console.log("⏭️  Skipping Nest CLI steps (flag --skip-cli)");
        return;
    }
    // Dùng npx để khỏi cần cài @nestjs/cli global
    // 1) module
    run(`npx nest g module presentation/${moduleName}`);
    // 2) controller --flat để đặt file ngay trong folder
    run(`npx nest g controller presentation/${moduleName} --flat`);
    // 3) service tạm (usecase) --flat
    run(`npx nest g service application/${moduleName}/use-cases/create-${moduleName} --flat`);
}

function createSkeleton() {
    // Tạo các file còn lại nếu chưa có
    for (const rel of skeletonFiles) {
        const placeholder = `// ${rel}\n`;
        writeIfMissing(rel, placeholder);
    }
}

function deleteModule() {
    const moduleFolders = [
        `domain/${moduleName}`,
        `application/${moduleName}`,
        `infrastructure/${moduleName}`,
        `presentation/${moduleName}`,
    ];
    for (const folder of moduleFolders) {
        const abs = path.join(base, folder);
        if (fs.existsSync(abs)) {
            fs.rmSync(abs, { recursive: true, force: true });
            console.log("🗑️ Deleted folder", abs);
        } else {
            console.log("ℹ️  Not found", abs);
        }
    }
}

if (action === "create") {
    try {
        createWithCli();
    } catch (e) {
        console.error("❌ Nest CLI step failed. You can retry or use --skip-cli to only scaffold files.");
        process.exit(1);
    }
    createSkeleton();
} else if (action === "delete") {
    deleteModule();
} else {
    console.error("⚠️ Action must be 'create' or 'delete'");
    process.exit(1);
}
