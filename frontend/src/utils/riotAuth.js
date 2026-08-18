// frontend/src/utils/riotAuth.js
//
// Shared helper for the "paste the Riot login URL" flow used both when
// adding an account (HomePage) and when refreshing one from Details. Riot's
// web login (auth.riotgames.com/authorize) redirects to a playvalorant.com
// URL with the access_token/id_token in the fragment — this pulls the bare
// access token out for display while the caller keeps the full URL too
// (the backend needs it to extract the id_token for region lookup).

export function extractTokenFromUrl(url) {
  try {
    if (url.includes('playvalorant.com') && url.includes('access_token=')) {
      const urlObj = new URL(url);
      const hash = urlObj.hash;
      if (hash) {
        const params = new URLSearchParams(hash.substring(1));
        const accessToken = params.get('access_token');
        if (accessToken) return accessToken;
      }
    }
    return url;
  } catch (error) {
    return url;
  }
}

// Given whatever the user typed/pasted, returns { riotToken, riotUrl } —
// riotUrl is kept as the full pasted value (needed for the id_token), while
// riotToken is just the bare access token for display/submission.
export function parseRiotAuthInput(value) {
  if (value.includes('playvalorant.com')) {
    return { riotToken: extractTokenFromUrl(value), riotUrl: value };
  }
  return { riotToken: value, riotUrl: value };
}
