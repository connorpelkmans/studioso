# Third-party notices

Studyboard itself is released under the MIT License (see `LICENSE`). It includes or is built with the following third-party software and fonts. Each keeps its own license, reproduced or referenced below. The in-app **About** page lists the same credits.

| Component | Used for | Copyright | License |
|---|---|---|---|
| Atkinson Hyperlegible and Atkinson Hyperlegible Next (typefaces) | Body text | Copyright 2020 Braille Institute of America, Inc. (https://www.brailleinstitute.org/), with Reserved Font Name "Atkinson Hyperlegible" | SIL Open Font License 1.1 |
| Lexend (typeface) | Headings | Copyright 2018 The Lexend Project Authors (https://github.com/googlefonts/lexend) | SIL Open Font License 1.1 |
| Roboto Medium (typeface) | The Continue with Google button (Google's branding guidelines ask for it) | Copyright 2011 The Roboto Project Authors (https://github.com/googlefonts/roboto-classic) | SIL Open Font License 1.1 |
| Permanent Marker (typeface) | Writing on the Whiteboard in Notes | Copyright (c) 2010 by Font Diner, Inc. | Apache License 2.0 |
| Patrick Hand, Caveat, Kalam, Gochi Hand (typefaces) | Writing styles on the Whiteboard in Notes | Copyright (c) 2010-2012 Patrick Wagesreiter; Copyright 2014 The Caveat Project Authors; Copyright (c) 2014 Indian Type Foundry; Copyright (c) 2011 HT Fonts, with Reserved Font Names "Gochi" and "Gochi Hand" | SIL Open Font License 1.1 |
| @fontsource/atkinson-hyperlegible, @fontsource/atkinson-hyperlegible-next, @fontsource/lexend, @fontsource/permanent-marker, @fontsource/patrick-hand, @fontsource/caveat, @fontsource/kalam, @fontsource/gochi-hand | Packaged font files for the desktop app (offline use) | Fontsource contributors | MIT (the fonts inside keep their own OFL or Apache license) |
| pdfjs-dist (PDF.js) 6.4.299 | Reading PDFs you import (syllabi, study material); the unmodified legacy build is served from `vendor/pdfjs/` | Copyright 2012 Mozilla Foundation | Apache License 2.0 |
| @supabase/supabase-js | Optional account sign-in and sync | Copyright (c) 2020 Supabase | MIT |
| fzstd 0.1.1 | Unpacking newer Anki files (collection.anki21b) in Import From Another App; the unmodified UMD build is served from `vendor/fzstd-0.1.1.umd.js` and loaded only for those files | Copyright (c) 2020 Arjun Barrett | MIT |
| Electron | The desktop app (includes Chromium and Node.js, whose own notices ship inside the installer as `LICENSES.chromium.html`) | Copyright (c) Electron contributors; Copyright (c) 2013-2020 GitHub Inc. | MIT |
| Lucide icons (lucide-static 1.49.0) | Course icons you make with Create: an icon's shapes are copied from Lucide and coloured; the library is loaded from the jsDelivr CDN only when you make one | Copyright (c) 2026 Lucide Icons and Contributors; icons derived from Feather Copyright (c) 2013-present Cole Bemis | ISC (Lucide); MIT (the Feather-derived icons) |
| electron-builder | Building the desktop installers (build tool, not shipped) | electron-userland contributors | MIT |

On the website the fonts (Latin subsets from `@fontsource`, SIL OFL 1.1 or Apache 2.0, licenses in `vendor/fonts/`) supabase-js and fzstd (`vendor/`, MIT, licenses beside them) are served from the site itself; pdf.js (`vendor/pdfjs/`) is served from the site itself too. The desktop app ships local copies of all of them (`npm run prep` copies them from `node_modules` and `vendor/`).

## MIT License (applies to the MIT-licensed components above)

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

## ISC License (Lucide icons)

ISC License

Copyright (c) 2026 Lucide Icons and Contributors

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted, provided that the above
copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.

The following Lucide icons are derived from the Feather project, Copyright (c) 2013-present Cole Bemis, and are also under the MIT License above: airplay, alert-circle, alert-octagon, alert-triangle, aperture, arrow-down-circle, arrow-down-left, arrow-down-right, arrow-down, arrow-left-circle, arrow-left, arrow-right-circle, arrow-right, arrow-up-circle, arrow-up-left, arrow-up-right, arrow-up, at-sign, calendar, cast, check, chevron-down, chevron-left, chevron-right, chevron-up, chevrons-down, chevrons-left, chevrons-right, chevrons-up, circle, clipboard, clock, code, columns, command, compass, corner-down-left, corner-down-right, corner-left-down, corner-left-up, corner-right-down, corner-right-up, corner-up-left, corner-up-right, crosshair, database, divide-circle, divide-square, dollar-sign, download, external-link, feather, frown, hash, headphones, help-circle, info, italic, key, layout, life-buoy, link-2, link, loader, lock, log-in, log-out, maximize, meh, minimize, minimize-2, minus-circle, minus-square, minus, monitor, moon, more-horizontal, more-vertical, move, music, navigation-2, navigation, octagon, pause-circle, percent, plus-circle, plus-square, plus, power, radio, rss, search, server, share, shopping-bag, sidebar, smartphone, smile, square, table-2, tablet, target, terminal, trash-2, trash, triangle, tv, type, upload, x-circle, x-octagon, x-square, x, zoom-in, zoom-out

## Apache License 2.0 (pdfjs-dist, Permanent Marker)

Permanent Marker (Copyright (c) 2010 by Font Diner, Inc.) is licensed under the Apache License, Version 2.0; the full text is in `vendor/fonts/LICENSE-permanent-marker-Apache-2.0.txt`. PDF.js is licensed under the Apache License, Version 2.0. You may obtain a copy of the License at https://www.apache.org/licenses/LICENSE-2.0. Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License. The unmodified `pdf.min.js` and `pdf.worker.min.js` files are distributed with the desktop app and carry their own license headers.

## SIL Open Font License 1.1 (Atkinson Hyperlegible, Lexend, Roboto, Patrick Hand, Caveat, Kalam, Gochi Hand)

Copyright 2020 Braille Institute of America, Inc. (https://www.brailleinstitute.org/), with Reserved Font Name "Atkinson Hyperlegible".
Copyright 2018 The Lexend Project Authors (https://github.com/googlefonts/lexend).

This Font Software is licensed under the SIL Open Font License, Version 1.1. This license is copied below, and is also available with a FAQ at: https://openfontlicense.org

PREAMBLE
The goals of the Open Font License (OFL) are to stimulate worldwide development of collaborative font projects, to support the font creation efforts of academic and linguistic communities, and to provide a free and open framework in which fonts may be shared and improved in partnership with others.

The OFL allows the licensed fonts to be used, studied, modified and redistributed freely as long as they are not sold by themselves. The fonts, including any derivative works, can be bundled, embedded, redistributed and/or sold with any software provided that any reserved names are not used by derivative works. The fonts and derivatives, however, cannot be released under any other type of license. The requirement for fonts to remain under this license does not apply to any document created using the fonts or their derivatives.

DEFINITIONS
"Font Software" refers to the set of files released by the Copyright Holder(s) under this license and clearly marked as such. This may include source files, build scripts and documentation.

"Reserved Font Name" refers to any names specified as such after the copyright statement(s).

"Original Version" refers to the collection of Font Software components as distributed by the Copyright Holder(s).

"Modified Version" refers to any derivative made by adding to, deleting, or substituting -- in part or in whole -- any of the components of the Original Version, by changing formats or by porting the Font Software to a new environment.

"Author" refers to any designer, engineer, programmer, technical writer or other person who contributed to the Font Software.

PERMISSION & CONDITIONS
Permission is hereby granted, free of charge, to any person obtaining a copy of the Font Software, to use, study, copy, merge, embed, modify, redistribute, and sell modified and unmodified copies of the Font Software, subject to the following conditions:

1) Neither the Font Software nor any of its individual components, in Original or Modified Versions, may be sold by itself.

2) Original or Modified Versions of the Font Software may be bundled, redistributed and/or sold with any software, provided that each copy contains the above copyright notice and this license. These can be included either as stand-alone text files, human-readable headers or in the appropriate machine-readable metadata fields within text or binary files as long as those fields can be easily viewed by the user.

3) No Modified Version of the Font Software may use the Reserved Font Name(s) unless explicit written permission is granted by the corresponding Copyright Holder. This restriction only applies to the primary font name as presented to the users.

4) The name(s) of the Copyright Holder(s) or the Author(s) of the Font Software shall not be used to promote, endorse or advertise any Modified Version, except to acknowledge the contribution(s) of the Copyright Holder(s) and the Author(s) or with their explicit written permission.

5) The Font Software, modified or unmodified, in part or in whole, must be distributed entirely under this license, and must not be distributed under any other license. The requirement for fonts to remain under this license does not apply to any document created using the Font Software.

TERMINATION
This license becomes null and void if any of the above conditions are not met.

DISCLAIMER
THE FONT SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO ANY WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT OF COPYRIGHT, PATENT, TRADEMARK, OR OTHER RIGHT. IN NO EVENT SHALL THE COPYRIGHT HOLDER BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, INCLUDING ANY GENERAL, SPECIAL, INDIRECT, INCIDENTAL, OR CONSEQUENTIAL DAMAGES, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF THE USE OR INABILITY TO USE THE FONT SOFTWARE OR FROM OTHER DEALINGS IN THE FONT SOFTWARE.

## university-domains-list (Hipo)

`supabase-schools.sql` and `supabase-schools-2.sql` contain the list of universities and colleges with their web addresses from https://github.com/Hipo/university-domains-list.

The MIT License (MIT). Copyright (c) 2014-2025 Hipo. Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions: The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software. THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

## High school lists (open government data)

`supabase-schools-hs-1.sql` to `-hs-4.sql` contain school names, cities and regions from:
- United States public schools: National Center for Education Statistics (NCES), Common Core of Data, school directory 2022-23. Public domain (U.S. government work).
- United States private schools: NCES Private School Universe Survey 2021-22. Public domain.
- Ontario: Ontario Ministry of Education, "School information and student demographics" 2022-23. Contains information licensed under the Open Government Licence – Ontario.
- British Columbia: "BC Schools - K-12 with Francophone Indicators", 2025-26. Contains information licensed under the Open Government Licence – British Columbia.

`supabase-lms-districts.sql` (each high school's school board or district, and the district's web domains) comes from:
- Ontario: Ontario Ministry of Education, "School information and student demographics" 2022-23 (school boards and board websites). Contains information licensed under the Open Government Licence – Ontario.
- British Columbia: BC School and District Contact Information, school contacts (school districts and their email domains). Contains information licensed under the Open Government Licence – British Columbia.
- United States public schools: the NCES school directory above (each school's district and website).
