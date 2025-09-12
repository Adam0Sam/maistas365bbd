# Maistas365 Design System

> **A comprehensive design system for an AI-powered meal prep startup that helps users create meal preparations from actual products.**

## 🎨 Brand Identity

### Mission
Empowering users to create intelligent, personalized meal prep solutions using real products and AI-driven recommendations.

### Visual Principles
- **Innovative**: Cutting-edge AI technology with modern gradients and dynamic effects
- **Welcoming**: Warm, approachable colors that make nutrition accessible
- **Trustworthy**: Professional aesthetics that inspire confidence in our recommendations
- **Dynamic**: Fluid animations that reflect the adaptive nature of AI

---

## 🌈 Color Palette

### Primary Colors
Our primary palette features natural, calming greens and blues that inspire trust and wellness:

```css
/* Primary Shamrock Green - Main brand color */
primary-500: #4c9f70  /* Health, growth, nutrition */
primary-400: #5db382  /* Lighter interactions */
primary-600: #3d8059  /* Hover states, depth */

/* Secondary Vista Blue - Calm, trust */
secondary-500: #8ea4d2  /* Serenity, reliability */
secondary-400: #a4b8dc  /* Lighter elements */
secondary-600: #7490c8  /* Hover states */

/* Accent Glaucous Blue - Professional, premium */
accent-500: #6279b8    /* Premium features, depth */
accent-400: #7a8dc7    /* Lighter accents */
accent-600: #5469a4    /* Active states */
```

### Supporting Colors
```css
/* Hookers Green - Deep, earthy foundation */
foundation-500: #496f5d  /* Deep backgrounds, foundations */
foundation-400: #5a8271  /* Lighter foundation elements */
foundation-600: #3b5a4a  /* Darker foundation states */

/* Yinmn Blue - Professional depth */
depth-500: #49516f     /* Text, professional elements */
depth-400: #5d6585     /* Lighter depth elements */
depth-600: #3d4459     /* Darker text, borders */

/* Success - Inherited from primary green tones */
success-500: #4c9f70   /* Achievement, healthy choices */

/* Warning - Warm amber for alerts */
warning-500: #f59e0b   /* Moderate attention needed */

/* Error - Soft red for issues */
error-500: #ef4444     /* Errors, dietary restrictions */

/* Neutrals - Balanced grays */
neutral-50: #f8fafc    /* Background light */
neutral-100: #f1f5f9   /* Card backgrounds */
neutral-500: #64748b   /* Text secondary */
neutral-900: #0f172a   /* Text primary */
```

---

## 🎭 Gradients

### Signature Gradients
Use these gradients to create visual interest and reinforce brand identity:

```css
/* Hero/Primary Gradient - Natural progression */
bg-gradient-hero: linear-gradient(135deg, #8ea4d2 0%, #6279b8 25%, #49516f 50%, #496f5d 75%, #4c9f70 100%)

/* Primary Gradient - Green focus */
bg-gradient-primary: linear-gradient(135deg, #4c9f70 0%, #496f5d 100%)

/* Secondary Gradient - Blue calming */
bg-gradient-secondary: linear-gradient(135deg, #8ea4d2 0%, #6279b8 100%)

/* Accent Gradient - Professional depth */
bg-gradient-accent: linear-gradient(135deg, #6279b8 0%, #49516f 100%)

/* Success Gradient - Health achievements */
bg-gradient-success: linear-gradient(135deg, #4c9f70 0%, #8ea4d2 100%)

/* Mesh Gradient - Complex backgrounds */
bg-gradient-mesh: radial-gradient(circle at 20% 80%, #4c9f70 0%, transparent 50%), radial-gradient(circle at 80% 20%, #8ea4d2 0%, transparent 50%), radial-gradient(circle at 40% 40%, #6279b8 0%, transparent 50%)
```

### Gradient Usage Guidelines
- **Hero sections**: Use `bg-gradient-hero` for maximum impact
- **Cards/Components**: Use `bg-gradient-card` for subtle depth
- **Buttons**: Primary gradients for CTAs, success gradients for confirmations
- **Backgrounds**: Mesh gradients for landing pages and feature showcases

---

## 🎬 Animation System

### Animation Principles
1. **Purposeful**: Every animation serves a functional purpose
2. **Smooth**: 60fps fluid motion using Framer Motion
3. **Contextual**: Animations reflect content (food prep = smooth transitions)
4. **Accessible**: Respect prefers-reduced-motion settings

### Core Animations

#### Entry Animations
```jsx
// Fade in with slight movement
const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: "easeOut" }
}

// Scale in for important elements
const scaleIn = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1 },
  transition: { duration: 0.3, ease: "easeOut" }
}

// Stagger children for lists
const stagger = {
  animate: { transition: { staggerChildren: 0.1 } }
}
```

#### Interactive Animations
```jsx
// Button hover states
const buttonHover = {
  whileHover: { scale: 1.02, transition: { duration: 0.2 } },
  whileTap: { scale: 0.98 }
}

// Card interactions
const cardHover = {
  whileHover: { 
    y: -5, 
    boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
    transition: { duration: 0.3 }
  }
}
```

#### Continuous Animations
```css
/* Gentle floating for hero elements */
@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
}

/* Glow pulse for AI indicators */
@keyframes pulseGlow {
  0% { box-shadow: 0 0 5px rgba(14, 165, 233, 0.5); }
  100% { box-shadow: 0 0 20px rgba(14, 165, 233, 0.8); }
}
```

---

## 🧩 Component Architecture

### Layout Components

#### Container
```jsx
// Standard content container
<div className="container mx-auto px-4 max-w-7xl">
  {/* Content */}
</div>

// Section spacing
<section className="py-16 lg:py-24">
  {/* Section content */}
</section>
```

#### Grid System
```jsx
// Responsive grid for meal cards
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {/* Cards */}
</div>

// Hero grid layout
<div className="grid lg:grid-cols-2 gap-12 items-center">
  {/* Hero content */}
</div>
```

### UI Components

#### Buttons
```jsx
// Primary CTA button
<button className="bg-gradient-primary text-white px-6 py-3 rounded-xl font-semibold transition-all hover:shadow-glow">
  Get Started
</button>

// Secondary button
<button className="bg-white text-primary-600 border border-primary-200 px-6 py-3 rounded-xl font-semibold hover:bg-primary-50">
  Learn More
</button>

// AI Feature button
<button className="bg-gradient-purple text-white px-4 py-2 rounded-lg flex items-center gap-2">
  <AiIcon /> AI Suggest
</button>
```

#### Cards
```jsx
// Meal prep card
<div className="bg-white rounded-2xl shadow-card hover:shadow-card-hover transition-all p-6">
  <div className="aspect-video bg-gradient-warm rounded-xl mb-4"></div>
  <h3 className="text-xl font-semibold text-neutral-900 mb-2">Meal Title</h3>
  <p className="text-neutral-600 mb-4">Description...</p>
  <div className="flex justify-between items-center">
    <span className="text-success-600 font-semibold">Ready in 25min</span>
    <button className="bg-primary-500 text-white px-4 py-2 rounded-lg">
      Add to Plan
    </button>
  </div>
</div>

// Feature highlight card
<div className="bg-gradient-card backdrop-blur-sm rounded-2xl p-6 border border-white/20">
  <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center mb-4">
    <Icon className="text-white" />
  </div>
  <h3 className="text-xl font-semibold mb-2">Feature Title</h3>
  <p className="text-neutral-600">Feature description...</p>
</div>
```

#### Navigation
```jsx
// Main navigation
<nav className="bg-white/80 backdrop-blur-md border-b border-neutral-200">
  <div className="container mx-auto px-4">
    <div className="flex justify-between items-center py-4">
      <Logo className="h-8" />
      <div className="hidden md:flex space-x-8">
        <NavLink href="/features">Features</NavLink>
        <NavLink href="/pricing">Pricing</NavLink>
      </div>
      <button className="bg-gradient-primary text-white px-4 py-2 rounded-lg">
        Sign Up
      </button>
    </div>
  </div>
</nav>
```

---

## 📱 Responsive Design

### Breakpoints
```css
/* Mobile First Approach */
sm: 640px   /* Mobile landscape, small tablets */
md: 768px   /* Tablets */
lg: 1024px  /* Small desktops */
xl: 1280px  /* Large desktops */
2xl: 1536px /* Extra large screens */
```

### Mobile-First Guidelines
1. **Touch targets**: Minimum 44px for interactive elements
2. **Typography**: Scale from 16px base, use clamp() for fluid sizing
3. **Images**: Always provide responsive images with proper aspect ratios
4. **Navigation**: Collapse to hamburger menu on mobile
5. **Cards**: Single column on mobile, progressively more columns on larger screens

---

## ✨ Special Effects

### Glassmorphism Elements
```css
/* Glass card effect */
.glass-card {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 1rem;
}

/* Glass navigation */
.glass-nav {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}
```

### Glow Effects
```css
/* AI feature glow */
.ai-glow {
  box-shadow: 0 0 20px rgba(168, 85, 247, 0.3);
}

/* Success state glow */
.success-glow {
  box-shadow: 0 0 20px rgba(34, 197, 94, 0.3);
}

/* Interactive glow on hover */
.hover-glow:hover {
  box-shadow: 0 0 25px rgba(14, 165, 233, 0.4);
}
```

---

## 🔤 Typography

### Font Stack
- **Primary**: Geist Sans (Modern, clean, tech-forward)
- **Monospace**: Geist Mono (Code, data displays)
- **Fallback**: System fonts for optimal loading

### Type Scale
```css
/* Headings */
.text-6xl  /* 60px - Hero headlines */
.text-5xl  /* 48px - Page titles */
.text-4xl  /* 36px - Section headers */
.text-3xl  /* 30px - Card titles */
.text-2xl  /* 24px - Subsections */
.text-xl   /* 20px - Large body */

/* Body text */
.text-lg   /* 18px - Prominent body */
.text-base /* 16px - Standard body */
.text-sm   /* 14px - Captions, metadata */
.text-xs   /* 12px - Fine print */
```

### Typography Usage
- **Headlines**: Bold weights (700-800) with tight line height
- **Body text**: Regular weight (400) with comfortable line height (1.6)
- **UI text**: Medium weight (500) for better visibility
- **Accent text**: Use gradient text for special elements

---

## 🎯 Usage Guidelines for AI Agents

### When to Use Each Color
- **Primary Blue**: Technology features, trust elements, primary actions
- **Secondary Orange**: Food content, nutrition info, energy/motivation
- **Accent Purple**: AI features, premium content, innovation highlights
- **Success Green**: Achievements, health goals, positive feedback
- **Gradients**: Hero sections, premium features, visual interest

### Animation Implementation
1. **Always** use Framer Motion for React animations
2. **Respect** user preferences for reduced motion
3. **Performance**: Use transform properties for smooth 60fps animations
4. **Purposeful**: Every animation should enhance user understanding

### Component Composition
1. **Consistency**: Use established patterns from this system
2. **Accessibility**: Include proper ARIA labels and focus management
3. **Performance**: Lazy load images and heavy components
4. **Mobile-first**: Design for smallest screen, enhance for larger

### Code Examples
Reference the Tailwind classes and Framer Motion patterns throughout this document. When in doubt:
- Use semantic color names (primary, secondary, accent)
- Apply consistent spacing (4, 6, 8, 12, 16, 24)
- Follow the established animation patterns
- Maintain the glassmorphism and gradient aesthetics

---

## 🚀 Implementation Checklist

### For AI Agents Building Components
- [ ] Apply appropriate color scheme based on content type
- [ ] Include hover/focus states for interactive elements
- [ ] Add smooth transitions and micro-animations
- [ ] Ensure mobile responsiveness
- [ ] Use semantic HTML structure
- [ ] Include proper accessibility attributes
- [ ] Optimize images and use proper aspect ratios
- [ ] Test with reduced motion preferences
- [ ] Follow established spacing and typography scales
- [ ] Apply consistent shadow and border radius values

This design system ensures consistency across all AI-generated components while maintaining the innovative, welcoming, and trustworthy brand identity of Maistas365.