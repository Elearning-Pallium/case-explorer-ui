

## Fix SCORM 404 Error in Moodle

### Problem Identified

The `index.html` file contains an **absolute path** for the main script:

```html
<script type="module" src="/src/main.tsx"></script>
```

The leading `/` creates an absolute path that doesn't work inside the Moodle SCORM player. When Moodle serves the SCORM content, it looks for `/src/main.tsx` at the server root instead of within the SCORM package directory.

Additionally, Vite transforms this during build - but the source file reference needs to be compatible.

---

### Root Cause Analysis

| Issue | Current | Required |
|-------|---------|----------|
| Script path in `index.html` | `/src/main.tsx` (absolute) | `./src/main.tsx` (relative) |
| Vite base config | `'./'` (correct) | Already correct |
| Build output | Uses relative paths | Should work after HTML fix |

When Vite builds with `base: './'`, it transforms all asset references to relative paths. However, the source `index.html` must also use relative paths for the dev-to-production transformation to work correctly in SCORM contexts.

---

### Solution

**Modify `index.html`** - Change the script source from absolute to relative:

```html
<!-- Before -->
<script type="module" src="/src/main.tsx"></script>

<!-- After -->
<script type="module" src="./src/main.tsx"></script>
```

---

### Files to Modify

| File | Change |
|------|--------|
| `index.html` | Line 17: Change `/src/main.tsx` to `./src/main.tsx` |

---

### After the Fix

1. Rebuild the SCORM package:
   ```bash
   npm run build:scorm
   ```

2. Re-upload `scorm-package.zip` to Moodle

3. The content should now load correctly

---

### Verification Steps

After uploading to Moodle:
1. Open browser dev tools (F12)
2. Check the Network tab for 404 errors
3. Verify `index.html` loads the JS bundle with a relative path like `./assets/index-xxxxx.js`

---

### Why This Happens

SCORM packages are served from a dynamic path in Moodle (e.g., `/mod/scorm/player.php?...`). Absolute paths starting with `/` resolve to the Moodle server root, not the SCORM package directory. Relative paths (starting with `./`) resolve correctly relative to `index.html` inside the package.

