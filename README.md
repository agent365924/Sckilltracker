# PVP Log - GitHub Pages Version

A simple HTML/JavaScript version of the PVP Log that runs on GitHub Pages without any build process.

## Files

- `index.html` - Main HTML file with embedded CSS and JavaScript
- `pvpData.js` - Your PVP log data in JavaScript format

## How to Use

### Option 1: Open Locally
1. Simply open `index.html` in your web browser
2. All features work offline!

### Option 2: Deploy to GitHub Pages
1. Create a new GitHub repository
2. Upload both `index.html` and `pvpData.js` to the repository
3. Go to Settings > Pages
4. Select "Deploy from main branch"
5. Your site will be available at `https://yourusername.github.io/your-repo-name/`

## Features

All the same features as the React version:
- ✅ Display PVP log with kills/deaths/neutral
- ✅ Statistics (Kills, Deaths, K/D Ratio)
- ✅ Add new entries via modal form
- ✅ Delete entries (hover over row)
- ✅ Sort by any column (click header)
- ✅ Save data to JSON file
- ✅ Load data from JSON file
- ✅ Clean Apple-inspired design
- ✅ Responsive layout

## Updating Data

To update the initial data, edit `pvpData.js`:
1. Replace the array with your JSON data
2. Make sure it starts with `let entries = ` and ends with `;`

## Browser Compatibility

Works in all modern browsers:
- Chrome/Edge
- Firefox
- Safari
- Opera

No build tools, no dependencies, no npm required!
