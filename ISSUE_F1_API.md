# F1 API Integration Issues - November 5, 2025

## Problem Summary

The application is unable to fetch F1 race data from external APIs due to CORS policy violations and upstream server timeouts. This affects the "Latest Races" section on the home page and explore pages.

## Current Behavior

- ✅ "Recently Logged" section works (fetches from Firestore)
- ❌ "Latest Races" section fails to load
- ❌ Race cards don't display on home page
- ❌ Console shows CORS errors and 504 Gateway Timeout errors

## Technical Details

### APIs Being Used

1. **OpenF1 API** (Primary)
   - Base URL: `https://api.openf1.org/v1`
   - Status: Currently experiencing upstream timeouts (504 errors)
   - Known Issue: https://github.com/br-g/openf1/issues/278
   - Opened: November 2, 2025
   - Description: "seeing service unavailable / upstream request timeout issues on many endpoints"

2. **Jolpica/Ergast API** (Fallback)
   - Base URL: `https://api.jolpi.ca/ergast/f1`
   - Status: Also experiencing 504 Gateway Timeout errors
   - CORS: Does not include `Access-Control-Allow-Origin` headers

### Error Messages

```
Access to fetch at 'https://api.openf1.org/v1/meetings?year=2025'
from origin 'http://localhost:8080' has been blocked by CORS policy:
No 'Access-Control-Allow-Origin' header is present on the requested resource.

GET https://api.jolpi.ca/ergast/f1/2025.json net::ERR_FAILED 504 (Gateway Time-out)
```

## Root Causes

1. **OpenF1Infrastructure Issues**
   - Server-side timeouts on OpenF1's backend
   - When API times out (504), CORS headers are not sent
   - Browser blocks the response due to missing CORS headers

2. **Jolpica API Issues**
   - Also experiencing 504 Gateway Timeouts
   - No CORS headers on error responses
   - Browser blocks all requests

3. **CORS Proxy Limitations**
   - Tried multiple CORS proxies:
     - `corsproxy.io` - requires authorization for domain
     - `api.codetabs.com` - slow/unreliable
     - `api.allorigins.win` - currently in use, but also timing out

## Current Implementation

### Retry Strategy
```typescript
// Try OpenF1 first (2 second timeout)
// If fails -> Try Jolpica with CORS proxy (10 second timeout)
// If both fail -> Return empty array
```

### Code Location
- `src/services/f1Api.ts` - API integration logic
- `src/pages/Index.tsx` - Home page data loading
- `src/pages/Explore.tsx` - Explore page data loading

## Attempted Solutions

1. ✅ Added CORS proxy for OpenF1
2. ✅ Added CORS proxy for Jolpica
3. ✅ Implemented timeout mechanisms (2s for OpenF1, 10s for Jolpica)
4. ✅ Added proper error handling to prevent blocking UI
5. ✅ Made winner fetching non-blocking
6. ✅ Set `currentRaces([])` when APIs fail to show "No races available"

## Remaining Issues

- Both primary APIs are experiencing infrastructure problems
- CORS proxies add latency and are unreliable
- No immediate solution until upstream APIs are fixed

## Proposed Solutions

### Short Term (Workaround)

1. **Use Historical Data Fallback**
   - Try 2024 season data if 2025 fails
   - Cache successful API responses in localStorage
   - Show cached data with timestamp

2. **Backend Proxy (Recommended)**
   - Create a simple backend proxy endpoint
   - Avoids CORS issues entirely
   - Can implement caching and retry logic
   - Example:
   ```javascript
   // Express.js
   app.get('/api/f1/:year', async (req, res) => {
     const data = await fetch(`https://api.jolpi.ca/ergast/f1/${req.params.year}.json`);
     res.json(await data.json());
   });
   ```

3. **Use Alternative APIs**
   - Check if official F1 API has public endpoints
   - Look for other F1 data providers with better CORS support

### Long Term

1. **Self-Hosted Data**
   - Scrape/import F1 race calendar data
   - Store in Firestore
   - Update manually/periodically
   - Eliminates dependency on external APIs

2. **Hybrid Approach**
   - Use Firestore for race calendar (reliable)
   - Use external APIs only for live telemetry/results
   - Reduces external API dependency

## Monitoring

- OpenF1 GitHub issue: https://github.com/br-g/openf1/issues/278
- Check API status periodically
- Monitor when infrastructure issues are resolved

## Files Modified

- `src/services/f1Api.ts` - API integration with CORS proxy
- `src/pages/Index.tsx` - Added logging and error handling
- `src/index.css` - No changes needed

## Testing

To test when APIs are working again:

1. Check browser console for:
   - `[F1 API] Fetching via AllOrigins proxy: ...`
   - `[Index] getCurrentSeasonRaces returned: X races`
   - `[Index] Setting currentRaces: X`

2. Verify race cards display on home page
3. Verify explore page shows all races

## Status

**Current Status:** ⏸️ **Blocked by external API infrastructure issues**

**Next Steps:**
1. Monitor OpenF1 GitHub issue #278 for resolution
2. Consider implementing backend proxy as interim solution
3. Evaluate self-hosted race calendar data as long-term solution

---

**Date Created:** November 5, 2025
**Last Updated:** November 5, 2025
**Priority:** High
**Impact:** Users cannot see current F1 race calendar
**Workaround:** "Recently Logged" section still works (uses Firestore)
