import fs from "fs";
import path from "path";
import dotenv from "dotenv";

const envPath = ".env";
dotenv.config({ path: envPath });

const DCL_URL = process.env.DCL_URL || "/api/unified_data";
const targetFiles = [
  "server.js",
  "index.js",
  "src/App.jsx",
  "src/main.jsx",
  "public/index.html"
].filter(f => fs.existsSync(f));

console.log(`🧠 FinOpsInjector: using DCL_URL=${DCL_URL}`);

for (const file of targetFiles) {
  let content = fs.readFileSync(file, "utf-8");

  // Patch any hard-coded /api/unified_data or placeholder URLs
  const replaced = content.replace(
    /(["'`])\/api\/unified_data\1|https:\/\/[^\s'"]*\/api\/unified_data/g,
    `"${DCL_URL}"`
  );

  if (replaced !== content) {
    fs.writeFileSync(file, replaced, "utf-8");
    console.log(`🩵 Patched endpoint in ${file}`);
  } else {
    console.log(`ℹ️ No patch needed in ${file}`);
  }
}

console.log("✅ Runtime injection complete. FinOpsPilot now aligned with .env.");
