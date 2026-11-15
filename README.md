# Growth Radar v2 — iPhone PWA

## New in version 2
- Optional stock/ETF and cryptocurrency quote refresh through a Netlify serverless function
- Auto-refresh every 5 minutes **while the app is open** (optional)
- In-app buy-zone and crypto concentration alerts (not push notifications)
- Quote status and error handling; last known prices retained on failure
- No brokerage access and no automatic trading

## Deploy for live quotes (Netlify)
1. Unzip this package. Keep `index.html`, `app.js`, `v2.js`, `netlify.toml`, and the `netlify/functions/quotes.js` directory together.
2. Create a Netlify site using a Git repository containing these files. For reliable function deployment, use Git-based deployment or Netlify CLI (`netlify deploy --prod`); **drag-and-drop static hosting may not deploy the serverless function**.
3. In Netlify → Site configuration → Environment variables, add `FINNHUB_API_KEY` with a key obtained from Finnhub. Do not add it to JavaScript or a Git repository. Trigger a new deployment.
4. Open `https://YOUR-SITE.netlify.app/.netlify/functions/quotes?symbols=NVDA,BTC`. Check that a JSON `quotes` object is returned. Missing symbols indicate a provider issue or unavailable quote.
5. Open the site in iPhone Safari → Share → Add to Home Screen. In app Settings, leave endpoint `/.netlify/functions/quotes`, enable auto-refresh and in-app alerts, and tap Save.

## Important
- Finnhub free plans may not cover all exchanges, ETFs or redistribution use cases. CoinGecko public API may be rate limited. Confirm plan terms and licenses before public distribution.
- Stock markets close evenings, weekends and holidays. `timestamp` is the provider quote timestamp, not proof of live trading.
- In-app alerts work only when the app is open. **Background push alerts, account sync, and automated AI research are not included**. The separately scheduled ChatGPT research report is not integrated.
- Portfolio and settings are stored on-device. Back up using Settings → Export. Keep the same site URL to retain browser storage when upgrading.
- Previous v1 holdings are preserved if you upgrade at the same origin. Reinstalling on a different domain starts with the default snapshot; import a JSON backup.
- All entry zones are research hypotheses and should be verified before trading. No tax-lot data is stored.

## Local preview
`python3 -m http.server 8000` then open `http://localhost:8000`. The Netlify function is not available in this preview; use `netlify dev` for function testing.
