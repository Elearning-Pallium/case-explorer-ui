

## Fix Missing `build:scorm` Script

### Problem

The `package.json` is missing the `build:scorm` script entry. The file shows:
- `archiver` dependency is correctly installed (line 45)
- `scripts/build-scorm.js` file exists

But the scripts section (lines 6-14) doesn't include the `build:scorm` command.

### Solution

Add the missing script to `package.json`:

```json
"scripts": {
  "dev": "vite",
  "build": "vite build",
  "build:dev": "vite build --mode development",
  "build:scorm": "node scripts/build-scorm.js",
  "lint": "eslint .",
  "preview": "vite preview",
  "test": "vitest run",
  "test:watch": "vitest"
}
```

### Files to Modify

**`package.json`**
- Add `"build:scorm": "node scripts/build-scorm.js"` to the scripts section

### After the Fix

Run these commands in your terminal:

```bash
npm install
npm run build:scorm
```

This will:
1. Run the Vite build
2. Verify schema files are present
3. Update the manifest with all built files
4. Create `scorm-package.zip` ready for Moodle upload

---

### Technical Note

This is a single-line addition to `package.json`. No other files need changes - the build script and all dependencies are already in place.

