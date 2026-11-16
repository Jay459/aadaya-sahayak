# Publishing the assessment source

Deployment is a separate step and is not performed by these commands.

## Prepare the evaluation password

On the development machine where `.env` already contains the working `DEMO_PASSWORD`:

```powershell
npm.cmd run docs:demo
npm.cmd exec prettier -- --write README.md
```

This inserts only the evaluation login into the README. It does not change any database account. Review that section before sharing; the evaluation password will become public with a public repository. Keep `.env`, database credentials and the Gemini key private.

## Publish to GitHub

Create an empty repository named `aadaya-sahayak` under your own GitHub account. Choose public access if the reviewers should view it without invitations. Do not initialise it with another README, licence or gitignore when pushing the existing source.

If publishing from your existing development folder, initialise Git only if it has not already been initialised:

```powershell
git init -b main
git status --short
```

Check that `.env`, `node_modules`, `.local` and `dist` are absent from the files to publish. Then:

```powershell
git add .
git diff --cached --stat
git commit -m "Build Aadaya Sahayak assessment workflow and documentation"
git remote add origin https://github.com/YOUR_USERNAME/aadaya-sahayak.git
git push -u origin main
```

Replace `YOUR_USERNAME` with your account. If `origin` already exists, inspect `git remote -v` before changing it. Sign in through your normal GitHub credential flow if requested; do not put tokens into source files or remote URLs.

After publication, replace the README's pending repository field with its actual URL, commit that change and push again. Inspect the Verify assessment workflow under GitHub Actions. Its PostgreSQL service is independent of the evaluation database.

A public repository link is not a live application URL. Add the live link and verify credentials after deployment is requested and completed.
