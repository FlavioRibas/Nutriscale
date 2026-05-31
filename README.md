# NutriScale MVP - Personal Testing Package

A GitHub-ready MVP for personal testing of the first version of NutriScale.

## Current MVP Scope

This package focuses on the basics only:

- Add recipes manually
- Upload/scan recipe images using local OCR via Tesseract.js
- Standardize recipes into:
  - title
  - meal category
  - servings
  - ingredients
  - preparation steps
  - notes
- Custom meal categories
- Search recipe catalogue
- Select multiple recipes
- Generate a consolidated shopping list
- Estimate commercial buying quantities
- Local browser storage for personal testing

## Not Included Yet

These are future modules:

- User accounts
- Cloud database
- Google Vision API
- Nutrition/macros
- AI-generated videos
- Public user catalogue
- iOS/Android app-store deployment

## How to Run Locally

1. Install Node.js from https://nodejs.org
2. Open this folder in VS Code
3. In the terminal, run:

```bash
npm install
npm run dev
```

4. Open the local URL shown in the terminal, usually:

```bash
http://localhost:5173
```

## How to Upload to GitHub

1. Create a new GitHub repository, for example `nutriscale-mvp`.
2. Extract this ZIP file.
3. Upload all extracted files to the repository.
4. Commit changes.
5. Optional: connect the repository to Vercel or Netlify for a free web preview.

## Notes

The OCR in this MVP runs directly in the browser using Tesseract.js. This means no Google Cloud account is required for initial testing.

For a higher quality OCR version, the next step is replacing or supplementing Tesseract.js with Google Vision API through a secure backend function.
