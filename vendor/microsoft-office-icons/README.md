# Microsoft Office app icons

Microsoft's own icons for OneNote, Word, Excel and PowerPoint, downloaded unchanged from Microsoft's Fluent UI CDN:

`https://res-1.cdn.office.net/files/fabric-cdn-prod_20230815.002/assets/brand-icons/product/svg/<app>_<size>x1.svg`

They are © Microsoft and used under the **Microsoft Fabric Assets License Agreement** (`microsoft_fabric_assets_license_agreement_nov_2019.pdf`, from `https://aka.ms/fluentui-assets-license`), which allows them in an application that uses a Microsoft API to work with a Microsoft service (Studyboard uses Microsoft Graph for OneNote and OneDrive) and to show that it integrates with that product.

`node scripts/gen-ms-icons.js` embeds them, byte for byte, in `src/js/01-ms-icons.js`; `tests/ms-icons.test.js` checks the two match.

Rules from the license's Annex 1 (Fabric Visual Guidelines) that Studyboard follows:

- Full color, on a background with enough contrast. Never altered, recolored, animated, cropped or distorted.
- Used mainly to open or launch the app or a file in it (Open in OneNote, Save to OneNote, a Word file link), or beside the full product name in a list of apps.
- Never as Studyboard's own logo or branding, never more prominent than Studyboard's name, never locked up with text as a logo, never in a sentence, and never in a way that suggests Microsoft endorses Studyboard.
- Replace them when Microsoft updates the icons.
