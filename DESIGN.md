---
name: Precision Industrial Light
colors:
  surface: '#faf8ff'
  surface-dim: '#d2d9f4'
  surface-bright: '#faf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f3ff'
  surface-container: '#eaedff'
  surface-container-high: '#e2e7ff'
  surface-container-highest: '#dae2fd'
  on-surface: '#131b2e'
  on-surface-variant: '#434655'
  inverse-surface: '#283044'
  inverse-on-surface: '#eef0ff'
  outline: '#737686'
  outline-variant: '#c3c6d7'
  surface-tint: '#0053db'
  primary: '#004ac6'
  on-primary: '#ffffff'
  primary-container: '#2563eb'
  on-primary-container: '#eeefff'
  inverse-primary: '#b4c5ff'
  secondary: '#505f76'
  on-secondary: '#ffffff'
  secondary-container: '#d0e1fb'
  on-secondary-container: '#54647a'
  tertiary: '#005a82'
  on-tertiary: '#ffffff'
  tertiary-container: '#0074a6'
  on-tertiary-container: '#e4f2ff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dbe1ff'
  primary-fixed-dim: '#b4c5ff'
  on-primary-fixed: '#00174b'
  on-primary-fixed-variant: '#003ea8'
  secondary-fixed: '#d3e4fe'
  secondary-fixed-dim: '#b7c8e1'
  on-secondary-fixed: '#0b1c30'
  on-secondary-fixed-variant: '#38485d'
  tertiary-fixed: '#c9e6ff'
  tertiary-fixed-dim: '#89ceff'
  on-tertiary-fixed: '#001e2f'
  on-tertiary-fixed-variant: '#004c6e'
  background: '#faf8ff'
  on-background: '#131b2e'
  surface-variant: '#dae2fd'
typography:
  headline-lg:
    fontFamily: Inter
    fontSize: 30px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.02em
  mono-data:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 18px
    letterSpacing: '0'
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 4px
  gutter: 16px
  margin-mobile: 16px
  margin-desktop: 24px
  container-padding: 12px
---

## Brand & Style

This design system is engineered for high-density industrial environments where clarity, speed of data ingestion, and technical accuracy are paramount. The aesthetic is rooted in **Modern Corporate** principles with a leaning toward **Technical Minimalism**. 

The light variant prioritizes high-contrast legibility to reduce eye strain in well-lit control rooms or office environments. It evokes a sense of organized efficiency and professional reliability. The interface uses a systematic approach to hierarchy, utilizing subtle tonal shifts rather than aggressive shadows to define functional zones.

## Colors

The palette is anchored by a high-contrast foundation to ensure technical data remains the focal point.

- **Surface & Backgrounds**: The base is a crisp `#F8FAFC`, providing a neutral stage that minimizes glare.
- **Primary Technical Blue**: `#2563EB` is used for primary actions and active states, calibrated for AA accessibility on light surfaces.
- **Hierarchy & Containers**: Secondary containers use `#F1F5F9` to group related information without creating heavy visual silos. Borders utilize `#E2E8F0` for precise structural definition.
- **Typography**: All primary text is set in Deep Slate `#0F172A` to maximize the contrast ratio against the light background.
- **Status Indicators**: 
    - **Success**: Forest Green (Saturated for light background)
    - **Warning**: Amber (High visibility)
    - **Critical**: Crimson (Urgent contrast)

## Typography

The design system utilizes **Inter** exclusively to maintain a utilitarian, highly legible character. 

For industrial data density, the system relies on tight line-heights and slightly decreased letter spacing on headlines to keep information compact. A specialized `mono-data` style is suggested for tabular data and serial numbers to ensure character alignment and rapid scanning. Use Semi-Bold (600) for headers to provide clear structural anchoring against the high-contrast background.

## Layout & Spacing

This design system follows a **4px base grid** to accommodate high-density information displays common in industrial dashboards.

- **Grid Model**: A 12-column fluid grid for desktop, collapsing to 4 columns on mobile.
- **Density**: Use compact spacing for data-heavy views. Content-heavy containers should maintain a standard `12px` or `16px` internal padding to prevent visual clutter.
- **Breakpoints**: 
    - Mobile: < 640px
    - Tablet: 640px - 1024px
    - Desktop: > 1024px
- **Alignment**: Hard-left alignment for all data points to facilitate vertical scanning.

## Elevation & Depth

The light theme moves away from heavy shadows, instead using **Tonal Layering** and **Low-Contrast Outlines**.

- **Level 0 (Base)**: `#F8FAFC` - The main application background.
- **Level 1 (Cards/Panels)**: White background with a `1px` solid border of `#E2E8F0`. No shadow.
- **Level 2 (Popovers/Modals)**: White background with a very soft, high-diffusion shadow (`0 10px 15px -3px rgba(0,0,0,0.05)`) and a `#CBD5E1` border to separate it from the base layers.
- **Active States**: Subtle inset shadows or primary color borders (`2px`) are used to indicate focus and selection.

## Shapes

To maintain a "Professional/Industrial" feel, the design system utilizes **Soft (0.25rem)** roundedness. This prevents the UI from feeling overly "consumer-focused" or "playful," maintaining a rigid, tool-like appearance while softening just enough to avoid the harshness of pure right angles.

- **Standard Buttons/Inputs**: 4px (0.25rem)
- **Large Cards/Containers**: 8px (0.5rem)
- **Status Badges**: 4px (0.25rem) or fully pill-shaped for distinction.

## Components

- **Buttons**:
    - **Primary**: Solid `#2563EB` with White text. 4px radius.
    - **Secondary**: `#F1F5F9` fill with `#0F172A` text and `#E2E8F0` border.
- **Technical Badges**: Used for statuses like "In Stock." These should use a subtle background tint (e.g., 10% opacity of the status color) with high-contrast text of the same hue for maximum clarity without visual "noise."
- **Input Fields**: White background with a `#E2E8F0` border. On focus, the border shifts to Primary Blue with a `2px` outer ring.
- **Data Tables**: Use alternating row stripes (`#F8FAFC` and `#F1F5F9`). Use `mono-data` typography for numerical columns.
- **Cards**: Minimalist containers with a `1px` border. Headers within cards should have a subtle background fill of `#F1F5F9` to separate metadata from the content body.
- **Checkboxes/Radios**: Square (rounded-sm) for checkboxes and circular for radios, utilizing the Primary Blue for active states.