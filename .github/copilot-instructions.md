# Copilot Instructions for SCC App (React Native)

## Project Overview
- This is a React Native app for displaying and analyzing daily and monthly machine data, including D-Frost events, from Google Sheets.
- Main screens: Home, CheckData (single day), RangeData (date range), Monthly (monthly summary).
- Data is fetched from Google Sheets using public CSV export URLs, with each sheet named by date (e.g., `YYYY-MM-DD`).
- UI uses Kanit font, Ionicons, and modern dark/green styling.

## Key Files & Structure
- `App.js`: Main entry, navigation (Stack/Tab), all screens defined here.
- `assets/`: Images and fonts (e.g., logo, ad images).
- No backend/server code; all data is fetched client-side from Google Sheets.

## Data Fetching Patterns
- Data is fetched per day (sheet) using:
  `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${sheetName}`
- For monthly summary, loop through all days in the selected month and aggregate results.
- Sheets may not exist for all dates; handle missing sheets gracefully (show error or empty state).

## UI/UX Conventions
- Home screen is always centered, with animated logo and pop-up ad modal on entry.
- Bottom Tab Navigation is used for main screens; tab labels are hidden, icons only.
- Date pickers restrict selection to available data range (minimum/maximum date).
- All screens use consistent dark/green theme and Kanit font.

## Developer Workflow
- No custom build/test scripts; standard React Native workflow applies.
- To add a new screen, define it in `App.js` and add to Tab Navigator.
- To change Google Sheet source, update `SHEET_ID` in `App.js`.
- For new data columns, update table rendering and parsing logic in each screen.

## Patterns & Examples
- Data parsing uses PapaParse for CSV.
- Error handling: If fetch fails or sheet is missing, set error state and show message.
- Animation: Home logo uses Animated API for entry effect.
- Modal: Ad image shown via React Native Modal on Home entry/focus.

## External Dependencies
- `react-native`, `@react-navigation/native`, `@react-navigation/bottom-tabs`, `@react-navigation/native-stack`, `react-native-vector-icons/Ionicons`, `@expo-google-fonts/kanit`, `papaparse`, `@react-native-community/datetimepicker`.

## Example: Fetching Daily Data
```js
const fetchToday = async () => {
  const sheetName = getTodaySheet();
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${sheetName}`;
  // ...fetch and parse logic...
};
```

## Example: Monthly Aggregation
```js
for (let day = 1; day <= daysInMonth; day++) {
  // build sheetName for each day, fetch, and aggregate D-Frost
}
```

---

If any conventions or workflows are unclear, please ask for clarification or provide feedback to improve these instructions.
