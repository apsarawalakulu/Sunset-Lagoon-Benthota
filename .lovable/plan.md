# Hero slideshow and gallery image update

## What will change
- Keep the existing hero design, text, buttons, size, spacing, and styling unchanged.
- Replace the single hero background with an automatic three-image crossfade using the supplied Cloudinary images, changing every 2.5 seconds.
- Keep all hero copy fixed and add no arrows, indicators, or controls.
- Add the eight supplied Cloudinary images to the existing gallery and lightbox.
- Centralize every supplied image in the existing image configuration, including accessible descriptions and dimensions.
- Reuse the supplied images where matching hero/gallery imagery is already displayed elsewhere, without redesigning any section.

## Technical details
- Use a lightweight React timer and layered images for a smooth opacity crossfade.
- Pause unnecessary transitions when reduced motion is requested, while still rotating images without animation.
- Preserve lazy loading for gallery images and verify desktop/mobile layout, horizontal overflow, and the lightbox.
