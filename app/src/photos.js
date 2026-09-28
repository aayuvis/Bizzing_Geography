/* photos.js — real Street View photos for GeoGuesser, and the rules round them.

   The photos come from Google, live, into the child's browser: that is a
   request to a third party, so it happens ONLY when both are true —
     · a Maps key was built in (VITE_GMAPS_KEY; restricted by HTTP referrer
       to aayuvis.github.io, so a copied key is useless elsewhere), and
     · a grown-up has switched real photos on (household.parent.streetview).
   Otherwise the app makes no request to anyone, as the privacy page says.
   Google's terms do not allow storing their images, so none is stored. */

export const GKEY = (import.meta.env && import.meta.env.VITE_GMAPS_KEY) || '';
export const photosOn = (h) => !!(GKEY && h && h.parent && h.parent.streetview);

/* One view of a place: a heading (0 north, 90 east…) and a field of view. */
export function svUrl(at, heading = 0, key = GKEY) {
  return `https://maps.googleapis.com/maps/api/streetview?size=640x400&location=${at[0]},${at[1]}` +
    `&radius=5000&source=outdoor&heading=${heading}&fov=90&pitch=0&return_error_code=true&key=${encodeURIComponent(key)}`;
}
