

## Fix: Podcast Duration & Transcript Hosting

### Overview

Standardize podcast durations to "~5 min" and set up transcript PDF hosting location.

---

### Changes

#### 1. Update Podcast Durations in Content

**File: `public/content/case-1.json`**

Change both podcast entries from their current durations to `"~5 min"`:

```json
"podcasts": [
  {
    "id": "podcast-ep1",
    "title": "Episode 1: From Caregiver to Change-Maker",
    "provider": "vimeo",
    "embedUrl": "https://player.vimeo.com/video/1159004283?h=f63ff145ce&badge=0&autopause=0&player_id=0&app_id=58479",
    "duration": "~5 min",    // Was "~15 min"
    "transcriptUrl": "/transcripts/episode-1.pdf",
    "points": 1
  },
  {
    "id": "podcast-ep2",
    "title": "Episode 2: Everyday Resilience in Palliative Care",
    "provider": "vimeo",
    "embedUrl": "https://player.vimeo.com/video/1159004255?h=b0e5e80f4d&badge=0&autopause=0&player_id=0&app_id=58479",
    "duration": "~5 min",    // Was "~12 min"
    "transcriptUrl": "/transcripts/episode-2.pdf",
    "points": 1
  }
]
```

---

#### 2. Create Transcripts Directory

**New Directory: `public/transcripts/`**

This is where transcript PDFs will be hosted. The current `transcriptUrl` values already point here:

- `/transcripts/episode-1.pdf` → `public/transcripts/episode-1.pdf`
- `/transcripts/episode-2.pdf` → `public/transcripts/episode-2.pdf`

**Note:** The actual PDF files need to be provided and placed in this directory. Until then, the "Read Transcript Instead" button will 404.

---

### File Structure After Fix

```text
public/
├── content/
│   ├── case-1.json           ← Updated durations
│   └── simulacrum-level-1.json
├── transcripts/              ← NEW DIRECTORY
│   ├── episode-1.pdf         ← Needs real PDF file
│   └── episode-2.pdf         ← Needs real PDF file
├── case-assets/
├── ip-insights/
└── ...
```

---

### Optional: Hide Transcript Button Until Files Exist

If you want to hide the "Read Transcript Instead" button when transcripts aren't available, we could either:

**Option A:** Remove `transcriptUrl` from the JSON until PDFs are ready  
**Option B:** Add a check in `PodcastPlayerModal` that verifies the URL before showing the button

---

### Summary

| Change | File |
|--------|------|
| Duration "~15 min" → "~5 min" | `public/content/case-1.json` (line 408) |
| Duration "~12 min" → "~5 min" | `public/content/case-1.json` (line 417) |
| Create transcripts directory | `public/transcripts/` |
| Add placeholder or real PDFs | `public/transcripts/episode-*.pdf` |

