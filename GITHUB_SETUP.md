# GitHub Repository Setup

Since GitHub CLI is not available, please follow these steps to create the repository:

## Option 1: Using GitHub Web Interface

1. Go to https://github.com/new
2. Create a new repository with these settings:
   - **Repository name**: `filescanner`
   - **Description**: "Cross-platform duplicate file detection and management application"
   - **Visibility**: Private (as specified in requirements)
   - **Initialize repository**: NO (we already have local files)

3. After creating, run these commands in your terminal:

```bash
# Add the remote repository (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/filescanner.git

# Push the code
git branch -M main
git push -u origin main
```

## Option 2: Install GitHub CLI

1. Download GitHub CLI from: https://cli.github.com/

2. Install and authenticate:
```bash
gh auth login
```

3. Create the repository:
```bash
gh repo create filescanner --private --source=. --push
```

## Repository Settings Recommendations

After creating the repository:

1. **Add Topics**: electron, react, typescript, duplicate-files, file-manager
2. **Set up Branch Protection** (optional): Protect the main branch
3. **Enable Issues**: For bug tracking and feature requests
4. **Add License**: Consider MIT or ISC license

## Continuous Updates

To keep the GitHub repository updated with changes:

```bash
# After making changes
git add .
git commit -m "Your commit message"
git push
```

## Automated Deployment (Optional)

Create `.github/workflows/build.yml` for GitHub Actions:

```yaml
name: Build/release

on:
  push:
    tags:
      - 'v*'

jobs:
  release:
    runs-on: ${{ matrix.os }}

    strategy:
      matrix:
        os: [macos-latest, windows-latest]

    steps:
      - name: Check out Git repository
        uses: actions/checkout@v3

      - name: Install Node.js
        uses: actions/setup-node@v3
        with:
          node-version: 18

      - name: Install dependencies
        run: npm ci

      - name: Build and release
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: npm run dist
```

## Next Steps

1. Create the GitHub repository using one of the options above
2. Push your code to GitHub
3. Set up GitHub Actions for automated builds (optional)
4. Configure releases for distributing the application

## Important Notes

- The repository is set to **private** as specified in the requirements
- Remember to never commit sensitive data or API keys
- Use GitHub Secrets for any sensitive configuration
- Consider setting up GitHub Issues templates for better issue tracking