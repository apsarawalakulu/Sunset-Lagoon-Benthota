# Loyala River Journeys

Build a premium, modern, unique tourism website for a Sri Lankan boat safari business called:

Bentota Boat Safari Loyala

The website should feel like a real professional tourism brand, not a generic template. The main experience should communicate the beauty of the Bentota River, mangroves, wildlife, nature, adventure, and peaceful boat journeys.

IMPORTANT:

Build the frontend using React + Vite.

Use Tailwind CSS for styling.

Keep the project structure clean and scalable.

The backend will later be developed using Laravel API + MySQL.

Do NOT build the Laravel backend or database yet.

Prepare the frontend architecture so Laravel REST APIs can easily replace the temporary/mock data later.

Images will eventually come from Cloudinary.

For now, create a clean image configuration/data structure where Cloudinary URLs can easily be inserted later.

Do not permanently hard-code image URLs throughout components.

Make the entire website responsive for desktop, tablet, and mobile.

BRAND STYLE

Brand:
Bentota Boat Safari Loyala

Location:
Bentota, Sri Lanka

Overall visual direction:

Premium tropical

Elegant

Natural

Modern

Calm but adventurous

Authentic Sri Lankan tourism feeling

High-end travel website quality

Strong visual storytelling

Avoid:

Generic travel-template appearance

Neon colors

Too many colors

Excessive gradients

Cartoon-like graphics

Overly rounded UI everywhere

Huge amounts of text

Cheap-looking buttons

Excessive glassmorphism

Cluttered layouts

Use a sophisticated natural color palette:

Deep forest green

Dark charcoal/green

Warm sand/beige

Soft off-white

Natural muted green

Small amounts of warm accent color

Typography:
Use a premium modern sans-serif for the main UI and optionally a tasteful elegant serif for large editorial headings.

The typography should feel similar to a luxury eco-tourism brand.

NAVIGATION

Create a sticky transparent navigation over the hero section that becomes a solid/light navigation when scrolling.

Navigation:

Logo:
Loyala
Small supporting text:
Bentota Boat Safari

Menu:

Home

Experience

About

Gallery

Wildlife

Location

Contact

Right side:
Book a Safari primary CTA

On mobile:

Hamburger menu

Smooth animated mobile navigation

Book button remains easily accessible

The navigation should have a subtle scroll transition.

HOME PAGE

Create a visually impressive landing page.

HERO SECTION

Use a large full-screen cinematic hero image.

The hero should visually communicate:

Bentota River

Boat safari

Tropical greenery

Water

Nature

Adventure

Use a dark subtle overlay so text remains readable.

Hero content:

Small label:
BENTOTA • SRI LANKA

Main heading:

Discover the Hidden Beauty of Bentota

Supporting text:

Cruise through tranquil waters, mangrove forests and the wild beauty of Bentota with Loyala Boat Safari.

Primary CTA:
Explore the Safari

Secondary CTA:
View Experiences

Add a subtle scroll indicator at the bottom.

Hero animations should be elegant and slow:

Fade-in text

Slight image movement/parallax

Smooth button animations

Do not over-animate.

INTRODUCTION SECTION

Create a premium split-layout section.

Left:
Large safari image.

Right:
Small eyebrow:
THE LOYALA EXPERIENCE

Heading:
Where the River Becomes Your Adventure

Paragraph:
Introduce Loyala as a local Bentota boat safari experience focused on exploring the river, mangroves, wildlife and peaceful natural surroundings.

Add a simple link/button:
Discover Our Story →

Use lots of whitespace.

EXPERIENCE SECTION

Create a section titled:

Choose Your Experience

Create 3 premium experience cards.

Card 1:

River Safari

Explore the peaceful waters of the Bentota River while surrounded by tropical scenery.

Card 2:

Mangrove Adventure

Discover the fascinating mangrove ecosystem and hidden waterways.

Card 3:

Wildlife Discovery

Experience Sri Lanka's riverside wildlife and natural environment.

Each card should include:

Large image

Small category label

Title

Short description

Arrow/link

Hover image zoom

Elegant hover transition

Keep the cards visually premium.

The data should be stored separately so the Laravel API can later return these experiences.

FEATURE / STORY SECTION

Create an immersive full-width section.

Heading:

A Different Side of Bentota

Supporting text:

Slow down. Breathe in the tropical air. Follow the river and discover a side of Bentota that can only be experienced from the water.

Use a large background image.

Add a subtle decorative river/wave-inspired visual element.

Keep this section minimal and cinematic.

WHY LOYALA SECTION

Create a clean section:

Heading:
Why Explore With Loyala?

Create four feature items:

Local Experience

Discover Bentota through a local perspective.

Nature First

Experience the river, mangroves and surrounding ecosystem.

Relaxed Journey

Enjoy a peaceful and memorable boat experience.

Personal Service

A friendly, welcoming experience from start to finish.

Use minimal icons, preferably line-style icons.

Do not use oversized colorful icons.

WILDLIFE SECTION

Create a visually rich editorial section.

Small label:
WILDLIFE & NATURE

Heading:
Life Along the Bentota River

Create a modern image/text layout showcasing possible wildlife and nature.

Possible content:

Birds

Mangroves

Tropical vegetation

River landscapes

Aquatic environment

IMPORTANT:
Do not claim specific animals are guaranteed to be seen.

Use wording such as:
Depending on the season and conditions, visitors may encounter a variety of birds and wildlife along the river.

Add:
Explore the River →

GALLERY SECTION

Create a premium responsive gallery.

Heading:
Moments From the River

Create a masonry-style or asymmetric image grid.

Images should be loaded from a centralized image configuration.

For now, create placeholder image paths/constants such as:

const galleryImages = [
...
];

Make it extremely easy to replace these with Cloudinary URLs later.

When I provide Cloudinary URLs later, I should only need to update the image configuration rather than edit multiple components.

Gallery features:

Smooth hover effects

Image zoom

Lightbox when clicking an image

Keyboard accessible lightbox

Mobile-friendly gallery

Lazy loading

ABOUT SECTION

Create an About section:

Small label:
OUR STORY

Heading:
Rooted in Bentota

Content should communicate:

Local connection

Love for nature

Boat safari experience

Exploring Bentota responsibly

Welcoming visitors

Do not invent specific claims such as number of years in business, awards, certifications, fleet size, or exact staff qualifications.

Use authentic but non-specific copy until real business information is provided.

LOCATION SECTION

Create a dedicated location section.

Heading:

Find Us in Bentota

Show:

Bentota, Sri Lanka

Location information

Map placeholder area

Get Directions button

Prepare the component so a Google Maps embed/API can be added later.

For now, do not invent an exact street address or GPS coordinates.

Create a clear configuration value such as:

LOCATION_ADDRESS

and keep it easy to update later.

BOOKING CTA SECTION

Create a strong but elegant CTA:

Heading:

Ready to Explore Bentota?

Supporting text:

Make your time in Bentota unforgettable with a journey along the river.

Primary button:
Book Your Safari

Secondary:
Contact Us

The Book Your Safari button should currently navigate to the Contact/Booking section.

Later this will connect to the Laravel booking API.

CONTACT SECTION

Create a professional contact section.

Display placeholder data that can easily be replaced:

Phone
WhatsApp
Email
Location
Opening Hours

Use clearly separated configuration/data rather than hard-coding these values throughout the UI.

Add:
Chat on WhatsApp

The WhatsApp link should be generated from a single configuration value so it can easily be updated later.

Do not invent a phone number.

FOOTER

Create a premium footer.

Include:

Loyala logo/name

Bentota Boat Safari

Short description:
Discover the beauty of Bentota from the water.

Navigation links:

Home

Experience

About

Gallery

Wildlife

Location

Contact

Social icons:

Facebook

Instagram

WhatsApp

Use placeholder URLs/configuration values for now.

Bottom:
© 2026 Bentota Boat Safari Loyala. All rights reserved.

UI / UX DETAILS

Make the website feel premium.

Use:

Generous whitespace

Strong visual hierarchy

Editorial layouts

Large photography

Smooth section transitions

Subtle hover effects

Soft shadows

Fine borders

Tasteful rounded corners

Responsive typography

Buttons should have:

Smooth hover animation

Slight movement or arrow transition

Clear visual hierarchy

Cards should not all look identical.

Use alternating layouts throughout the page so the website feels custom-designed.

ANIMATIONS

Use Framer Motion if appropriate.

Animations:

Fade-up on scroll

Image reveal

Subtle scale on image hover

Button arrow movement

Navigation transition

Lightbox animation

Keep animations smooth and professional.

Do not make every element animate.

Respect prefers-reduced-motion accessibility settings.

RESPONSIVE DESIGN

Desktop:

Premium spacious layout

Large photography

Editorial asymmetric sections

Tablet:

Adapt grids and spacing

Mobile:

Single-column layouts where appropriate

Large readable headings

Touch-friendly buttons

No horizontal overflow

Optimized image sizes

Mobile navigation

Gallery must work beautifully on small screens

Test the design at:

1440px

1024px

768px

390px

375px

ACCESSIBILITY

Implement:

Semantic HTML

Proper heading hierarchy

Alt text for images

Keyboard navigation

Visible focus states

Accessible buttons

Accessible lightbox

Good color contrast

Reduced-motion support

SEO FOUNDATION

Prepare the frontend for SEO.

Page title:
Bentota Boat Safari Loyala | Explore Bentota River, Sri Lanka

Meta description:
Discover Bentota River, mangroves and tropical nature with Bentota Boat Safari Loyala in Sri Lanka.

Use semantic headings and meaningful image alt text.

CODE STRUCTURE

Use a clean scalable React structure.

Suggested structure:

src/
components/
Navbar.jsx
Hero.jsx
SectionHeading.jsx
ExperienceCard.jsx
ExperienceSection.jsx
StorySection.jsx
WhyLoyala.jsx
WildlifeSection.jsx
Gallery.jsx
Lightbox.jsx
Location.jsx
BookingCTA.jsx
Contact.jsx
Footer.jsx

pages/
Home.jsx
About.jsx
Experiences.jsx
GalleryPage.jsx
ContactPage.jsx

data/
experiences.js
gallery.js
siteConfig.js

services/
api.js

assets/

Prepare an API service layer such as:

services/api.js

so later Laravel API endpoints can be connected without rewriting UI components.

Create a simple environment configuration structure for the future Laravel API base URL.

Example concept:

VITE_API_BASE_URL

Do not actually require the Laravel backend yet.

FUTURE BACKEND COMPATIBILITY

The frontend should be designed with these future Laravel/MySQL entities in mind:

Users

Experiences

Gallery Images

Bookings

Contact Messages

Locations

Business Settings

Do not implement these database features yet.

Use mock/local data for now.

The UI should consume data through reusable components rather than mixing data directly into presentation components.

IMAGE SYSTEM

Create a centralized image configuration.

For example:

siteConfig.js

should contain:

hero image

about image

experience images

wildlife image

gallery images

Use placeholder images initially.

IMPORTANT:
I will later provide Cloudinary PNG/JPG URLs.

When that happens, I want to replace only the image configuration values.

Do not spread image URLs across JSX components.

Use image loading optimization where possible.

BUSINESS INFORMATION

Do not invent:

Phone numbers

Email addresses

Exact address

GPS coordinates

Prices

Safari durations

Opening hours

Awards

Certifications

Number of boats

Guaranteed wildlife sightings

Use clearly marked placeholder configuration values for information that has not yet been provided.

FINAL DESIGN GOAL

The final result should look like a premium boutique eco-tourism website from Sri Lanka, specifically designed for Bentota Boat Safari Loyala.

It should feel:
Natural + Premium + Modern + Authentic + Calm + Adventurous

It must NOT look like:
A generic Bootstrap travel template or AI-generated basic landing page.

Prioritize:

Strong visual identity

Excellent hero section

Premium photography presentation

Beautiful typography

Clear booking CTA

Excellent mobile experience

Clean React architecture

Easy future Cloudinary integration

Easy future Laravel API integration

Professional production-ready frontend code

Before finishing, make sure:

There are no broken links

No horizontal scrolling

No console errors

All buttons have sensible actions

Mobile navigation works

Gallery lightbox works

Images have alt text

Components are reusable

Data is separated from presentation

Cloudinary URLs can later be inserted centrally

Laravel API integration can later be added through the service layer

Build the complete frontend now.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/e2e4f239-7316-4e70-9d89-c9f0a1d4496c).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
