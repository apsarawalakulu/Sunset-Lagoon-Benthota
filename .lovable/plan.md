# Premium interaction enhancement plan

## What will change
- Add a cinematic hero carousel using the existing centralized images, with automatic progression, accessible controls, keyboard navigation, touch swiping, and reduced-motion support.
- Add restrained scroll reveal and parallax behavior to existing sections and large images without changing their content, colors, typography, or layout.
- Make the experience row swipeable on mobile while preserving the current desktop grid.
- Upgrade the existing gallery lightbox with touch swiping, focus containment, focus restoration, smoother transitions, and responsive controls while keeping lazy-loaded images.
- Refine existing navbar, mobile menu, links, cards, buttons, and arrow interactions with subtle motion and clear focus states.
- Keep testimonial and FAQ behavior unchanged because those sections do not currently exist.

## Technical details
- Use lightweight React hooks, CSS transforms, IntersectionObserver, pointer events, and requestAnimationFrame; no new animation dependency is required.
- Reuse the current image configuration and data files so no image URL is embedded in presentation code.
- Disable autoplay, parallax, and nonessential motion when `prefers-reduced-motion` is enabled.
- Verify desktop, tablet, and mobile rendering, keyboard controls, swipe gestures, console health, and horizontal overflow.
