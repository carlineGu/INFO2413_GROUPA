"use strict";

const fs = require("node:fs");
const path = require("node:path");

const projectRoot = path.resolve(__dirname, "..");
const frontendRoot = path.join(projectRoot, "frontend");
const htmlRoot = path.join(frontendRoot, "html");
const failures = [];

function shouldSkip(target) {
  return (
    !target ||
    target.startsWith("#") ||
    target.startsWith("data:") ||
    target.startsWith("mailto:") ||
    target.startsWith("javascript:") ||
    /^https?:\/\//i.test(target) ||
    target.includes("${") ||
    target.includes("{")
  );
}

function resolveFrontendTarget(sourceFile, target) {
  const cleanTarget = target.split(/[?#]/, 1)[0];
  if (shouldSkip(cleanTarget)) return null;

  if (cleanTarget.startsWith("/api/")) return null;
  if (cleanTarget.startsWith("/")) {
    return path.join(frontendRoot, cleanTarget.replace(/^\/+/, ""));
  }
  return path.resolve(path.dirname(sourceFile), cleanTarget);
}

function checkTarget(sourceFile, target) {
  const resolved = resolveFrontendTarget(sourceFile, target);
  if (resolved && !fs.existsSync(resolved)) {
    failures.push(`${path.relative(projectRoot, sourceFile)} -> ${target}`);
  }
}

for (const name of fs.readdirSync(htmlRoot)) {
  if (!name.endsWith(".html")) continue;
  const filePath = path.join(htmlRoot, name);
  const source = fs.readFileSync(filePath, "utf8");
  const attributePattern = /\b(?:href|src)\s*=\s*["']([^"']+)["']/gi;
  let match;
  while ((match = attributePattern.exec(source))) {
    checkTarget(filePath, match[1]);
  }
}

const navbarPath = path.join(frontendRoot, "js", "navbar.js");
const navbarSource = fs.readFileSync(navbarPath, "utf8");
const navbarTargetPattern = /(?:href\s*=|href\s*:)\s*["']([^"']+)["']/gi;
let navbarMatch;
while ((navbarMatch = navbarTargetPattern.exec(navbarSource))) {
  checkTarget(path.join(htmlRoot, "index.html"), navbarMatch[1]);
}

if (failures.length > 0) {
  console.error("Broken local references:");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exitCode = 1;
} else {
  console.log("All static HTML and navbar references resolve.");
}
