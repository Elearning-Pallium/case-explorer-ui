

## SCORM Package for Moodle 4.6+

### Overview

To create a SCORM-compliant package that works with Moodle 4.6+, we need to:
1. Create the required SCORM manifest file (`imsmanifest.xml`)
2. Configure Vite to build with the correct base path
3. Initialize SCORM on app startup
4. Create a build script that generates the `.zip` package

---

### What We Have (Already Built)

| Component | Status | Notes |
|-----------|--------|-------|
| **SCORM API Wrapper** | Complete | `src/lib/scorm-api.ts` - handles both SCORM 1.2 and 2004 |
| **State Manager** | Complete | `src/lib/state-manager.ts` - handles suspend_data with compression |
| **GameContext Integration** | Complete | Already calls `stateManager.initialize()` which initializes SCORM |

The SCORM runtime integration is already built. We just need the **packaging** components.

---

### Files to Create

| File | Purpose |
|------|---------|
| `public/imsmanifest.xml` | SCORM 1.2 manifest (Moodle default) |
| `public/adlcp_rootv1p2.xsd` | SCORM 1.2 schema files |
| `public/ims_xml.xsd` | IMS XML schema |
| `public/imscp_rootv1p1p2.xsd` | IMS Content Package schema |
| `public/imsmd_rootv1p2p1.xsd` | IMS Metadata schema |
| `scripts/build-scorm.js` | Build script to create ZIP package |

---

### Files to Modify

| File | Change |
|------|--------|
| `vite.config.ts` | Add `base: './'` for relative paths in SCORM |
| `index.html` | Update title/meta for the course |
| `package.json` | Add `build:scorm` script |
| `src/main.tsx` | Call SCORM initialize at app root level |

---

### SCORM Version Choice

**SCORM 1.2** is recommended for Moodle 4.6+ because:
- Universal LMS compatibility
- Simpler manifest structure
- Moodle fully supports both versions, but 1.2 has fewer edge cases

The existing `scorm-api.ts` already handles both versions automatically.

---

### Implementation Details

#### 1. imsmanifest.xml Structure

```xml
<?xml version="1.0" encoding="UTF-8"?>
<manifest identifier="palliative-care-simulation" version="1.0"
  xmlns="http://www.imsproject.org/xsd/imscp_rootv1p1p2"
  xmlns:adlcp="http://www.adlnet.org/xsd/adlcp_rootv1p2"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  
  <metadata>
    <schema>ADL SCORM</schema>
    <schemaversion>1.2</schemaversion>
  </metadata>
  
  <organizations default="org-1">
    <organization identifier="org-1">
      <title>Palliative Care Simulation</title>
      <item identifier="item-1" identifierref="res-1">
        <title>Main Course</title>
        <adlcp:masteryscore>80</adlcp:masteryscore>
      </item>
    </organization>
  </organizations>
  
  <resources>
    <resource identifier="res-1" type="webcontent" 
      adlcp:scormtype="sco" href="index.html">
      <file href="index.html"/>
      <!-- All built assets referenced here -->
    </resource>
  </resources>
</manifest>
```

#### 2. Vite Config Update

```typescript
export default defineConfig(({ mode }) => ({
  base: './',  // Critical for SCORM - all paths must be relative
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
  // ... existing config
}));
```

#### 3. Build Script (scripts/build-scorm.js)

```javascript
// 1. Run vite build
// 2. Copy imsmanifest.xml to dist/
// 3. Copy schema .xsd files to dist/
// 4. Generate file list for manifest <resources>
// 5. Create scorm-package.zip from dist/
```

#### 4. SCORM Initialization Hook

Add to `src/main.tsx` to ensure SCORM initializes before React renders:

```typescript
import { scormAPI } from '@/lib/scorm-api';

// Initialize SCORM before rendering
scormAPI.initialize().then(() => {
  createRoot(document.getElementById("root")!).render(<App />);
});
```

---

### Build Process

```text
npm run build:scorm
    │
    ├── 1. vite build (creates dist/)
    │
    ├── 2. Copy imsmanifest.xml → dist/
    │
    ├── 3. Copy XSD schemas → dist/
    │
    ├── 4. Update manifest with file list
    │
    └── 5. Zip dist/ → scorm-package.zip
```

---

### Moodle Upload Instructions

After building, the user can:
1. Go to Moodle course → **Add activity** → **SCORM package**
2. Upload the generated `scorm-package.zip`
3. Configure settings:
   - **Grade method**: Highest grade
   - **Max grade**: 100
   - **Completion tracking**: Require status "completed"
4. Save and test

---

### Technical Details

#### SCORM Data Flow

```text
User Action → GameContext dispatch → StateManager → scormAPI.setValue()
                                                            │
                                                            ▼
                                              Moodle LMS stores in database
```

#### Data Being Tracked

| SCORM Data Element | Value |
|--------------------|-------|
| `cmi.core.lesson_status` | incomplete / completed / passed |
| `cmi.core.score.raw` | 0-100 (total points normalized) |
| `cmi.suspend_data` | LZ-compressed JSON state |
| `cmi.core.lesson_location` | Current case/question position |

---

### Safety Assessment

| Component | Risk | Notes |
|-----------|------|-------|
| New files (manifest, schemas) | None | Additive only |
| Vite config change | Low | `base: './'` only affects built paths |
| Build script | None | Separate utility, doesn't affect runtime |
| main.tsx | Low | Wraps existing render in promise |
| SCORM API | None | Already complete, no changes needed |

---

### Package Dependencies

None required. The build script will use:
- Node.js built-in `fs` and `path`
- `archiver` npm package (add to devDependencies)

```json
"devDependencies": {
  "archiver": "^6.0.0"
}
```

---

### Files Summary

**Create:**
- `public/imsmanifest.xml`
- `public/adlcp_rootv1p2.xsd`
- `public/ims_xml.xsd`
- `public/imscp_rootv1p1p2.xsd`
- `public/imsmd_rootv1p2p1.xsd`
- `scripts/build-scorm.js`

**Modify:**
- `vite.config.ts` (add `base: './'`)
- `package.json` (add script + archiver dependency)
- `src/main.tsx` (wrap render in SCORM init)

