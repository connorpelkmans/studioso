# Studyboard desktop app

This folder builds the installable Studyboard app for Windows (and Mac) from the `index.html` one folder up.

- **Easiest:** on GitHub, open the **Actions** tab, choose **Build Studyboard desktop app**, then **Run workflow**. When it finishes, download the installer from the run's **Artifacts**.
- **On your own computer:** install Node.js 20 or newer, then in this folder run `npm ci` and `npm run dist`. The installer appears in `dist/`.

To make a new version, change `"version"` in `package.json` (for example to `1.0.1`) before building. Installing the new version over the old one keeps all your data.
