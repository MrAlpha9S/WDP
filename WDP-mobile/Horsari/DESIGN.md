# Horsari — UI/UX Design System
**Cross-Platform Design Specification for Web (React) and Mobile (React Native)**

---

## 1. Product UI Overview

### Visual Identity
Horsari is a premium horse racing management platform targeting tournament organizers, horse owners, referees, and administrative staff. The visual language is **dark, refined, and data-dense** — drawing from luxury sports platforms with a strong editorial quality.

### Design Style
- **Theme:** Dark mode first. Near-black backgrounds with layered surface elevations.
- **Accent:** Deep red (`#dc2626` family) as the sole brand color — used for CTAs, focus states, and critical highlights.
- **Typography:** Serif display font (Playfair Display) for headings paired with a geometric sans-serif (DM Sans) for UI elements — creating a sport-editorial tension.
- **Density:** Medium-high information density. Tables, panels, and grids hold significant data without feeling cluttered.
- **Aesthetic:** Professional, trustworthy, premium. Not playful. Not minimal. Purposefully structured.

### UX Direction
- Role-based navigation: Admin, Referee, Horse Owner each have dedicated dashboards and sidebar navigation.
- Detail panels slide in from the right instead of navigating to a new page — keeping context visible.
- Status is always visible: badges, progress bars, and colored indicators eliminate ambiguity.
- Forms are multi-step where complex (race creation wizard) and single-step where simple.

### Target Experience
Users should feel they are operating professional software — fast, clear, consistent. Every action should have visible feedback. Data should be scannable at a glance.

---

## 2. Cross-Platform Design Principles

### Web (React + Tailwind)
- **Desktop layout:** Persistent left sidebar + top navbar + scrollable main content + optional right detail panel.
- **Mouse interaction:** Hover states on all interactive elements (`hover:bg-...`, `hover:border-...`). Cursor changes to `pointer` on clickable items.
- **Keyboard interaction:** Focus rings visible with `focus:ring-1 focus:ring-red-900/40`. Tab order follows DOM structure. Buttons and inputs are keyboard-accessible.
- **Scrolling:** Custom scrollbar styling applied via `.custom-scrollbar`. Horizontal scroll on timeline views with `overflow-x-auto`.

### Mobile (React Native)
- **Mobile layout:** Bottom tab bar for primary navigation. Stack screens for detail flows. No persistent sidebar — use drawer or bottom sheet instead.
- **Touch interaction:** Minimum 44×44pt touch targets on all interactive elements. No hover states — use `Pressable` with `onPressIn` visual feedback.
- **Gesture behavior:** Swipe-to-dismiss on modals and bottom sheets. Pull-to-refresh on list screens. Swipe between tabs where appropriate.

### Shared Rules (Both Platforms Must Enforce)
| Rule | Web | Mobile |
|---|---|---|
| Color palette | Tailwind custom config | StyleSheet constants |
| Typography scale | Tailwind `text-[Npx]` | `fontSize` tokens |
| Spacing system | Tailwind spacing | `StyleSheet` tokens |
| Status badge colors | `bg-emerald/amber/red-500/15` | Equivalent RGBA |
| Component structure | Reusable TSX | Reusable RN components |
| Dark theme | Default | Default (no light toggle) |
| Loading pattern | `<Loader2 animate-spin>` | `<ActivityIndicator>` |
| Empty state pattern | Icon + message | Same structure |
| Error display | Banner below trigger | Inline or toast |

---

## 3. Design System

### 3.1 Colors

#### Brand / Primary
| Token | Hex | Usage |
|---|---|---|
| `primary` | `#dc2626` | CTA buttons, active tab indicators |
| `primary-hover` | `#b91c1c` | Button hover state |
| `primary-dark` | `#991b1b` | Button shadow, deep accent |
| `primary-darkest` | `#7f1d1d` | Gradient terminus, overlay |
| `primary-surface` | `#991b1b1a` | Badge backgrounds (~10% opacity) |

#### Background / Surface (Dark Theme)
| Token | Hex | Usage |
|---|---|---|
| `bg-base` | `#0f0f0f` | App root, navbar background |
| `bg-elevated` | `#141414` | Cards, modals, main content area |
| `bg-surface` | `#1a1a1a` | Table headers, input backgrounds, nested cards |
| `bg-panel` | `#161616` | Sidebar, detail panels |
| `bg-input-focus` | `#1f1f1f` | Input background on focus |

#### Text
| Token | Hex | Tailwind Class | Usage |
|---|---|---|---|
| `text-primary` | `#ffffff` | `text-white` | Headings, primary data |
| `text-secondary` | `#d1d5db` | `text-gray-300` | Body copy, labels |
| `text-muted` | `#9ca3af` | `text-gray-400` | Secondary labels, captions |
| `text-subtle` | `#6b7280` | `text-gray-500` | Table column headers, hints |
| `text-disabled` | `#4b5563` | `text-gray-600` | Empty states, placeholders |

#### Border
| Token | Value | Usage |
|---|---|---|
| `border-subtle` | `rgba(255,255,255,0.07)` | Default card/container borders |
| `border-default` | `rgba(255,255,255,0.10)` | Standard dividers |
| `border-strong` | `rgba(255,255,255,0.20)` | Hover-state borders |
| `border-focus` | `rgba(220,38,38,0.60)` | Input focus border |

#### Status / Semantic
| Token | Hex | Usage |
|---|---|---|
| `status-success` | `#22c55e` | Active, confirmed, success states |
| `status-success-bg` | `#22c55e26` | Success badge background |
| `status-warning` | `#eab308` | Pending, upcoming states |
| `status-warning-bg` | `#eab30826` | Warning badge background |
| `status-error` | `#ef4444` | Error, declined, canceled states |
| `status-error-bg` | `#ef444426` | Error badge background |
| `status-info` | `#3b82f6` | Running, in-progress states |
| `status-info-bg` | `#3b82f626` | Info badge background |

#### Public Pages (Light Theme)
| Token | Hex | Usage |
|---|---|---|
| `light-bg` | `#fdf5f5` | Public home page background |
| `light-surface` | `#ffffff` | Cards on public pages |
| `light-text` | `#111111` | Headings on public pages |

---

### 3.2 Typography

#### Font Families
| Role | Family | Import |
|---|---|---|
| Display / Headings | Playfair Display | Google Fonts (`ital,wght@0,400..900;1,400..900`) |
| UI / Body | DM Sans | Google Fonts (`opsz,wght@9..40,100..1000`) |

**Web:** Loaded via `<link>` in `index.html` using Google Fonts URL.
**Mobile:** Embed font files using `expo-font` or equivalent. Use system serif fallback if unavailable.

#### Type Scale
| Token | Size | Weight | Family | Usage |
|---|---|---|---|---|
| `display-xl` | 32px | 900 | Playfair Display | Page hero titles |
| `display-lg` | 28px | 800 | Playfair Display | Section page titles |
| `display-md` | 24px | 700 | Playfair Display | Dashboard stat values |
| `heading-lg` | 17px | 700 | DM Sans | Card titles, panel headers |
| `heading-md` | 15px | 600 | DM Sans | Sub-section labels |
| `body-lg` | 14px | 400 | DM Sans | Primary body text |
| `body-md` | 13px | 400 | DM Sans | Secondary body, table cells |
| `body-sm` | 12px | 400 | DM Sans | Captions, metadata |
| `label` | 11px | 700 | DM Sans | Table column headers (uppercase) |
| `tiny` | 10px | 500 | DM Sans | Badges, status chips |
| `micro` | 9px | 400 | DM Sans | Supplemental metadata only |

#### Letter Spacing
| Context | Value |
|---|---|
| Uppercase table headers | `tracking-widest` (0.1em) |
| Button text (uppercase) | `tracking-widest` (0.1em) |
| Badge text | `tracking-[0.22em]` |
| Display headings | `tracking-tight` |
| Body text | Default (0) |

---

### 3.3 Spacing System

All spacing values map to Tailwind's default scale. Use these tokens consistently.

| Token | px | Tailwind | Usage |
|---|---|---|---|
| `space-xs` | 4px | `gap-1`, `p-1` | Icon padding, tight row gaps |
| `space-sm` | 8px | `gap-2`, `p-2` | Inner icon button padding |
| `space-md` | 12px | `gap-3`, `p-3` | Form field gaps, badge padding |
| `space-lg` | 16px | `gap-4`, `p-4` | Table cell padding, section gaps |
| `space-xl` | 20px | `gap-5`, `p-5` | Card padding |
| `space-2xl` | 24px | `gap-6`, `p-6` | Modal padding, section padding |
| `space-3xl` | 32px | `gap-8`, `p-8` | Page-level vertical spacing |

#### Padding Conventions
- **Button (primary):** `py-3 px-5`
- **Button (small):** `py-2 px-3`
- **Input field:** `py-2.5 px-3` (with leading icon: `pl-9`)
- **Table cell:** `p-4`
- **Card body:** `p-5` or `px-6 py-5`
- **Modal body:** `px-5 py-4` or `p-6`
- **Navbar:** `px-6` (horizontal content), `h-14` (height)
- **Sidebar:** `px-3 py-2` (nav items)

#### Border Radius
| Token | px | Tailwind | Usage |
|---|---|---|---|
| `radius-sm` | 6px | `rounded` | Badges, small pills |
| `radius-md` | 8px | `rounded-lg` | Inputs, small buttons, table rows |
| `radius-lg` | 12px | `rounded-xl` | Cards, modals, panels, primary buttons |
| `radius-full` | 9999px | `rounded-full` | Avatar circles, toggle pills |

---

## 4. Component Design System

### 4.1 Button

**Purpose:** Trigger actions. Three visual variants.

#### Variant: Primary
- Background: `bg-red-800` → hover: `bg-red-700`
- Text: `text-white font-semibold text-[13px] tracking-widest uppercase`
- Padding: `py-3 px-5`
- Border radius: `rounded-xl`
- Shadow on hover: `shadow-lg shadow-red-900/40`
- Active: `active:scale-[0.99]`
- Disabled: `opacity-50 cursor-not-allowed`
- Transition: `transition-all duration-150`

**Web (Tailwind):**
```tsx
<button className="bg-red-800 hover:bg-red-700 disabled:opacity-50 text-white font-semibold text-[13px] tracking-widest uppercase py-3 px-5 rounded-xl transition-all duration-150 hover:shadow-lg hover:shadow-red-900/40 active:scale-[0.99]">
  Label
</button>
```

**Mobile (React Native):**
```tsx
<Pressable
  style={({ pressed }) => ({
    backgroundColor: pressed ? '#b91c1c' : '#dc2626',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    opacity: disabled ? 0.5 : 1,
  })}
>
  <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13, letterSpacing: 1.5, textTransform: 'uppercase' }}>
    Label
  </Text>
</Pressable>
```

#### Variant: Secondary (Outlined)
- Background: `transparent`
- Border: `border border-white/10` → hover: `border-white/20`
- Text: `text-gray-300 font-medium text-[13px]`
- Padding: `py-2.5 px-4`
- Border radius: `rounded-lg`

#### Variant: Icon Button
- Size: `w-8 h-8` (32px square)
- Background: `bg-white/5` → hover: `bg-white/10`
- Border: `border border-white/10`
- Border radius: `rounded-lg`
- Icon size: 14–16px, `text-gray-400`

#### States Summary
| State | Visual Change |
|---|---|
| Default | Base styles |
| Hover | Darker bg or border, shadow for primary |
| Active | `scale-[0.99]` |
| Disabled | `opacity-50`, `cursor-not-allowed` |
| Loading | Replace label with `<Loader2 className="animate-spin">` |
| Focus | `outline-2 outline-offset-2 outline-red-600` |

---

### 4.2 Input

**Purpose:** Text entry fields for forms and search.

#### Text Input
- Background: `bg-[#1a1a1a]`
- Border: `border border-white/[0.08]`
- Focus: `focus:border-red-800/60 focus:bg-[#1f1f1f] focus:ring-1 focus:ring-red-900/40`
- Border radius: `rounded-lg`
- Padding: `py-2.5 px-3` (no icon) or `py-2.5 pl-9 pr-10` (with leading icon)
- Text: `text-sm text-gray-100`
- Placeholder: `placeholder-gray-600`
- Transition: `transition-all duration-150`

**Web (Tailwind):**
```tsx
<input className="w-full bg-[#1a1a1a] border border-white/8 rounded-lg pl-9 pr-3 py-2.5 text-sm text-gray-100 placeholder-gray-600 outline-none focus:border-red-800/60 focus:bg-[#1f1f1f] focus:ring-1 focus:ring-red-900/40 transition-all duration-150" />
```

**Mobile (React Native):**
```tsx
<TextInput
  style={{
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    color: '#f3f4f6',
    fontSize: 14,
  }}
  placeholderTextColor="#4b5563"
/>
```

#### Select / Dropdown
- Same visual as text input
- Custom chevron icon layered absolutely on the right
- Uses `appearance-none` on web; `Picker` component on mobile

#### States
| State | Visual |
|---|---|
| Default | Dark bg, subtle border |
| Focus | Red border tint, slightly lighter bg, soft ring |
| Error | `border-red-500`, error message below in `text-red-400 text-[12px]` |
| Disabled | `opacity-50 cursor-not-allowed` |
| With icon | Leading icon at `left-3`, `text-gray-500` |

---

### 4.3 Card

**Purpose:** Contained content block with visual separation from background.

#### Standard Card
- Background: `bg-[#1a1a1a]`
- Border: `border border-white/[0.08]`
- Border radius: `rounded-xl`
- Padding: `p-5` or `px-6 py-5`

#### Elevated Card (modal/panel)
- Background: `bg-[#141414]`
- Border: `border border-white/[0.07]`
- Shadow: `shadow-lg shadow-black/20`

#### Stat Card (dashboard)
- Same as Standard Card
- Header row: icon badge (colored) + label + value
- Subtext row: colored indicator + description text

**Mobile:** Use `View` with equivalent `StyleSheet` properties. No `shadow-` prop on Android — use `elevation: 4` instead.

---

### 4.4 Modal

**Purpose:** Overlay dialogs for forms, confirmations, and detail views.

#### Overlay
- Background: `bg-black/60`
- Blur: `backdrop-blur-sm`
- Z-index: `z-50`
- Alignment: `fixed inset-0 flex items-center justify-center`

#### Modal Container
- Background: `bg-[#161616]`
- Border: `border border-white/10`
- Border radius: `rounded-xl`
- Shadow: `shadow-2xl shadow-black/60`
- Max width: `max-w-md` to `max-w-2xl` (varies by content)
- Max height: `max-h-[90vh] overflow-y-auto`

#### Modal Header
- Padding: `px-5 py-4` or `px-6 py-5`
- Border bottom: `border-b border-white/[0.05]`
- Layout: `flex items-center justify-between`
- Title: `text-[15px] font-bold text-white` (Playfair Display for major modals)
- Close button: Icon button (`X` from Lucide), top right

#### Modal Footer
- Padding: `px-5 py-3`
- Border top: `border-t border-white/5`
- Layout: `flex justify-end gap-3`
- Buttons: Secondary (Cancel) + Primary (Confirm)

**Mobile (React Native):**
```tsx
<Modal visible={visible} transparent animationType="fade">
  <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' }}>
    <View style={{ backgroundColor: '#161616', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)', width: '90%', maxHeight: '85%' }}>
      {/* Header, Body, Footer */}
    </View>
  </View>
</Modal>
```

---

### 4.5 Navbar

**Purpose:** Top-level navigation and identity bar.

#### Admin / Authenticated Navbar
- Height: `h-14` (56px)
- Background: `bg-[#0f0f0f]`
- Border bottom: `border-b border-white/10`
- Position: `sticky top-0 z-50`
- Layout: `flex items-center justify-between px-6`

**Left zone:** Logo text ("HORSARI") — Playfair Display, uppercase, `text-red-500`, `font-bold text-[22px]`
**Center zone:** Navigation links (hidden on small screens) — `text-[13px] text-gray-400 hover:text-white`
**Right zone:** Search icon, notification bell with badge, user avatar with dropdown

**Mobile:** Navbar becomes a simple header bar with back button (when in sub-screen) or brand logo (on home). No center links. Notifications as icon in header.

#### Public Navbar (light)
- Background: `bg-white`
- Border bottom: `border-b border-gray-200`
- Text: Dark on white

---

### 4.6 Sidebar

**Purpose:** Role-specific primary navigation on desktop.

- Width: `w-[185px]` to `w-[220px]`, `shrink-0`
- Background: `bg-[#161616]`
- Border right: `border-r border-white/10`
- Height: `h-full` or `min-h-screen`
- Padding: `p-3`

#### Nav Item
- Layout: `flex items-center gap-2.5 px-3 py-2 rounded-lg`
- Default: `text-gray-400` icon + label
- Active: `bg-white/8 text-white` icon + label
- Hover: `hover:bg-white/5 hover:text-white`
- Font: `text-[13px] font-medium`

**Section labels:**
- `text-[10px] font-bold uppercase tracking-widest text-gray-600 px-3 pt-4 pb-1`

**Mobile Equivalent:** Bottom tab bar with 4–5 items. Icon only (label appears on active tab). Use `@react-navigation/bottom-tabs`.

---

### 4.7 Tabs

**Variant A: Underline tabs** (used in detail panels)
- Container: `flex border-b border-white/5`
- Active item: `text-white border-b-2 border-white pb-2 font-semibold`
- Inactive item: `text-gray-500 hover:text-gray-300 pb-2`
- Font: `text-[13px]`
- Gap: `gap-5` to `gap-6`

**Variant B: Pill/Toggle tabs** (used for view mode switching)
- Container: `flex bg-[#1a1a1a] p-1 rounded-lg border border-white/5`
- Active item: `bg-white/10 text-white rounded-md shadow-sm`
- Inactive item: `text-gray-500 hover:text-white rounded-md`
- Item: `px-4 py-1.5 text-[12px] font-medium transition-all duration-150`

**Mobile:** Use `ScrollView` horizontal for underline tabs. Use custom pill toggle for binary view switching.

---

### 4.8 Dropdown Menu

**Purpose:** Context actions triggered by avatar or icon button.

- Trigger: Click on target element
- Container: `absolute right-0 mt-2 w-56 bg-[#1a1a1a] rounded-xl border border-white/10 shadow-xl z-50`
- Item: `flex items-center gap-2.5 px-4 py-2 text-[13.5px] text-gray-300 hover:bg-white/5 hover:text-white transition-colors`
- Separator: `border-t border-white/5 my-1`
- Destructive item: `text-red-400 hover:bg-red-950/30`

**Mobile:** Use `ActionSheet` (bottom sheet) or `react-native-action-sheet` instead of floating dropdown.

---

### 4.9 Badge / Status Pill

**Purpose:** Inline status indicators on data rows.

- Font: `text-[10px] to text-[12px] font-bold uppercase tracking-widest`
- Padding: `px-2.5 py-1` or `px-2 py-0.5`
- Border radius: `rounded` or `rounded-full`
- Always: Color background + matching text + matching border

| Status | Background | Text | Border |
|---|---|---|---|
| Active / Success | `bg-emerald-500/15` | `text-emerald-400` | `border-emerald-500/30` |
| Pending / Upcoming | `bg-amber-500/15` | `text-amber-400` | `border-amber-500/30` |
| Declined / Error | `bg-red-500/15` | `text-red-400` | `border-red-500/30` |
| Running / Info | `bg-blue-500/15` | `text-blue-400` | `border-blue-500/30` |
| Completed / Neutral | `bg-gray-500/15` | `text-gray-400` | `border-gray-500/30` |

---

### 4.10 Avatar

**Purpose:** User identity visual in navbars, tables, and profiles.

- Shape: Circle (`rounded-full`)
- Sizes: `w-8 h-8` (32px, table), `w-10 h-10` (40px, navbar), `w-16 h-16` (64px, profile)
- Image: `object-cover` with `src` from API or external URL
- Fallback: Initials (2 letters, uppercase) on colored background
  - Background: Semi-transparent colored surface (role-based or random from set)
  - Text: `text-white font-bold text-[11px]` to `text-[14px]`

**Mobile:** `Image` with `borderRadius: size/2`. Initials fallback with `View` + `Text`.

---

### 4.11 Form

**Purpose:** Multi-field data entry, both single-step and wizard.

#### Single-Step Form
- Layout: `flex flex-col gap-4`
- Label: `text-[12px] font-semibold text-gray-400 uppercase tracking-wider mb-1`
- Input field (see Input component)
- Error message: `text-[11px] text-red-400 mt-1`
- Submit button: Full width, Primary variant

#### Wizard / Multi-Step Form
- Steps shown as numbered indicator at top
- Active step: `text-white` with filled circle
- Inactive step: `text-gray-600` with outline circle
- Navigation: Previous/Next buttons in modal footer
- Progress: Visual step counter (e.g., "Step 2 of 4")

#### File Upload
- Container: Dashed border, `border-dashed border-2 border-white/20`
- On drag-over: `border-red-500/50 bg-red-900/10`
- Icon: Upload cloud icon, `text-gray-500`
- Text: "Click to upload or drag and drop"
- File chip: `bg-[#1a1a1a] border border-white/10 rounded-lg px-3 py-2` with file name + delete icon

---

### 4.12 Table / Data List

**Purpose:** Displaying collections of records with actions.

#### Table Structure
- Container: `overflow-hidden rounded-xl border border-white/8`
- Header row: `bg-[#1a1a1a] border-b border-white/5`
- Header cell: `p-4 text-[11px] font-bold uppercase tracking-widest text-gray-500`
- Data row: `border-b border-white/5 hover:bg-white/[0.02] transition-colors cursor-pointer`
- Data cell: `p-4 text-[13px] text-gray-300`
- Selected row: `bg-white/5`

#### Pagination
- Container: `flex items-center justify-between border-t border-white/5 px-4 pt-4`
- Info text: `text-[13px] text-gray-500`
- Buttons: `px-3 py-1.5 bg-[#222] border border-white/10 rounded text-[12px] hover:bg-white/8`
- Disabled: `opacity-50 cursor-not-allowed`

**Mobile:** Replace `<table>` with `FlatList`. Each row becomes a `Pressable` card. Header becomes sticky section header or omit (use labels per row instead).

---

### 4.13 Loading State

- Full-screen: Centered spinner + text
- Inline (button): Replace button text with `<Loader2 size={16} className="animate-spin" />`
- Table row: Skeleton placeholder rows with `animate-pulse`
- Overlay: `absolute inset-0 bg-[#161616]/80 backdrop-blur-sm flex items-center justify-center z-10`

**Spinner:**
```tsx
<Loader2 className="animate-spin text-red-500" size={32} />
<p className="text-[13px] text-gray-400 animate-pulse mt-2">Loading...</p>
```

**Mobile:** `<ActivityIndicator color="#dc2626" size="large" />` with equivalent overlay `View`.

---

### 4.14 Empty State

- Container: `flex flex-col items-center justify-center py-16 text-center`
- Icon: Lucide icon, `w-10 h-10 text-gray-700`
- Title: `text-[14px] font-semibold text-gray-500 mt-3`
- Subtitle: `text-[12px] text-gray-600 mt-1`
- Optional CTA: Secondary button below

---

## 5. Layout System

### 5.1 Desktop Layout (Web)

```
┌────────────────────────────────────────────────────────────┐
│  NAVBAR (h-14, sticky, bg-[#0f0f0f])                       │
├──────────────┬─────────────────────────────────────────────┤
│              │                                             │
│  SIDEBAR     │  MAIN CONTENT                   │ DETAIL   │
│  w-[185px]   │  (flex-1, overflow-auto)        │ PANEL    │
│  shrink-0    │                                 │ ~500px   │
│  bg-[#161616]│  [Page Title + Actions]         │ (slide)  │
│              │  [Filters / Toolbar]            │          │
│  [Logo]      │  [Table or Grid]                │          │
│  [Nav links] │  [Pagination]                   │          │
│              │                                 │          │
└──────────────┴─────────────────────────────────────────────┘
```

**Rules:**
- Sidebar is always visible on desktop. Never collapses automatically.
- Detail panel slides in from the right when a row is selected. Does NOT navigate to a new page.
- Main content scrolls independently.
- Navbar is `sticky top-0` with `z-50`.

### 5.2 Mobile Layout (React Native)

```
┌────────────────────────┐
│ HEADER BAR             │
│ (Logo or Back + Title) │
├────────────────────────┤
│                        │
│  SCREEN CONTENT        │
│  (ScrollView /         │
│   FlatList)            │
│                        │
│                        │
├────────────────────────┤
│ BOTTOM TAB BAR         │
│ (4–5 items, icons)     │
└────────────────────────┘
```

**Rules:**
- No sidebar on mobile — navigation lives in the bottom tab bar.
- Detail views are pushed as new screens via stack navigator.
- Bottom tabs: Home, Tournaments, Races, Inbox, Profile (role-dependent).
- Modals present as bottom sheets or full-screen modal screens.

### 5.3 Consistent Rules (Both)
| Element | Web | Mobile |
|---|---|---|
| Primary nav | Left sidebar | Bottom tab bar |
| Detail view | Right sliding panel | Pushed stack screen |
| Modals | Centered overlay | Bottom sheet or Modal |
| Search | Top bar (input in navbar) | Search screen or header input |
| Page title | `h1` inside main content | `<Text>` in header bar |

---

## 6. Screen Structure

### 6.1 Login Page
**Detected from source**

- **Purpose:** Authenticate users (email/password). Toggle between Login and Sign Up.
- **Background:** `bg-[#0f0f0f]` with radial red glow effect centered behind the form card.
- **UI blocks:**
  - Logo mark: "HORSARI" in Playfair Display + `text-red-500`
  - Tab toggle: Login / Sign Up (pill-style tabs)
  - Form: Email + Password inputs
  - Password rules list (sign-up only): Checklist with visual tick/cross per rule
  - Submit button: Full-width, Primary variant
  - Divider: "or continue with"
  - Google OAuth button: Outlined, with Google icon
- **User actions:** Submit login, switch to sign-up, sign in with Google.

---

### 6.2 Public Home Page
**Detected from source**

- **Purpose:** Marketing/landing page for unauthenticated visitors.
- **Background:** Light pink (`#fdf5f5`) with subtle red stripe pattern.
- **UI blocks:**
  - Navbar: White background, logo, nav links, login/signup CTAs
  - Hero section: Heading (Playfair Display) + subtext + two CTA buttons
  - Featured race card: Horizontal layout with image + race details + badges
  - Race grid: 3-column card grid with race images, titles, locations, dates
- **User actions:** Browse races, click to view detail, log in / sign up.

---

### 6.3 Google Register Page
**Detected from source**

- **Purpose:** Complete registration after Google OAuth (fill in role + license info).
- **Background:** `#f0f0ef` (light off-white)
- **UI blocks:**
  - Step 1: Role selection (card-based — visual role picker)
  - Step 2: Role-specific details (file upload for license, additional fields)
  - Submit button
- **User actions:** Select role, upload documents, confirm registration.

---

### 6.4 Admin Dashboard (System Dashboard)
**Detected from source**

- **Purpose:** System-level overview for administrators.
- **UI blocks:**
  - Stat card grid (2×2): Total Users, Active Tournaments, Today's Races, Pending Approvals
  - Pending Invitations table: User name, role, tournament, status, date
  - Active Races list: Race name, tournament, status, track, time
- **User actions:** View stats, click invitations to approve/decline, view race details.

---

### 6.5 Admin Users Page
**Detected from source**

- **Purpose:** Browse and manage all platform users.
- **UI blocks:**
  - Toolbar: Search input, role filter dropdown, status filter, date range picker
  - User table: Avatar + name, email, role badge, status badge, confirmed indicator, updated date
  - Detail panel (right): Slides in on row click — shows user photo, info tabs (Overview, Role Info, History), action buttons
- **User actions:** Search, filter, select user, view detail, edit, suspend/activate.

---

### 6.6 Tournament Management Page
**Detected from source**

- **Purpose:** Create, list, and manage racing tournaments.
- **UI blocks:**
  - Left sidebar: Overview stats, search input, status filter counts (Live, Upcoming, Completed)
  - Main content toolbar: View mode toggle (Table/Calendar), sort dropdown, Create Tournament button
  - Table view: Name, duration, status badge, prize pool, action icons (edit, delete)
  - Calendar view: Monthly grid with tournament blocks per day
  - Create modal: Name, dates, description, type, max participants
  - Delete confirmation modal
- **User actions:** Create, edit, delete, switch view mode, search/filter.

---

### 6.7 Race Scheduling Page
**Detected from source**

- **Purpose:** Schedule races within tournaments on a timeline or table view.
- **UI blocks:**
  - Toolbar: Playfair title, tournament filter, status filter, view toggle, Create Race button
  - Timeline view: Horizontal scroll, track names on Y-axis, time slots on X-axis, race blocks as absolute-positioned colored items
  - Table view: Race name + status, track, tournament, date & time, capacity progress bar, action icons
  - Right detail panel: Tabs (Overview, Registrations, Referees) — race info, prize pool, assigned referees
  - Create Race modal: 4-step wizard (Basic Info → Participants → Prizes → Summary)
- **User actions:** Scroll timeline, click race to view detail, create race, filter races.

---

### 6.8 Admin Rule Management Page
**Detected from source**

- **Purpose:** Define and manage racing rules and regulations.
- **UI blocks:**
  - Toolbar: Search, filter, Create Rule button
  - Rules list: Name, category, status, created date, actions
  - Detail panel (right): Full rule text, metadata, edit/delete actions
  - Rule modal: Create/edit form with rich text content area
- **User actions:** Create, edit, delete, view full rule text.

---

### 6.9 Admin Horses Page
**Detected from source**

- **Purpose:** Browse all registered horses on the platform.
- **UI blocks:**
  - Toolbar: Search, filters
  - Horses table: Horse image, name, owner, breed, age, status
  - Detail panel: Horse profile — full attributes, owner info, race history
- **User actions:** Search, filter, select horse, view detail.

---

### 6.10 Horse Owner Dashboard
**Detected from source**

- **Purpose:** Personal management hub for horse owners.
- **UI blocks:**
  - Header: Greeting (Playfair Display) + quick action buttons (Invite Jockey, Register Horse)
  - Stat cards (3-col): Total Horses, Upcoming Races, Active Invitations
  - Upcoming races table (2/3 width): Horse image, race name, date/time, status badge
  - Top performers list (1/3 width): Rank, horse image, name, win rate progress bar
  - Earnings bar chart (2/3 width): Monthly bars, period selector, Y-axis values
  - Recent activity feed (1/3 width): Timestamped event list with colored icons
- **User actions:** View stats, navigate to management sub-sections, check upcoming races.

---

### 6.11 Horse Owner Management Sub-Pages
**Detected from source**

Accessed via left sidebar in the owner layout.

| Sub-page | Purpose |
|---|---|
| **Horses** | List owned horses, view details, register new horse |
| **Races** | List registered races, registration status, details |
| **Jockeys** | View/invite jockeys, Jockey detail modal |
| **Invitations** | Manage received invitations (accept/decline) |
| **Financials** | Earnings overview, transaction history |

---

### 6.12 Referee Dashboard (Homepage)
**Detected from source**

- **Purpose:** Upcoming race schedule and recent invitations for referees.
- **UI blocks:**
  - Calendar widget: Highlighted dates with upcoming races
  - Invitation cards sidebar: Compact invite summaries with expand toggle
  - Expanded invitation: Full detail — race info, prize, coordinator notes, Accept/Decline buttons, mini calendar
- **User actions:** View calendar, expand invitations, accept/decline invitations.

---

### 6.13 Referee Inbox Page
**Detected from source**

- **Purpose:** All invitations received by the referee.
- **UI blocks:**
  - Filter badges: All, Pending, Accepted, Declined
  - Invitation card list: Compact cards with status badge, race/tournament info, expand action
- **User actions:** Filter by status, expand to view details, respond to invitations.

---

### 6.14 Referee Tournament List Page
**Detected from source**

- **Purpose:** Browse tournaments the referee is assigned to.
- **UI blocks:**
  - Tournament cards with status, date range, location
  - Filter/sort controls
- **User actions:** View tournament details, filter by status.

---

### 6.15 Referee Live / Race Monitor Pages
**Detected from source**

- **Purpose:** Live race management interface during an active race.
- **UI blocks:**
  - Pre-race checkup modal
  - Race order display
  - Post-race result entry
- **User actions:** Confirm pre-race checks, record results, submit post-race report.

---

## 7. Interaction Design

### 7.1 Button Behavior
| Platform | Interaction |
|---|---|
| Web | Hover: bg darkens + shadow. Active: `scale-[0.99]`. Click fires action. |
| Mobile | `Pressable` with `onPressIn` darkens bg. No hover. Haptic feedback on confirm actions. |

### 7.2 Form Behavior
- Validation: Inline — errors appear below the specific field after blur or submit attempt.
- Required fields: Error border `border-red-500` + message `text-[11px] text-red-400 mt-1`.
- Submit: Shows loading state (spinner replaces text) while awaiting response.
- Success: Dismiss form / close modal + optional success toast.
- Error: Toast notification or inline error banner above the form.

### 7.3 Loading State
- Buttons: Replace label with inline spinner icon.
- Page / list: Show centered `<ActivityIndicator>` or `<Loader2>` with descriptive text.
- Overlay: Semi-transparent backdrop with centered spinner for blocking operations.

### 7.4 Error State
- **Network errors:** Toast notification at top/bottom of screen — auto-dismiss after 4 seconds.
- **Form validation errors:** Inline below the relevant field. Never use alerts.
- **Empty list (not an error):** Friendly empty state component (see 4.14).
- **Permission errors:** Redirect to appropriate page with explanatory message.

### 7.5 Success State
- **Form submissions:** Close modal + show success toast.
- **Status changes:** Badge updates in-place with animated transition.
- **Destructive confirmations:** Confirmation modal before action; dismiss after success.

### 7.6 Web-specific Interactions
- **Hover:** All interactive elements have `hover:` state. No hover state silently ignored.
- **Keyboard:** `Enter` submits focused forms. `Escape` closes modals and panels. `Tab` navigates fields in order.
- **Click outside:** Clicking outside modals and dropdowns closes them.
- **Scroll:** Custom thin scrollbar on overflow containers.

### 7.7 Mobile-specific Interactions
- **Touch:** `Pressable` with `android_ripple` for Android feedback.
- **Swipe:** Swipe-to-dismiss on bottom sheets.
- **Pull-to-refresh:** On `FlatList` screens showing live data.
- **Long press:** Reveal context actions (edit/delete) on list items where appropriate.
- **Keyboard avoidance:** `KeyboardAvoidingView` wrapping all forms.

---

## 8. Responsive Rules

### Breakpoints (Web)
| Name | Min Width | Tailwind Prefix |
|---|---|---|
| Mobile | < 640px | (default) |
| Small | 640px | `sm:` |
| Medium | 768px | `md:` |
| Large | 1024px | `lg:` |
| X-Large | 1280px | `xl:` |

### Component Adaptation
| Component | Desktop (lg+) | Tablet (md) | Mobile (<640px) |
|---|---|---|---|
| Sidebar | Visible, `w-[185px]` | Collapsible or hidden | Hidden (bottom nav) |
| Detail panel | Slides in, 500px | Overlays full width | Full-screen modal |
| Stat card grid | 3–4 columns | 2 columns | 1 column |
| Table | Full columns visible | Fewer columns | Card-style list |
| Navbar links | Visible | Hidden | Hidden |
| Timeline | Full horizontal scroll | Full horizontal scroll | Not shown (use table) |
| Modal width | `max-w-md` to `max-w-2xl` | `max-w-lg` | Full screen or 92vw |
| Form columns | 2-column grid for fields | 2-column | 1-column |

### Layout Rules
- Sidebar hides below `lg`. Navigation shifts to bottom (mobile) or hamburger (tablet).
- Detail panels become full-screen modals on screens below `md`.
- Grids with `grid-cols-3` become `grid-cols-2` at `md` and `grid-cols-1` at `sm`.
- Min-width timeline views require horizontal scroll — acceptable on tablet/desktop, replaced by table view on mobile.

---

## 9. Accessibility & UX Rules

### Color Contrast
- All text on dark backgrounds meets minimum WCAG AA contrast ratio (4.5:1).
- `text-gray-300` on `bg-[#1a1a1a]` ≈ 5.5:1 (passes AA).
- `text-white` on `bg-[#0f0f0f]` ≈ 19:1 (passes AAA).
- Status colors always paired with icon or text label — never color alone as the sole indicator.

### Touch Targets (Mobile)
- Minimum 44×44pt touch target for all interactive elements.
- Icon-only buttons must have a visible label or `accessibilityLabel` prop.
- Spacing between tappable items: minimum 8pt gap.

### Text Readability
- Minimum body font: 13px (web), 13pt (mobile).
- No text smaller than 10px used for essential information.
- Line height: default Tailwind (1.5) for body. Tighter only for display headings.

### Feedback
- Every user action must produce visible feedback within 200ms.
- Loading states shown for any async operation taking more than 300ms.
- Error messages are descriptive — "Invalid email format" not "Error".
- Success is confirmed — do not silently complete critical actions.

### Error Prevention
- Destructive actions (delete, suspend) always require confirmation modal.
- Forms show validation errors before submit where possible (on blur).
- Irreversible actions labeled clearly: "Delete permanently" not just "Delete".

### Accessibility Props (Web)
- `alt` on all `<img>` tags.
- `aria-label` on icon-only buttons.
- `role="status"` on loading indicators.
- `aria-expanded` on dropdown triggers.

### Accessibility Props (Mobile)
- `accessibilityLabel` on all `Pressable` and icon elements.
- `accessibilityRole="button"` on custom pressable elements.
- `accessible={true}` on grouped information blocks.

---

## 10. Developer UI Guidelines

### Rules for All Developers

1. **Do not create duplicate components.** Check the component library before building anything new. Reuse existing Button, Input, Card, Badge, Modal, and Table components.

2. **Use design tokens.** Never hardcode hex values or pixel values directly in component styles. Reference the token names defined in Section 3.

3. **Dark theme is the default.** Do not create light-mode variants of authenticated views unless explicitly specified. Light theme applies only to public marketing pages.

4. **Maintain Web/Mobile visual parity.** If a component is built for web, its mobile equivalent must use the same colors, spacing ratios, and visual structure. Layout mechanism differs; appearance does not.

5. **Follow spacing rules.** Use the token scale (`space-xs` to `space-3xl`). Do not invent intermediate values unless unavoidable and documented.

6. **Status badges must use the 4-state system:** success (emerald), warning (amber), error (red), info (blue). Do not create new status colors without design approval.

7. **Typography is not negotiable.** Playfair Display for display headings, DM Sans for all UI text. Do not substitute system fonts in UI elements.

8. **Transitions on all interactive states.** Every hover, focus, and active state must have a CSS transition (`transition-all duration-150`). Static state changes feel broken.

9. **Loading and empty states are required.** Every data-fetching screen must implement both. Do not leave screens blank during load.

10. **Confirm before destroy.** Any delete, suspend, or irreversible operation must show a confirmation modal with clearly labeled destructive action button.

11. **Accessible labels on icon buttons.** Never ship an icon-only button without `aria-label` (web) or `accessibilityLabel` (mobile).

12. **Component file naming:** PascalCase for components (`UserDetailPanel.tsx`). One component per file. No barrel re-exports mixing components and utilities.

---

## 11. Future React Native Mapping

| Web Component / Pattern | React Native Equivalent |
|---|---|
| `<button>` | `<Pressable>` with `android_ripple` |
| `<input type="text">` | `<TextInput>` |
| `<input type="password">` | `<TextInput secureTextEntry>` |
| `<select>` | `<Picker>` (from `@react-native-picker/picker`) or custom bottom sheet picker |
| `<textarea>` | `<TextInput multiline numberOfLines={4}>` |
| `<form>` | `<View>` with manual field management + `KeyboardAvoidingView` |
| `<img>` | `<Image>` with `resizeMode="cover"` |
| `<table>` | `<FlatList>` with row `Pressable` items |
| `<ul> / <li>` | `<FlatList>` or `<ScrollView>` with mapped `<View>` items |
| Modal overlay (`fixed inset-0`) | `<Modal transparent visible animationType="fade">` |
| Bottom sheet / slide-up panel | `@gorhom/bottom-sheet` or `react-native-modal` |
| Left sidebar navigation | `@react-navigation/drawer` or `@react-navigation/bottom-tabs` |
| Top sticky navbar | Stack navigator header |
| Tabs (underline style) | `@react-navigation/top-tabs` or custom tab bar component |
| Dropdown menu (absolute popover) | `ActionSheetIOS` or `react-native-action-sheet` or custom modal |
| `backdrop-blur-sm` overlay | Semi-transparent `View` (no blur on Android without library) |
| Custom scrollbar | Not applicable — use native scroll indicators |
| `className="animate-spin"` | `Animated.loop(Animated.timing(...))` or `<ActivityIndicator>` |
| `className="animate-pulse"` | `Animated.loop` with opacity interpolation |
| `className="transition-all duration-150"` | `Animated.timing` with `duration: 150` |
| `hover:bg-white/5` | `onPressIn` state change in `Pressable` |
| `focus:ring-1 focus:ring-red-900/40` | `onFocus` border color change via state |
| `grid grid-cols-3` | `<FlatList numColumns={3}>` or `<View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>` |
| `flex gap-4` | `<View style={{ flexDirection: 'row', gap: 16 }}>` |
| Lucide icons | `react-native-svg` + Lucide SVG paths, or `@expo/vector-icons` |
| `Playfair Display` font | Embed via `expo-font` or `react-native-vector-icons` |
| `DM Sans` font | Embed via `expo-font` |
| `text-[13px] tracking-widest uppercase` | `{ fontSize: 13, letterSpacing: 2, textTransform: 'uppercase' }` |
| `rounded-xl` (12px) | `borderRadius: 12` |
| `shadow-lg shadow-black/20` | `elevation: 6` (Android) + `shadowColor/shadowOpacity/shadowRadius` (iOS) |
| `bg-emerald-500/15` | `rgba(34, 197, 94, 0.15)` |
| Progress bar (`w-[X%]` inside container) | `<View style={{ width: \`${pct}%\` }}>` inside fixed-width parent |
| `sticky top-0 z-50` | Stack navigator header (sticky by default) |
| `overflow-x-auto` horizontal scroll | `<ScrollView horizontal>` |
| File upload drop zone | `expo-document-picker` or `react-native-document-picker` |
| Google OAuth button | `@react-native-google-signin/google-signin` |
| Calendar widget | `react-native-calendars` |
| Bar chart (earnings) | `react-native-svg` + custom bars or `victory-native` |

---

*This document was generated from source code analysis of the Horsari web application. It serves as the single source of truth for UI/UX implementation across all platforms. Update this document whenever a new design pattern is introduced.*
