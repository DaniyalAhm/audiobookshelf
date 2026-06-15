# Styling Guide

## CSS Architecture

The client uses **Tailwind CSS v4** through the CSS-based `@theme` directive plus global CSS files. Styles are loaded into the Nuxt SPA bundle from `nuxt.config.js`:

```js
css: ['@/assets/app.css']
```

`assets/app.css` is the entry point and imports every other client stylesheet.

## File Organization

```
client/assets/
├── tailwind.css          # Tailwind engine, @theme config, utility extensions
├── app.css               # Main entry, imports, CSS variables, base/global styles
├── inputs.css            # Form input, textarea, range, select styles
├── tables.css            # Table/list styles and table-related transitions
├── components.css        # Component/page-specific extracted styles
├── animations.css        # Keyframes, loading indicators, spinner styles
├── transitions.css       # Vue <Transition> classes
├── draggable.css         # vuedraggable list/drag styles
├── fonts.css             # Font faces (Source Sans Pro, Ubuntu Mono, Material Icons)
├── defaultStyles.css     # Embedded HTML content defaults
├── absicons.css          # Legacy custom icon font
└── trix.css              # Trix rich-text editor vendor stylesheet
```

## CSS Custom Properties

Defined in `assets/tailwind.css` under `@theme`, then mapped in `assets/app.css` under `:root` for legacy `--abs-*` consumers.

| Property | Purpose |
| --- | --- |
| `--abs-bg` | Page background |
| `--abs-secondary-bg` | Secondary/elevated surfaces |
| `--abs-surface` | Primary surface/card background |
| `--abs-surface-muted` | Muted surface background |
| `--abs-primary` | Primary action/brand accent |
| `--abs-primary-dark` | Primary hover/active accent |
| `--abs-text` | Primary text |
| `--abs-text-secondary` | Secondary text |
| `--abs-text-muted` | Muted text |
| `--abs-border` | Borders and dividers |
| `--abs-shadow` | Shared shadow token |
| `--abs-radius` | Shared radius token |
| `--abs-motion` | Shared transition curve |

Reference them via `var(--abs-*)` in custom CSS. Prefer Tailwind theme tokens (`var(--color-*)`) in new shared CSS. Use `var(--abs-*)` only when touching existing legacy styles that already consume the alias layer.

## Tailwind Theme

Dark is the default token set; light mode is applied automatically with `@media (prefers-color-scheme: light)` so the app follows the operating system theme.

Colors, fonts, spacing, and font sizes are configured in `assets/tailwind.css` under `@theme`.

| Utility family | Notes |
| --- | --- |
| `bg-bg`, `text-bg` | App background token |
| `bg-fg`, `text-fg` | Primary surface token |
| `bg-primary`, `text-primary` | Primary action/brand accent token |
| `bg-primary-dark`, `text-primary-dark` | Primary action hover/active token |
| `bg-accent`, `text-accent` | Blue accent token |
| `bg-error`, `text-error` | Error color token |
| `bg-info`, `text-info` | Info color token |
| `bg-success`, `text-success` | Success color token |
| `bg-warning`, `text-warning` | Warning color token |
| `text-secondary-text`, `text-muted` | Secondary/muted text tokens |
| `border-border`, `border-black-200` | Border tokens |
| `bg-card`, `bg-elevated`, `bg-surface-muted` | Shared dark surface tokens |
| `font-sans` | Source Sans Pro |
| `font-mono` | Ubuntu Mono |
| `{n}e` spacing utilities | Em-based spacing variants, for example `w-8e`, `p-4e`, `mx-2e` |
| `hover-wiggle` | Adds a short wiggle animation on hover |

## Global Classes

Defined mainly in `assets/app.css`.

| Class/selector | Purpose |
| --- | --- |
| `.appbar` | Main app bar container with shadow |
| `.cover-bg-wrapper` | Full-bleed cover image background wrapper |
| `.page` | Full page height minus the app bar |
| `.page.streaming` | Page height adjusted for the media player |
| `#bookshelf` | Bookshelf scroll container sizing and scrollbar color |
| `.bookshelf-row` | Viewport-aware bookshelf row width |
| `#page-wrapper` | App background wrapper |
| `.no-scroll` | Hides scrollbars while retaining scroll behavior |
| `.no-spinner` | Removes number input spinner controls |
| `.bg-bg` | CSS-variable-backed background override |
| `.bg-fg` | CSS-variable-backed surface background override |
| `.shadow-lg`, `.box-shadow-md` | Shared shadow token override |
| `.box-shadow-side`, `.box-shadow-book` | Removes legacy shadows |
| `.box-shadow-progressbar`, `.box-shadow-sm-up`, `.box-shadow-md-up`, `.box-shadow-lg-up`, `.box-shadow-xl`, `.box-shadow-book3d` | Removes legacy shadow variants |
| `.shadow-height` | Forces full-height shadow wrapper sizing |
| `.categoryPlacard` | Normalizes category placard letter spacing |
| `.shinyBlack` | Legacy dark surface helper mapped to design tokens |
| `.animated-menu` | Menu entrance animation hook |
| `.tables__bar` | Shared collapsible table header bar surface |
| `.pill-action-btn` | Rounded pill action button for compact play/resume controls |
| `.select-trigger-btn` | Dropdown and select trigger button base |
| `.arrow-down` | CSS triangle down icon |
| `.arrow-down-small` | Smaller CSS triangle down icon |
| `.triangle-right` | CSS triangle right icon |
| `.icon-text` | Enlarged inline icon/text sizing |
| `.animated-overlay` | Blurred/dimmed card overlay |
| `.book-cover-surface` | Book cover hover transform hook |
| `.entity-card` | Shared bookshelf/entity card surface hook |
| `.search-card` | Shared compact search/result card row hook |
| `.ConfigSideNav a` | Config side navigation link transition hook |
| `.app-bar-and-toolbar .Vue-Toastification__container.top-right` | Toast top offset when app bar and toolbar are visible |
| `.app-bar .Vue-Toastification__container.top-right` | Toast top offset when only app bar is visible |
| `.no-bars .Vue-Toastification__container.top-right` | Toast top offset when no bars are visible |

## Buttons

| Class/selector | Purpose |
| --- | --- |
| `.abs-btn` | Base text button/nuxt-link interaction and surface hook |
| `.icon-btn` | Base icon button interaction and layout hook |
| `.app-icon-link` | App link interaction hook matching button motion |
| `.pill-action-btn` | Rounded pill action button for compact play/resume controls |
| `.select-trigger-btn` | Dropdown and select trigger button base |
| `button.icon-btn:disabled span` | Disabled icon color |
| `button.icon-btn::before` | Icon button overlay |

`abs-btn`, `icon-btn`, and `app-icon-link` share hover lift and active press behavior:

```css
.abs-btn:hover:not(:disabled),
.icon-btn:hover:not(:disabled),
.pill-action-btn:hover:not(:disabled),
.select-trigger-btn:hover:not(:disabled),
.app-icon-link:hover {
  transform: translateY(-1px) scale(1.015);
}
```

## Layout And Component Hooks

Defined in `assets/components.css`.

| Class/selector | Purpose |
| --- | --- |
| `.Vue-Toastification__toast-body.custom-class-1` | Toast body font sizing |
| `#app-content` | Main app content width |
| `#app-content.has-siderail` | Main content width/margin when the side rail is visible |
| `#appbar .bg-secondary-bg:hover` | App bar secondary background hover treatment |
| `#mediaPlayerContainer` | Media player top shadow |
| `#toolbar` | Bookshelf toolbar shadow |
| `#siderail-buttons-container` | Side rail button list height |
| `#siderail-buttons-container.player-open` | Side rail height adjusted for player |
| `.bookshelfRow` | Bookshelf row background |
| `.bookshelfDivider` | Bookshelf divider line |
| `.categorizedBookshelfRow` | Categorized row scroll behavior/background |
| `.bookshelfDividerCategorized` | Categorized row divider |
| `.book-shelf-arrow-right` | Right scroll affordance gradient |
| `.book-shelf-arrow-left` | Left scroll affordance gradient |
| `.config-drawer` | Config side drawer rounded edge |
| `.config-drawer-link` | Config side drawer link hover movement |
| `#reader` | Reader base height |
| `#reader.reader-player-open` | Reader height adjusted for player |
| `.ebook-viewer` | Mobi reader viewport height |
| `.pagemenu` | Comic reader page menu max height |
| `.globalTaskRunningMenu` | Notification task menu max height |
| `.globalSearchMenu` | Global search dropdown max height |
| `.libraryFilterMenu` | Library filter dropdown max height |
| `.librarySortMenu` | Library sort dropdown max height |
| `.librariesDropdownMenu` | Libraries dropdown max height |
| `#confirm-prompt-message code` | Inline code styling in confirm prompts |
| `#settings-description a` | Link styling in settings descriptions |
| `#settings-description code` | Inline code styling in settings descriptions |
| `.tab` | Modal tab height |
| `.tab.tab-selected` | Selected modal tab height |
| `.folders-container` | Edit library folder list max height |
| `.folder-container` | Folder chooser fixed height |
| `.dir-item.dir-selected` | Selected directory row state |
| `.dir-item.dir-used` | Already-used directory row state |
| `.queue-item-row-content` | Player queue item content width |
| `#chapter-modal-wrapper .chapter-title` | Chapter modal title width |
| `#podcast-wrapper` | Podcast modal wrapper height constraints |
| `#episodes-scroll` | Podcast episode feed scroll height |
| `#formWrapper` | Item details tab scroll height |
| `#scheduleWrapper` | Item schedule tab scroll height |
| `.matchListWrapper` | Match tab result list height |
| `.trix_container` | Rich text editor wrapper sizing |
| `.trix_container .trix-button-group` | Trix toolbar background |
| `.trix_container .trix-content` | Trix editor background |
| `trix-editor` | Trix editor height and resize behavior |

## Search Card Helpers

Defined in `assets/components.css`; each class fixes the content width/height beside an icon or cover thumbnail.

| Class | Purpose |
| --- | --- |
| `.audiobookSearchCardContent` | Audiobook search card content area |
| `.episodeSearchCardContent` | Episode search card content area |
| `.authorSearchCardContent` | Author search card content area |
| `.seriesSearchCardContent` | Series search card content area |
| `.tagSearchCardContent` | Tag search card content area |
| `.narratorSearchCardContent` | Narrator search card content area |
| `.taskRunningCardContent` | Running task card content area |

## Config Pages

Defined in `assets/components.css`.

| Class/selector | Purpose |
| --- | --- |
| `.hamburger-button` | Config mobile drawer button interaction hook |
| `.hamburger-lines` | Three-line hamburger icon container |
| `.hamburger-lines.open` | Open-state hamburger-to-close icon transform |
| `.configContent` | Config page content width and responsive offset |
| `#log-container` | Log page scroll container height |
| `.logmessage` | Log row message width |
| `#authentication-settings code` | Inline code styling on authentication settings |

## Description Clamps

Defined in `assets/components.css`.

| Class/selector | Purpose |
| --- | --- |
| `#author-description` | Four-line collapsed author description |
| `#author-description.show-full` | Expanded author description |
| `#item-description` | Four-line collapsed item description |
| `#item-description.show-full` | Expanded item description |

## Inputs

Defined in `assets/inputs.css`.

| Class/selector | Purpose |
| --- | --- |
| `input`, `textarea` | Keeps inherited border style for form controls |
| `input:read-only`, `textarea:read-only` | Read-only control colors |
| `input::-webkit-calendar-picker-indicator` | Inverts date/time picker icon for dark UI |
| `.digit-focused` | Focused digit state in `TimePicker` |

## Tables

General table styles are split between `assets/app.css` and `assets/tables.css`.

| Class/selector | Purpose |
| --- | --- |
| `.tracksTable` | Shared track/file/table surface style |
| `#backups` | Backups table layout and row states |
| `#backups tr.staticrow` | Centered static backup row |
| `#providers` | Custom metadata provider table |
| `#api-keys` | API keys table |
| `#accounts` | Users/accounts table |
| `.custom-provider-api-key` | Masked custom provider API key pill |
| `.userSessionsTable` | User sessions table |
| `.userSessionsTable tr.selected` | Selected user session row |
| `.rssFeedsTable` | RSS feeds table |
| `.userAudiobooksTable` | User audiobooks table |
| `.userAudiobooksTable tr.isFinished` | Finished audiobook row state |
| `.episodesTable` | RSS feed episode list wrapper |
| `.episodesTable .header` | RSS episode list header |
| `.episodesTable .scroller` | RSS episode list scroll container |

## Chapters Table

Defined in `assets/app.css` and used by `components/tables/ChaptersTable.vue`.

| Class | Purpose |
| --- | --- |
| `.chapters-table` | Root wrapper for the chapters table block |
| `.chapters-table__bar` | Clickable header bar |
| `.chapters-table__title` | Header label text |
| `.chapters-table__count` | Chapter count pill |
| `.chapters-table__spacer` | Flex spacer between count and actions |
| `.chapters-table__edit` | Edit chapters action hook |
| `.chapters-table__toggle` | Expand/collapse button container |
| `.chapters-table__toggle-icon` | Expand/collapse icon |
| `.chapters-table__table` | Table element |
| `.chapters-table__timestamp` | Clickable chapter timestamp cell |
| `.chapters-table__duration` | Chapter duration cell |

## Animations And Loaders

Defined in `assets/animations.css` and `assets/tailwind.css`.

| Class/keyframes | Purpose |
| --- | --- |
| `.loadingTrack` / `@keyframes loadingTrack` | Player track loading sweep |
| `.animated-menu` / `@keyframes abs-menu-in` | Menu entrance animation |
| `.animated-overlay` / `@keyframes abs-fade-in` | Overlay fade-in animation |
| `.loader-dots` | Four-dot loading indicator wrapper |
| `@keyframes loader-dots1` | Loader dot scale-in keyframe |
| `@keyframes loader-dots2` | Loader dot translate keyframe |
| `@keyframes loader-dots3` | Loader dot scale-out keyframe |
| `.la-ball-spin-clockwise` | Loading spinner wrapper |
| `.la-ball-spin-clockwise.la-dark` | Dark spinner color variant |
| `.la-ball-spin-clockwise.la-sm` | Small spinner size |
| `.la-ball-spin-clockwise.la-lg` | Large spinner size |
| `.la-ball-spin-clockwise.la-2x` | 2x spinner size |
| `.la-ball-spin-clockwise.la-3x` | 3x spinner size |
| `@keyframes ball-spin-clockwise` | Spinner animation |
| `.hover-wiggle` / `@keyframes wiggle` | Tailwind utility for hover wiggle |

## Vue Transitions

Defined in `assets/transitions.css`, `assets/components.css`, and `assets/tables.css`.

| Transition name/classes | Purpose |
| --- | --- |
| `slide` | Max-height collapse/expand transition |
| `menu` | Y-axis fade/slide dropdown transition |
| `menux` | X-axis fade/slide dropdown transition |
| `list-complete` | FLIP-style list transition |
| `drawer-backdrop` | Config drawer backdrop fade |
| `episode` | RSS episode list enter/leave transition |
| `collection-book` | Collection book row enter/leave transition |
| `playlist-item` | Playlist item row enter/leave transition |

Use these with Vue `<Transition name="...">` or `<TransitionGroup name="...">`.

## Draggable Lists

Defined in `assets/draggable.css`.

| Class | Purpose |
| --- | --- |
| `.flip-list-move` | Move transition for reordered draggable items |
| `.no-move` | Disables move transition |
| `.ghost` | Drag ghost state |
| `.list-group` | Draggable list container minimum height |
| `.drag-handle` | Resize-style cursor for drag handles |
| `.list-group-item` | Draggable row cursor and row states |
| `.list-group-item.exclude` | Disabled/non-draggable row state |

## Adding Styles

Prefer Tailwind utilities in templates. Add custom CSS only when the behavior is reused, difficult to express with utilities, or must target third-party/structural selectors.

| Style type | File |
| --- | --- |
| Layout/surface/component hooks | `client/assets/components.css` |
| Inputs and form controls | `client/assets/inputs.css` |
| Tables and table row transitions | `client/assets/tables.css` |
| Keyframes and loaders | `client/assets/animations.css` |
| Vue transition names | `client/assets/transitions.css` |
| Drag-and-drop list behavior | `client/assets/draggable.css` |
| Tailwind tokens/utilities | `client/assets/tailwind.css` |

For component-scoped styles, use a scoped `<style>` block and include `@reference "tailwindcss"` before `@apply`.

## Best Practices

- Prefer Tailwind utilities over custom CSS when possible.
- Use Tailwind theme variables (`var(--color-*)`) for new shared colors; `--abs-*` remains as a compatibility alias layer.
- Theme changes must be made in `client/assets/tailwind.css` so dark and light mode stay aligned.
- Keep shared classes in the closest matching `client/assets/*.css` file.
- Check existing selectors before adding new ones.
- Keep dark and light theme values paired in `client/assets/tailwind.css`; avoid one-off color overrides in component files.
- Keep shadows flat unless the design system tokens change.
- Use the existing transition and animation class names before adding new ones.

## Icons

Two icon systems are available:

| System | Usage |
| --- | --- |
| Material Symbols Rounded | `<span class="material-symbols text-2xl">icon_name</span>` |
| absicons legacy font | `<span class="abs-icons icon-star"></span>` |
