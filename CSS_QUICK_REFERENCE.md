# WinGuard CSS Quick Reference Guide

## 🎨 Button Classes

### Primary Buttons (Cyan-Green)
```html
<button className="btn-primary">Primary Action</button>
<button className="btn-outline-primary">Outline Primary</button>
```

### Secondary Buttons (Orange)
```html
<button className="btn-secondary">Secondary Action</button>
<button className="btn-outline-secondary">Outline Secondary</button>
```

### Status Buttons
```html
<button className="btn-success">Success</button>
<button className="btn-danger">Danger</button>
```

## 🏷️ Badge Classes

```html
<span className="badge-cyan">Cyan Badge</span>
<span className="badge-orange">Orange Badge</span>
<span className="badge-success">Success</span>
<span className="badge-error">Error</span>
```

## 📦 Card Classes

### Standard Cards
```html
<div className="card">Standard Card</div>
<div className="card card-hover">Hoverable Card</div>
```

### Gradient Cards
```html
<div className="card-gradient-cyan">Cyan Gradient Card</div>
<div className="card-gradient-orange">Orange Gradient Card</div>
```

## 🎯 Icon Containers

```html
<div className="icon-container-cyan">
  <svg>...</svg>
</div>

<div className="icon-container-orange">
  <svg>...</svg>
</div>
```

## 📝 Input Fields

```html
<input className="input" type="text" placeholder="Enter text" />
<input className="input input-error" type="text" /> <!-- Error state -->
```

## ✨ Animations

### Entrance Animations
```html
<div className="fade-in">Fades in</div>
<div className="slide-in-right">Slides from right</div>
<div className="slide-in-left">Slides from left</div>
<div className="scale-in">Scales in</div>
```

### Continuous Animations
```html
<div className="pulse">Pulsing element</div>
<div className="bounce">Bouncing element</div>
<div className="float">Floating element</div>
<div className="spinner">Loading spinner</div>
```

### List Animations
```html
<div className="stagger-item">Item 1</div>
<div className="stagger-item">Item 2</div>
<div className="stagger-item">Item 3</div>
<!-- Each item animates with 0.05s delay -->
```

## 🎭 Effects

### Glass Morphism
```html
<div className="glass">Frosted glass effect</div>
<div className="glass-dark">Dark glass effect</div>
```

### Gradient Text
```html
<h1 className="text-gradient-cyan">Cyan Gradient Text</h1>
<h1 className="text-gradient-orange">Orange Gradient Text</h1>
```

### Shadows
```html
<div className="shadow-cyan">Cyan shadow</div>
<div className="shadow-orange">Orange shadow</div>
<div className="hover-glow-cyan">Glows cyan on hover</div>
```

### Hover Effects
```html
<div className="hover-lift">Lifts on hover</div>
<div className="card-hover">Professional card hover</div>
```

## 📱 Mobile Utilities

### Safe Areas
```html
<div className="safe-top">Respects notch</div>
<div className="safe-bottom">Respects home indicator</div>
```

### Touch Optimization
```html
<button className="touch-button">48x48px minimum</button>
<div className="no-select">No text selection</div>
<div className="smooth-scroll">Smooth scrolling</div>
```

## 🎨 Color Utilities

### Background Colors
```html
<div className="bg-cyan-50">Lightest cyan</div>
<div className="bg-cyan-600">Main cyan</div>
<div className="bg-orange-500">Main orange</div>
```

### Text Colors
```html
<p className="text-cyan-700">Cyan text</p>
<p className="text-orange-600">Orange text</p>
<p className="text-gray-900">High contrast text</p>
```

### Border Colors
```html
<div className="border-2 border-cyan-600">Cyan border</div>
<div className="border-2 border-orange-500">Orange border</div>
```

## 📐 Spacing

### Padding
```html
<div className="p-4">16px all sides</div>
<div className="px-6">24px horizontal</div>
<div className="py-3">12px vertical</div>
```

### Margin
```html
<div className="m-4">16px all sides</div>
<div className="mx-auto">Center horizontally</div>
<div className="my-6">24px vertical</div>
```

## 🔤 Typography

### Font Families
```html
<h1 className="font-display">Clarendon heading</h1>
<p className="font-sans">Inter body text</p>
```

### Font Weights
```html
<p className="font-bold">Bold (700)</p>
<p className="font-semibold">Semibold (600)</p>
<p className="font-medium">Medium (500)</p>
```

### Font Sizes
```html
<p className="text-xs">12px</p>
<p className="text-sm">14px</p>
<p className="text-base">16px</p>
<p className="text-lg">18px</p>
<p className="text-xl">20px</p>
<p className="text-2xl">24px</p>
<p className="text-3xl">30px</p>
<p className="text-4xl">36px</p>
```

## 🎯 Common Patterns

### Professional Button
```html
<button className="btn-primary hover-lift">
  <svg className="w-5 h-5 mr-2">...</svg>
  Click Me
</button>
```

### Stat Card
```html
<div className="card card-hover">
  <div className="icon-container-cyan mb-4">
    <svg>...</svg>
  </div>
  <h3 className="text-2xl font-bold text-gray-900">1,234</h3>
  <p className="text-sm text-gray-600">Total Reports</p>
</div>
```

### Alert Box
```html
<div className="card-gradient-cyan fade-in">
  <div className="flex items-start gap-3">
    <div className="icon-container-cyan">
      <svg>...</svg>
    </div>
    <div>
      <h4 className="font-bold text-gray-900">Success!</h4>
      <p className="text-sm text-gray-700">Your action was completed.</p>
    </div>
  </div>
</div>
```

### Loading State
```html
<div className="flex items-center justify-center">
  <div className="spinner w-8 h-8 border-4 border-cyan-600 border-t-transparent rounded-full"></div>
  <span className="ml-3 text-gray-700 font-semibold">Loading...</span>
</div>
```

### Badge with Icon
```html
<span className="badge-cyan">
  <svg className="w-4 h-4 mr-1">...</svg>
  Active
</span>
```

### Gradient Header
```html
<h1 className="text-4xl font-display font-bold">
  <span className="text-gradient-cyan">Win</span>
  <span className="text-gradient-orange">Guard</span>
</h1>
```

## 🎬 Animation Combinations

### Fade + Lift
```html
<div className="fade-in hover-lift card">
  Animated card
</div>
```

### Stagger + Scale
```html
<div className="stagger-item scale-in">
  List item with multiple animations
</div>
```

### Pulse + Glow
```html
<button className="btn-primary pulse hover-glow-cyan">
  Attention-grabbing button
</button>
```

## 📱 Responsive Classes

### Display
```html
<div className="hidden md:block">Desktop only</div>
<div className="block md:hidden">Mobile only</div>
```

### Grid
```html
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
  <!-- Responsive grid -->
</div>
```

### Flex
```html
<div className="flex flex-col md:flex-row gap-4">
  <!-- Responsive flex direction -->
</div>
```

## 🎨 Color Palette Reference

### Cyan (Primary)
- `cyan-50` to `cyan-900` (lightest to darkest)
- Main: `cyan-600` (#0891b2)

### Teal (Primary Complement)
- `teal-50` to `teal-900`
- Main: `teal-600` (#0d9488)

### Orange (Secondary)
- `orange-50` to `orange-900`
- Main: `orange-500` (#f97316)

### Gray (Neutral)
- `gray-50` to `gray-900`
- Text: `gray-900` (#111827)

---

**Pro Tip:** Combine utility classes for powerful effects!

```html
<button className="btn-primary hover-lift shadow-cyan transform transition-smooth">
  Professional Button
</button>
```
