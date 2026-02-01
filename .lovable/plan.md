
# Fix Patient Header Card Text Contrast

## Problem
The text in the patient info cards (Diagnosis, Living Situation, PPS Score, Care Context) has incorrect color contrast:
- **Light mode**: Text is currently white on a light background (hard to read)
- **Dark mode**: Text should be white on the dark background

## Root Cause
The cards use `bg-sidebar-accent` which is:
- Light mode: `hsl(200 35% 90%)` - a light grayish color
- Dark mode: `hsl(210 50% 15%)` - a dark blue color

The current `text-primary-foreground` class applies white text in both modes, which only works in dark mode.

## Solution
Update the text and icon colors to be theme-aware:
- **Light mode**: Use dark text (`text-foreground` or explicit dark color)
- **Dark mode**: Use white text (`dark:text-white` or `dark:text-primary-foreground`)

## File Changes

### `src/components/PatientHeader.tsx`

Update the four info cards to use conditional dark/light text colors:

**Icons** (Activity, Home, Pill):
- Change from: `text-primary-foreground dark:text-primary`
- Change to: `text-primary dark:text-primary-foreground`

**Label text** (Diagnosis, Living Situation, etc.):
- Change from: `text-primary-foreground/75`
- Change to: `text-foreground/75 dark:text-primary-foreground/75`

**Value text** (the actual patient data):
- Change from: `text-primary-foreground`
- Change to: `text-foreground dark:text-primary-foreground`

This ensures:
- Light mode: Dark text on light sidebar-accent background
- Dark mode: White text on dark sidebar-accent background
