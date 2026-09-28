/* geo.js — the country data, and the arithmetic of a round Earth.

   Everything here is read from data/countries.js, which tools/geo/build.mjs
   generates from open sources. Nothing about a real country is typed into
   this file by hand. */

import { COUNTRIES } from './data/countries.js';
import { STATES } from './data/states.js';
import { INDIA } from './data/india.js';

export { COUNTRIES, STATES, INDIA };
export const byCc = Object.fromEntries(COUNTRIES.map((c) => [c.cc, c]));
/* The 195: UN members plus the two observer states. Only these are quizzed. */
export const QUIZ = COUNTRIES.filter((c) => c.quiz);

export const CONTINENTS = [
  { id: 'Africa', glyph: '🦁', view: [-25, -38, 60, 40] },
  { id: 'Asia', glyph: '🐼', view: [25, -12, 150, 60] },
  { id: 'Europe', glyph: '🏰', view: [-25, 34, 45, 72] },
  { id: 'North America', glyph: '🦅', view: [-170, 5, -50, 75] },
  { id: 'South America', glyph: '🦙', view: [-85, -57, -32, 14] },
  { id: 'Oceania', glyph: '🦘', view: [110, -50, 180, 5] },
  { id: 'Antarctica', glyph: '🐧', view: [-180, -90, 180, -60] },
];
export const OCEANS = [
  { id: 'Pacific', at: [0, -150], blurb: 'The largest and deepest ocean — bigger than all the land on Earth put together.' },
  { id: 'Atlantic', at: [15, -35], blurb: 'The second largest, between the Americas and Europe and Africa. It is getting wider every year.' },
  { id: 'Indian', at: [-20, 78], blurb: 'The warmest ocean, south of India, between Africa and Australia.' },
  { id: 'Southern', at: [-62, 20], blurb: 'The ocean that circles Antarctica.' },
  { id: 'Arctic', at: [85, 0], blurb: 'The smallest and shallowest, around the North Pole, much of it frozen.' },
];
export const OCEAN_SRC = ['NOAA — “How many oceans are there?”', 'National Geographic — “Ocean”'];

export const inCont = (cont) => QUIZ.filter((c) => c.cont === cont);
export const capOf = (c) => c.cap[0];
export const capsText = (c) => c.cap.join(', ');

/* The big, well-known countries a six-year-old can find on a world map —
   by area (a country you cannot see cannot be tapped). */
export const bigEnough = (c, km2) => c.area >= km2;

/* ------------------------------------------------------------ a round Earth */
const R_KM = 6371;
const rad = (d) => (d * Math.PI) / 180;
/* great-circle distance, in km */
export function haversine([la1, lo1], [la2, lo2]) {
  const dLa = rad(la2 - la1), dLo = rad(lo2 - lo1);
  const a = Math.sin(dLa / 2) ** 2 + Math.cos(rad(la1)) * Math.cos(rad(la2)) * Math.sin(dLo / 2) ** 2;
  return 2 * R_KM * Math.asin(Math.min(1, Math.sqrt(a)));
}
export const hemiNS = (lat) => (lat >= 0 ? 'Northern' : 'Southern');
export const hemiEW = (lng) => (lng >= 0 ? 'Eastern' : 'Western');

/* 0° 12' N — the way an atlas writes a coordinate */
export function fmtLat(lat) { return `${Math.abs(lat).toFixed(0)}° ${lat >= 0 ? 'N' : 'S'}`; }
export function fmtLng(lng) { return `${Math.abs(lng).toFixed(0)}° ${lng >= 0 ? 'E' : 'W'}`; }
export const fmtKm = (km) => (km >= 100 ? Math.round(km).toLocaleString('en-US') : km.toFixed(0)) + ' km';
export const fmtArea = (a) => a.toLocaleString('en-US') + ' km²';

/* The compass, in order. */
export const POINTS8 = ['north', 'north-east', 'east', 'south-east', 'south', 'south-west', 'west', 'north-west'];
/* Initial bearing from a to b, degrees clockwise from north. */
export function bearing([la1, lo1], [la2, lo2]) {
  const y = Math.sin(rad(lo2 - lo1)) * Math.cos(rad(la2));
  const x = Math.cos(rad(la1)) * Math.sin(rad(la2)) - Math.sin(rad(la1)) * Math.cos(rad(la2)) * Math.cos(rad(lo2 - lo1));
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}
export const point8 = (deg) => POINTS8[Math.round(deg / 45) % 8];
