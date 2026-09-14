# Sunset Lagoon Boat House Website

## Goal
Build a complete, responsive one-page tourism website for **Sunset Lagoon Boat House** in Bentota, Sri Lanka. The experience will feel editorial, tropical, calm, and premium, with photography-led storytelling and clear booking actions.

## What I’ll build
- Sticky transparent navigation that transitions on scroll, plus an animated mobile menu.
- Full-screen cinematic river hero with restrained motion and booking/exploration actions.
- Introduction, three data-driven experiences, immersive story, four trust points, wildlife editorial, accessible gallery lightbox, about, location placeholder, booking call-to-action, contact, and footer.
- Central configuration for every image, business detail, social link, WhatsApp destination, and location value.
- A future-ready API service layer using `VITE_API_BASE_URL`, while keeping all current content local and functional.
- Per-page SEO metadata, semantic structure, alt text, visible focus states, reduced-motion support, and lazy-loaded supporting images.

## Visual direction
- Deep forest and charcoal greens, warm sand, muted foliage, soft off-white, and a restrained sunset accent.
- Elegant editorial serif headings paired with a refined sans-serif interface font.
- Asymmetric image compositions, fine rules, subtle shadows, modest corner radii, and generous spacing.
- A cohesive set of generated Bentota river, mangrove, boat, and nature imagery stored locally and referenced only through the central image configuration.

## Technical details
- Keep the existing React, Vite, TanStack Start, and Tailwind v4 foundation.
- Use reusable TypeScript components and separated data modules.
- Use lightweight CSS/React animation rather than adding unnecessary dependencies.
- Keep navigation within the single long-form landing page using section anchors, as explicitly requested.
- The map remains a clearly labelled placeholder until a real address or coordinates are supplied.
- Missing phone, WhatsApp, email, opening hours, and social destinations remain visibly marked as pending rather than invented.

## Validation
- Check desktop, tablet, and mobile widths including 1440, 1024, 768, 390, and 375 pixels.
- Verify mobile navigation, all anchors/actions, keyboard lightbox controls, image alt text, overflow, browser console, and current build status.
