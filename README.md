<h1 align="center">RedCard Studio</h1>

<p align="center"><strong>A workspace for creating Xiaohongshu carousel posts.</strong><br>Draft the copy, edit portrait cards, and export a ready-to-review image deck.</p>

<p align="center"><a href="#product-walkthrough">Walkthrough</a> · <a href="#quick-start">Quick start</a> · <a href="#card-types">Card types</a> · <a href="#desktop-and-mobile">Desktop and mobile</a> · <a href="#development">Development</a></p>

## Product walkthrough

https://github.com/user-attachments/assets/faa6a9ba-c859-456d-ba10-4461b877fb5b

## From a brief to a carousel

RedCard Studio is built for Xiaohongshu creators who publish product reviews, buying advice, skincare breakdowns, book notes, and practical explainers. A topic becomes a draft deck of 3:4 cards plus headline options, a post body, and suggested tags. One workspace keeps the image sequence and the text that accompanies it together.

Start with a short brief and an optional reference image. Choose a scene preset, review the draft, and refine individual cards. Switch between focused editing and a deck overview to check whether the story makes sense from cover to conclusion. Copy the final text and export the images when they are ready.

## What you can edit

- **Deck structure.** Add, duplicate, move, or remove cards, or regenerate a selected card without regenerating the whole deck. Page numbers follow the current order.
- **Card content.** Edit headings, body copy, metrics, and attribution in place. Change radar scores and review how the chart responds.
- **Art direction.** Choose from six card themes and five workspace themes. Switch the workspace colors independently of the cards.
- **Reference images.** Browser-side Canvas matting uses color similarity and background samples to separate a subject and can add a soft shadow. Use a plain, distinct background for the most predictable result. Inspect fine edges and transparent objects before export.
- **Post copy.** Review three headline alternatives and edit the body and tags. Treat generated ratings, ingredient commentary, and product comparisons as drafts that need your own evidence.
- **Output.** Export an individual high-resolution PNG or use the ZIP export for the whole deck. Image export uses 2.5× sampling in the browser. Upload the selected images and copy through your publishing platform.

## Card types

| Card | Best used for |
| --- | --- |
| **Cover** | The headline and visual hook that establish the subject. |
| **Radar** | A five-dimension rating with criteria you can edit. |
| **Ingredient** | An ingredient breakdown and suitability notes. |
| **Quote** | A sourced excerpt or a single idea with supporting takeaways. |
| **Comparison** | A side-by-side spec or feature comparison. |
| **Detail** | A caveat, a condition, or a practical tip. |
| **Verdict** | A recommendation, trade-offs, and who should consider each option. |
| **Outro** | An action checklist or a short wrap-up. |

### An example editing pass

For a phone comparison, begin with the device names and the buying decision your readers face. Use the comparison card for measured specifications and a radar card for your own consistently applied criteria. Add a detail card for a caveat the headline would miss. Check the verdict and copy against the same criteria before exporting the ordered deck.

## Quick start

Use Node.js 24 for the development commands. From your checkout:

```bash
npm ci
npm run dev
```

Open the URL printed by Vite. To inspect a production build locally:

```bash
npm run build
npm run preview
```

The browser interface uses React, TypeScript, and Vite. Built-in templates can generate a starting deck locally. The optional model integration and the browser image tools serve separate purposes, so confirm what data a configured model provider receives before enabling it.

### Generation modes

Choose the built-in template mode for a quick local draft. If you configure an API key, the generation service can try a Chat Completions endpoint. When that request fails, the editor can fall back to the local draft and show a notice. Image matting and PNG rendering use browser APIs independently of the model.

Before exporting, align the claims on the cover, comparison, and verdict cards. Export one card and inspect it at full size when the subject has complicated edges or when a caption is close to the page boundary. Then export the complete deck in the final reading order.

## Desktop and mobile

| Platform | How to run it |
| --- | --- |
| **Windows** | Use the browser app, a browser-installed PWA when offered, or the portable launcher from a matching [workflow artifact](https://github.com/hbin-max/redcard-studio/actions). Extract the complete artifact so the launcher can find the bundled web files. |
| **macOS** | Use the browser app or Safari's Add to Dock when available. The repository also defines a macOS packaging job. Public desktop distribution may require signing and notarization. |
| **Android** | Install through a supported mobile browser when available or build the bundled Capacitor Android project. |
| **iPhone and iPad** | Open a served copy in Safari and add it to the Home Screen through the Share menu. |

To launch the desktop Electron window from source:

```bash
npm run build
npm run desktop:run
```

To prepare the Android project, install the JDK and SDK required by [the Android build variables](android/variables.gradle), then run:

```bash
npm run mobile:sync
npx cap open android
```

Build an APK from Android Studio or use an artifact from a successful [cross-platform packaging run](.github/workflows/desktop-release.yml). PWA installation and offline availability depend on browser support and the app being served with its manifest and service worker.

## Development

```bash
npm test
npm run typecheck
npm run build
node test_diagnostics.cjs
```

- [App and deck orchestration](src/App.tsx) manages the editor and deck state.
- [Card renderer](src/components/CardView.tsx) handles layouts, inline editing, and radar charts.
- [Generation service](src/services/aiGenerator.ts) handles draft generation and single-card regeneration.
- [Image matting](src/utils/imageMatting.ts) and [export helpers](src/utils/exportHelper.ts) handle browser image processing and file output.
- [Codebase map](CODEBASE_INDEX.md) and [engineering handover](HANDOFF_TO_CODEX.md) cover packaging, architecture, and implementation details.

Licensed under the [MIT License](LICENSE).
