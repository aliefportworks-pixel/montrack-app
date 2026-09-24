```markdown
---
design_system:
  colors:
    background: "#000000"
    surface: "#1C1C1E"
    surface_variant: "#2C2C2E"
    primary: "#FFFFFF"
    secondary: "#8E8E93"
    accent_gradient: "linear-gradient(135deg, #A588F8 0%, #F6A085 50%, #60C3FF 100%)"
    chart_active: "#98A2F3"
    border: "#38383A"
  typography:
    font_family: "Inter, system-ui, sans-serif"
    scales:
      h1: { size: "32px", weight: "700", letter_spacing: "-0.02em" }
      h2: { size: "20px", weight: "600", letter_spacing: "-0.01em" }
      body_bold: { size: "16px", weight: "600" }
      body: { size: "16px", weight: "400" }
      caption: { size: "13px", weight: "400", color: "#8E8E93" }
      small: { size: "11px", weight: "500" }
  spacing:
    container_padding: "20px"
    element_gap: "12px"
    section_gap: "24px"
    stack_gap: "8px"
  radius:
    full: "9999px"
    xl: "28px"
    lg: "20px"
    md: "16px"
    sm: "12px"
  shadows:
    soft_glow: "0 8px 32px rgba(152, 162, 243, 0.15)"
---

## 🔬 Design Audit
- **Style**: Modern Dark Neomorphism / Glassmorphism hybrid.
- **Mood**: Premium, High-tech, Minimalist, Financial.
- **Screen Type**: Mobile Application (iOS Native feel).
- **Visual Hierarchy**: Uses high-contrast white elements against pure black backgrounds to guide the eye to primary actions and balances.

## 🎨 Color Palette & Design Tokens
- **Primary Background**: `#000000` (Pure Black) - used for the main canvas.
- **Surface/Cards**: `#1C1C1E` - used for secondary containers and list items.
- **Primary Text**: `#FFFFFF` - used for headings, balances, and active states.
- **Secondary Text**: `#8E8E93` - used for labels, timestamps, and inactive categories.
- **Action/Highlight**: `#FFFFFF` (Solid) - used for "Top Up" and "Confirm" buttons.
- **Visual Accent**: Multi-color mesh gradient (Purple, Peach, Cyan) used as card backgrounds to denote "Main Card" or "Active Transaction".

## 🧩 Components Detected
1.  **Status Bar**: Standard iOS system icons (Time, Signal, WiFi, Battery).
2.  **Profile Header**: Circular avatar with dual-line text (Greeting + Name) and a stroked notification bell icon.
3.  **Glassmorphic Credit Card**: Large container with mesh gradient, masked card number, dropdown selector, and balance display.
4.  **Quick Action Buttons**: 
    - Dark variant: Icon + Label (Send, Receive).
    - Light variant: Icon + Label (Top Up) - High emphasis.
5.  **Section Header**: Text label with "View all" text button.
6.  **Transaction List Item**: Leading icon (brand logo), Title, Subtitle (category), and trailing Amount.
7.  **Bottom Navigation Bar**: Floating-style pill container with 4 icon-only slots (Home, Wallet, Analytics, Settings).
8.  **Segmented Control**: Pill-shaped toggle with high-contrast active state (Expenses/Income).
9.  **Bar Chart**: Vertical bars with rounded caps; active state uses a gradient fill and a floating tooltip.
10. **Category Grid**: 2-column layout of cards containing Category Name and Amount.
11. **Input Fields**: Large rounded containers with labels and trailing icons (Dropdown arrows, Calendar, Pencil).
12. **Action Bar (Footer)**: Three-button layout (Cancel, Attachment, Confirm).

## ⚛️ Atomic Design Specification

### Atoms
- **Icons**: Thin-stroke (approx 1.5px) line icons.
- **Buttons (Base)**: Rounded rectangles with `radius-md`.
- **Typography**: Sans-serif, variable weights.
- **Badges**: Small circular brand logos (Netflix, Starbucks).

### Molecules
- **Balance Display**: Large H1 text with currency symbol.
- **Dropdown Trigger**: Text + Chevron icon.
- **List Row**: Avatar + Text Stack + Value.
- **Chart Bar**: Rectangular bar with `radius-sm` at the top.
- **Tooltip**: Dark pill with small white text.

### Organisms
- **Main Card Component**: Gradient background, balance, card info, and visibility toggle.
- **Analytics Dashboard**: Segmented control + Bar chart + Category grid.
- **Transaction Form**: Amount header + Category selector + Date picker + Description field.
- **Navigation Dock**: Fixed bottom container with active state indicator.

## 📐 Layout & Viewport Composition
- **Grid**: Single column with internal 2-column grids for category cards.
- **Margins**: 20px horizontal safe-area padding.
- **Vertical Rhythm**: 
    - Header to Card: 24px.
    - Card to Quick Actions: 16px.
    - Section to Section: 32px.
- **Aspect Ratios**: 
    - Main Card: ~1.6:1.
    - Category Cards: ~1.2:1.
- **Alignment**: Left-aligned text for data; center-aligned for primary navigation and headers.
```