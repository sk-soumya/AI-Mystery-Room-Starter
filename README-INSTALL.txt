AI MYSTERY ROOM — GENERATION, THEME AND MOTION REPAIR

INSTALL THE PATCH
1. Stop existing Vite and API terminals with Ctrl+C.
2. Extract this ZIP into the existing AI-Mystery-Room-Starter folder —
   the folder that already contains client, server and package.json.
3. Run INSTALL-CASEFILE-UPGRADE.cmd (double-click it, or run it from CMD).
4. It backs up files it replaces into backup_casefile_upgrade_<random>.
5. Run START-CASEFILE.cmd from the project root.
6. Open http://localhost:5174 and press Ctrl+Shift+R.

IMPORTANT
- START-CASEFILE.cmd runs the existing root npm run dev script.
- client/vite.config.js now uses port 5174 by default, avoiding the occupied 5173.
- Keep the START-CASEFILE command window open while using the website.
- Do not paste JSX into CMD or PowerShell.
- Do not replace .env, package.json, package-lock.json, main.jsx, media.js or storage.js.
- Existing MongoDB and Gemini environment settings are untouched.

WHAT CHANGED
- The page shade selector includes Cloud, Warm, Mist and Dark; selection persists.
- Create form begins empty instead of showing the same prefilled story.
- Surprise Me avoids repeating the same premise twice in a row.
- Every case request has a unique novelty token and narrative direction.
- If Gemini fails or returns unusable data, a distinct varied fallback case is generated
  instead of returning the generic generation error. The interface labels this fallback.
- The fallback engine varies case title, suspect role family, culprit, evidence angle,
  clue content and story structure. It preserves the easy/medium/hard evidence counts.
- Case generation errors are surfaced with useful API messages instead of a generic toast.
- Clue cards use different reveal animations by position as they enter the scroll zone.
- Each main screen has a distinct editorial transition; prefers-reduced-motion is respected.
- Evidence descriptions/transcripts remain visible when generated media is unavailable.

VERIFICATION
- Server source files passed node --check.
- JSX/JS and Vite config passed TypeScript syntax transpilation.
- Fallback case generation structure passed easy, medium and hard checks.
- 24 fallback runs produced multiple case titles and eight distinct story frameworks.
- A full Windows Vite build and live Gemini request must be verified on the user's machine.
