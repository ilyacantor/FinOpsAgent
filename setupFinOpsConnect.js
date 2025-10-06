import fs from "fs";
import https from "https";
import http from "http";

const envPath = ".env";

// Default fallback — replace this with your actual DCL Replit URL once known
const DCL_URL_DEFAULT = process.env.DCL_URL || "https://YOUR-DCL-PROJECT.yourusername.repl.co/api/unified_data";

function checkEndpoint(url) {
  return new Promise((resolve) => {
    const mod = url.startsWith("https") ? https : http;
    const req = mod.get(url, (res) => {
      resolve(res.statusCode === 200);
    });
    req.on("error", () => resolve(false));
    req.end();
  });
}

async function main() {
  console.log(`🔍 Checking DCL endpoint: ${DCL_URL_DEFAULT}`);
  const ok = await checkEndpoint(DCL_URL_DEFAULT);
  if (ok) {
    console.log("✅ DCL is online. Linking FinOpsPilot → DCL");
    fs.writeFileSync(envPath, `DCL_URL=${DCL_URL_DEFAULT}\n`, "utf-8");
  } else {
    console.log("⚠️ DCL not reachable. Falling back to local mock endpoint.");
    fs.writeFileSync(envPath, "DCL_URL=/api/unified_data\n", "utf-8");
  }
  console.log("💾 Environment ready. FinOpsPilot will connect automatically on next run.");
}
main();
