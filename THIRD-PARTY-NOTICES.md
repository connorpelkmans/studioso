# Third-party notices

Studyboard itself is released under the MIT License (see `LICENSE`). It includes or is built with the following third-party software and fonts. Each keeps its own license, reproduced or referenced below. The in-app **About** page lists the same credits.

| Component | Used for | Copyright | License |
|---|---|---|---|
| Atkinson Hyperlegible and Atkinson Hyperlegible Next (typefaces) | Body text | Copyright 2020 Braille Institute of America, Inc. (https://www.brailleinstitute.org/), with Reserved Font Name "Atkinson Hyperlegible" | SIL Open Font License 1.1 |
| Lexend (typeface) | Headings | Copyright 2018 The Lexend Project Authors (https://github.com/googlefonts/lexend) | SIL Open Font License 1.1 |
| @fontsource/atkinson-hyperlegible, @fontsource/atkinson-hyperlegible-next, @fontsource/lexend | Packaged font files for the desktop app (offline use) | Fontsource contributors | MIT (the fonts inside keep their OFL license) |
| pdfjs-dist (PDF.js) | Reading PDFs you import (syllabi, study material) | Copyright 2012 Mozilla Foundation | Apache License 2.0 |
| @supabase/supabase-js | Optional account sign-in and sync | Copyright (c) 2020 Supabase | MIT |
| Electron | The desktop app (includes Chromium and Node.js, whose own notices ship inside the installer as `LICENSES.chromium.html`) | Copyright (c) Electron contributors; Copyright (c) 2013-2020 GitHub Inc. | MIT |
| electron-builder | Building the desktop installers (build tool, not shipped) | electron-userland contributors | MIT |

On the website the fonts load from Google Fonts and pdf.js and supabase-js load from public CDNs (jsDelivr, cdnjs). The desktop app ships local copies of all of them (`npm run prep` copies them from `node_modules`).

## MIT License (applies to the MIT-licensed components above)

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

## Apache License 2.0 (pdfjs-dist)

PDF.js is licensed under the Apache License, Version 2.0. You may obtain a copy of the License at https://www.apache.org/licenses/LICENSE-2.0. Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License. The unmodified `pdf.min.js` and `pdf.worker.min.js` files are distributed with the desktop app and carry their own license headers.

## SIL Open Font License 1.1 (Atkinson Hyperlegible, Lexend)

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
