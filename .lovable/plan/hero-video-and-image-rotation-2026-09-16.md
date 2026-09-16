# Hero video and image rotation

## What will change
- Remove the three current hero slideshow images.
- Use the supplied boat safari video followed by the three supplied Bentota River photos.
- Keep the hero text, buttons, size, spacing, and overall styling unchanged.
- Autoplay the video silently in the background, then continue through the photos with the existing smooth crossfade.
- Keep the rotation automatic with no arrows, indicators, or controls.
- Preserve mobile behavior, accessibility, and reduced-motion support.

## Technical details
- Store the new media URLs and metadata in the centralized site configuration.
- Render video and image slides with the same layered background treatment.
- Advance when the video finishes; use the existing 2.5-second timing for each photo.
- Use a browser-friendly Cloudinary MP4 delivery URL derived from the supplied MOV asset.
- Verify desktop and mobile playback, transitions, overflow, and preview errors.
