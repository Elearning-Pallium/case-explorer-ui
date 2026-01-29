
## Hi-Tech Sci-Fi UI Reskin

### Color Palette (Extracted from Reference)

```text
Primary Cyan:     #00D4FF (bright glow, buttons, accents)
Secondary Cyan:   #0099CC (dimmer interactive elements)
Dark Background:  #0A1628 (main background)
Panel Background: #0D1B2A (cards, panels)
Tech Border:      #1A3A5C (borders, dividers)
Text Primary:     #E0F4FF (main text, near-white)
Text Secondary:   #6B8FAD (muted text)
Warning Accent:   #FF6B35 (alerts, notifications)
Success Glow:     #00FF88 (completions, correct answers)
```

---

### Implementation Approach

This is a **CSS-only reskin** that changes the design system variables without touching component logic.

#### File 1: `src/index.css`

Replace the entire color system with hi-tech theme:

**Light Mode (becomes the new default):**
- Dark blue-black backgrounds
- Cyan glow accents
- High-contrast white text

**Dark Mode:**
- Even darker backgrounds
- Brighter glows
- Same cyan palette, increased intensity

**New Utility Classes:**
- `.glow-cyan` - Adds cyan box-shadow glow
- `.tech-border` - Angled corner clip-path effect
- `.scanline` - Subtle animated scanline overlay
- `.pulse-glow` - Pulsing glow animation for active elements

#### File 2: `tailwind.config.ts`

Add new animations:
- `glow-pulse` - Subtle glow breathing effect
- `scan` - Horizontal scanline animation
- `flicker` - Occasional flicker for tech feel

---

### What Changes Visually

| Component | Before | After |
|-----------|--------|-------|
| HUD Header | Dark purple bg | Dark navy with cyan border-bottom glow |
| Cards | White bg, purple border | Dark panel bg, cyan border glow |
| Buttons | Orange accent | Cyan glow with hover pulse |
| Progress bars | Purple fill | Cyan gradient with glow |
| Badges | Orange/purple | Cyan outline with glow |
| Text | Dark purple | Near-white cyan tint |
| Background | Light purple (#FBFAFD) | Dark navy (#0A1628) |

---

### What Stays the Same

- All React component structure
- State management (GameContext)
- Scoring logic
- SCORM/xAPI integration
- Content JSON structure
- Navigation flow
- Accessibility features (ARIA labels, focus states)

---

### Technical Details

#### CSS Variable Mapping

```css
:root {
  /* Hi-Tech Theme - Force dark aesthetic */
  --background: 215 60% 10%;      /* #0A1628 */
  --foreground: 200 100% 94%;     /* #E0F4FF */
  
  --primary: 190 100% 50%;        /* #00D4FF */
  --primary-foreground: 215 60% 6%;
  
  --secondary: 210 55% 15%;       /* Dark panel */
  --secondary-foreground: 200 100% 94%;
  
  --accent: 190 100% 50%;         /* Cyan glow */
  --accent-foreground: 215 60% 6%;
  
  --card: 210 55% 12%;            /* #0D1B2A */
  --card-foreground: 200 100% 94%;
  
  --border: 210 55% 23%;          /* #1A3A5C */
  
  /* Gamification tokens */
  --success: 155 100% 50%;        /* #00FF88 */
  --warning: 16 100% 60%;         /* #FF6B35 */
  --highlight: 190 80% 15%;       /* Dark cyan tint */
}
```

#### New Glow Utilities

```css
.glow-cyan {
  box-shadow: 
    0 0 10px hsl(190 100% 50% / 0.3),
    0 0 20px hsl(190 100% 50% / 0.2),
    0 0 40px hsl(190 100% 50% / 0.1);
}

.tech-border {
  border: 1px solid hsl(var(--border));
  box-shadow: 
    inset 0 0 20px hsl(190 100% 50% / 0.05),
    0 0 15px hsl(190 100% 50% / 0.1);
}
```

---

### Risk Assessment

| Aspect | Risk Level | Reason |
|--------|------------|--------|
| CSS Variables | None | Just value changes |
| Component Logic | None | No code changes |
| Tailwind Classes | None | Same class names, new values |
| Animations | Low | Additive only |
| Accessibility | Low | Same contrast ratios maintained |
| Browser Support | None | Standard CSS features |

---

### Optional Enhancements (Not Required)

These could be added later if desired:

1. **Scanline overlay** - Subtle animated horizontal lines
2. **Corner brackets** - Tech frame decorations on cards
3. **Typing effect** - For text reveals
4. **Sound effects** - UI feedback sounds
5. **Particle effects** - Background ambient particles

---

### Files Modified

```text
src/index.css          ← Full color palette replacement + new utilities
tailwind.config.ts     ← New animation keyframes
```

No other files need modification - the semantic Tailwind classes (`bg-primary`, `text-accent`, etc.) automatically pick up the new values.
