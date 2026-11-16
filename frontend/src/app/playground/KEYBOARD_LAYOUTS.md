# 📱 Mobile Keyboard Layouts

## JavaScript Layout
```
┌─────────────────────────────────────────────────────┐
│ ⇥ [Suggestion...]    ↶    ↷    │ {} () [] "" ' => = ; . │
└─────────────────────────────────────────────────────┘
       ↑ Tab/Accept           ↑ Undo/Redo   ↑ Code Keys
```

## HTML Layout
```
┌─────────────────────────────────────────────────────┐
│ ⇥ [Suggestion...]    ↶    ↷    │ < > / = "" </> {} () ; │
└─────────────────────────────────────────────────────┘
```

## CSS Layout
```
┌─────────────────────────────────────────────────────┐
│ ⇥ [Suggestion...]    ↶    ↷    │ {} : ; # . () % "" -  │
└─────────────────────────────────────────────────────┘
```

## Python Layout
```
┌─────────────────────────────────────────────────────┐
│ ⇥ [Suggestion...]    ↶    ↷    │ : () [] "" ' = # _ {} │
└─────────────────────────────────────────────────────┘
```

## With Optional Enhanced Keyboard (⚡)

```
                                        ⚡
                                   [Quick Actions]
                                  ┌─────────────────┐
                                  │  const x = 1;   │
                                  │  const [a, b]   │
                                  │  =>             │
                                  │  .map()         │
                                  │  .filter()      │
                                  │  console.log()  │
                                  └─────────────────┘
                                        ▲
┌─────────────────────────────────────────────────────┐
│ ⇥ [Suggestion...]    ↶    ↷    │ {} () [] "" ' => = ; . │
└─────────────────────────────────────────────────────┘
```

---

## Touch Target Sizes

All buttons follow iOS Human Interface Guidelines:

- **Minimum touch target:** 44x44 points (CSS pixels)
- **Recommended spacing:** 8-12px between buttons
- **Button padding:** 0 14px (width flexible, minimum 44px)
- **Button height:** 44px for keyboard, 48px for floaters

```
┌──────────────────────┐
│   44px × 44px        │
│                      │  Minimum touch target
│   (8-12px gap)       │  (iOS guideline)
└──────────────────────┘
```

---

## Visual Hierarchy

### Color Scheme
```
Primary Actions (Tab/Accept):  #22d3ee (cyan)
Secondary Actions (Undo/Redo): #22d3ee (cyan)
Code Keys:                      #e6edf7 (light gray)
Background:                     rgba(8, 13, 23, 0.98) (dark blue)
```

### Button States
```
Default:  rgba(255, 255, 255, 0.06) background
Hover:    rgba(255, 255, 255, 0.1) background
Active:   rgba(34, 211, 238, 0.25) background + scale(0.95)
```

---

## Responsive Breakpoints

### Standard (>600px height)
```
Button size:    44x44px
Gap:            8px
Padding:        8px
Font:           0.95rem
```

### Compact (<600px height)
```
Button size:    40x40px
Gap:            6px
Padding:        6px
Font:           0.85rem
```

---

## Animation Timing

| Action | Duration | Easing |
|--------|----------|--------|
| Button tap | 150ms | cubic-bezier(0.2, 0, 0, 1) |
| Accept popup | 200ms | cubic-bezier(0.34, 1.56, 0.64, 1) |
| Quick keys popup | 250ms | cubic-bezier(0.34, 1.56, 0.64, 1) |
| Button hover | 150ms | ease |

---

## Keyboard Visibility Logic

```
Show keyboard if:
  ✓ On touch device (pointer: coarse)
  ✓ AND editor is focused
  ✓ AND not in landscape on small screen (optional)

Hide keyboard if:
  ✓ User clicks outside editor
  ✓ User scrolls away from editor
  ✓ Device switched to landscape (optional)
```

---

## Accessibility Features

- ✅ Proper `role="toolbar"` on keyboard container
- ✅ `aria-label` on all buttons
- ✅ `title` attributes on code keys
- ✅ Keyboard focus management
- ✅ High contrast colors (WCAG AA)
- ✅ Minimum 44x44px touch targets
- ✅ Semantic HTML with proper labels

---

## Performance Optimizations

- ✅ CSS animations only (no JavaScript animations)
- ✅ `transform` and `opacity` for smooth GPU acceleration
- ✅ No layout thrashing
- ✅ Event delegation for button clicks
- ✅ Debounced focus handlers
- ✅ Lazy-loaded Enhanced keyboard (optional)

---

## Safe Area Handling

```tsx
padding: calc(8px + env(safe-area-inset-bottom))
  ↓
On iPhone with notch/dynamic island:
- Adds automatic padding for home indicator
- Prevents keyboard from overlapping home indicator
- Works on all iOS devices automatically
```

---

## Examples by Language

### JavaScript: Inserting Arrow Function
```
User taps: "=>"
Keyboard inserts: "=>"
Cursor positioned: after "=>"
```

### Python: Function Definition
```
User taps: Custom quick key "def"
Keyboard inserts: "def name():\n    pass"
Cursor positioned: after "name"
```

### HTML: Opening Tag
```
User taps: "<"
Keyboard inserts: "<"
Auto-completion offers: matching closing tag
User taps "Tab" to accept
```
