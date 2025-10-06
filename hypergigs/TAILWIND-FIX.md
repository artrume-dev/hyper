# Tailwind CSS Configuration Fix

## Issue
When running `npm run dev`, the following error occurred:

```
[postcss] It looks like you're trying to use `tailwindcss` directly as a PostCSS plugin. 
The PostCSS plugin has moved to a separate package, so to continue using Tailwind CSS 
with PostCSS you'll need to install `@tailwindcss/postcss` and update your PostCSS configuration.
```

Followed by:

```
ReferenceError: module is not defined in ES module scope
This file is being treated as an ES module because it has a '.js' file extension 
and package.json contains "type": "module". To treat it as a CommonJS script, 
rename it to use the '.cjs' file extension.
```

## Root Cause
1. **Tailwind CSS v4** was installed which has a different architecture and requires `@tailwindcss/postcss`
2. The `package.json` has `"type": "module"` which makes all `.js` files ES modules
3. Our config files were using CommonJS syntax (`module.exports`) in `.js` files

## Solution

### 1. Downgrade to Tailwind CSS v3
```bash
npm uninstall tailwindcss
npm install -D tailwindcss@^3.4.0 postcss autoprefixer
```

### 2. Rename Config Files
```bash
mv postcss.config.js postcss.config.cjs
mv tailwind.config.js tailwind.config.cjs
```

### 3. Update components.json
Changed:
```json
"config": "tailwind.config.js"
```
To:
```json
"config": "tailwind.config.cjs"
```

## Why .cjs Extension?
- The `.cjs` extension explicitly tells Node.js to treat the file as CommonJS
- This allows us to use `module.exports` syntax even when `package.json` has `"type": "module"`
- Vite and PostCSS both support `.cjs` config files

## Alternative Solution
We could have converted the configs to ES module syntax:

**postcss.config.js:**
```js
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

**tailwind.config.js:**
```js
export default {
  // ... config
}
```

But `.cjs` is simpler and more compatible with existing tooling.

## Verification
✅ Dev server runs without errors  
✅ Tailwind CSS compiles correctly  
✅ All Tailwind utilities available  
✅ Dark mode support working  
✅ Custom colors and theming functional  

## Files Modified
- `package.json` - Updated Tailwind to v3.4.0
- `postcss.config.js` → `postcss.config.cjs`
- `tailwind.config.js` → `tailwind.config.cjs`
- `components.json` - Updated config path

## Status
✅ **FIXED** - Dev server running on http://localhost:5173
