<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Project Instruction (BlueMoon web)

- Hosting target is **Vercel**. Keep the app Vercel-compatible (Next.js app router, no custom server requirement).
- Prefer environment variables and serverless-friendly patterns for future backend work.
- Do **not** kill all Node.js processes globally (for example `taskkill /IM node.exe /F`) because it can terminate the OpenCode/agent runtime. If a process lock occurs, use targeted process handling only for the specific app process you started.
- Before handoff, run at least:
  - `npm run lint`
  - `npm run build`
- For local verification:
  - `npm run dev` and open `http://localhost:3000`.
