DevConf 2026 Website – Phase 2: Layout System
Overview

Today’s work focused on implementing advanced layouts for the DevConf 2026 website using CSS Flexbox and Grid, improving responsiveness, and cleaning up the stylesheet for better maintainability. The project ensures a professional look for navigation, hero sections, speaker cards, schedules, sponsors, and registration forms.

Tasks Completed :
1. CSS Refactoring & Cleanup

Removed duplicate resets and repeated styles.

Merged multiple hero, card, and sidebar styles into single definitions.

Optimized styles.css from 1000+ lines to ~500 lines.

Organized sections with clear comments for maintainability.

2. Sidebar & Navigation

Implemented fixed sidebar with gradient background.

Created sticky top navigation with responsive adjustments.

Navigation links highlight on hover and active state.

3. Hero Section

Hero section with linear gradient background, rounded corners, and shadow for visual depth.

Hero buttons styled with primary and secondary variants, including hover effects.

4. Cards / Speakers / Sponsors

Speaker and sponsor cards use Flexbox and CSS Grid.

Added hover effects with transform and box-shadow.

Implemented responsive grid using repeat(auto-fit, minmax()).

Updated sponsor images to increase size and maintain aspect ratio using object-fit: contain.

5. Schedule Section

Created schedule display using CSS Grid for header and rows.

Added hover effects and break row styling.

Fully responsive: converts to stacked layout on small screens.

6. Registration Form

Styled registration forms with rounded fields, shadows, and focus effects.

Used flex for option groups and responsive adjustments.

7. Call to Action & Footer

CTA section with gradient background and visual depth.

Footer styled consistently with color scheme and rounded edges.

8. Responsiveness

Consolidated all media queries under @media(max-width: 768px).

Sidebar, hero, cards, schedule, and forms adjust seamlessly on smaller screens.

Deliverables:

Updated styles.css with clean, optimized, and maintainable layout code.

Responsive sidebar, hero, speaker cards, sponsors, schedule, and registration form.

Increased sponsor image size for better visibility.

Consistent visual theme using CSS variables.

Learning Outcomes:

Built a responsive navigation bar using Flexbox.

Created speaker and sponsor grids using CSS Grid.

Applied hover effects, shadows, and positioning for depth.

Used CSS variables for consistent theming.

Optimized CSS for maintainability and performance.

Practiced responsive design techniques for desktop and mobile screens.
