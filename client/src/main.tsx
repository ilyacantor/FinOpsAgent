import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// DEV-ONLY: Verify platform env vars (REMOVE AFTER VERIFICATION)
if (import.meta.env.DEV) {
  const baseUrl = import.meta.env.VITE_AOS_BASE_URL;
  const tenantId = import.meta.env.VITE_AOS_TENANT_ID;
  const agentId = import.meta.env.VITE_AOS_AGENT_ID;
  const jwt = import.meta.env.VITE_AOS_JWT;
  
  console.log('[FinOps Platform Config]');
  console.log(`BASE_URL=${baseUrl || '(not set)'}`);
  console.log(`TENANT_ID=${tenantId || '(not set)'}`);
  console.log(`AGENT_ID=${agentId || '(not set)'}`);
  console.log(`JWT=${jwt ? '(set)' : '(empty)'}`);
  
  // Health check
  if (baseUrl) {
    fetch(`${baseUrl}/api/v1/health`)
      .then(res => {
        if (res.ok) {
          console.log('✓ AOS health: OK');
        } else {
          console.log(`✗ AOS health: ${res.status}`);
        }
      })
      .catch(err => {
        console.log(`✗ AOS health: ${err.message}`);
      });
  }
}
// END DEV-ONLY

createRoot(document.getElementById("root")!).render(<App />);
