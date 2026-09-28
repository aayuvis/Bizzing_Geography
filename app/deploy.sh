#!/usr/bin/env bash
# deploy.sh — test, build Bizzing Geography, and publish it to the gh-pages branch.
#
# GitHub Pages serves the site from the ROOT of gh-pages, so the build output
# goes there unwrapped, exactly as bizzingindia.com and bizzingfinance do it. .nojekyll stops
# Jekyll eating the assets/ directory.
#
#   ./deploy.sh            build and deploy
#   ./deploy.sh --dry      build only, show what would be published
set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$HERE/.." && pwd)"
WORK="$(mktemp -d)"
trap 'git -C "$ROOT" worktree remove --force "$WORK" 2>/dev/null || true; rm -rf "$WORK"' EXIT

cd "$HERE"
npm test                                # a question with two right answers never ships
# Real photos in GeoGuesser: a Google Maps key, restricted by HTTP referrer to
# aayuvis.github.io, lives OUTSIDE the repo at $GMAPS_KEY_FILE (default
# /root/.gmapskey). With no key the build simply has no real-photo deck.
KEYF="${GMAPS_KEY_FILE:-/root/.gmapskey}"
if [ -f "$KEYF" ]; then export VITE_GMAPS_KEY="$(tr -d '[:space:]' < "$KEYF")"; echo "real photos: key found"; else echo "real photos: no key at $KEYF — building without the photo deck"; fi
npm run build
touch build/.nojekyll

if [ "${1:-}" = "--dry" ]; then
  echo "would publish:"; find build -type f | sed "s|build/|  |"; exit 0
fi

git -C "$ROOT" fetch origin gh-pages --quiet 2>/dev/null || true
if git -C "$ROOT" show-ref --verify --quiet refs/remotes/origin/gh-pages; then
  git -C "$ROOT" worktree add --quiet "$WORK" origin/gh-pages
  git -C "$WORK" checkout --quiet -B gh-pages
else
  git -C "$ROOT" worktree add --quiet --detach "$WORK"
  git -C "$WORK" checkout --quiet --orphan gh-pages
fi

# replace the contents wholesale — stale hashed assets would pile up forever
find "$WORK" -mindepth 1 -maxdepth 1 ! -name .git -exec rm -rf {} +
cp -r build/. "$WORK"/

cd "$WORK"
git add -A

# Bizzing India learnt this one expensively: their publish step quietly did
# nothing once app/voice passed 700 MB, and the script reported success while
# the live site sat four hours behind. A deploy that no-ops and says so
# cheerfully is worse than one that fails. So count what we meant to publish
# against what is actually staged, and refuse to lie.
WANT=$(find "$HERE/build" -type f | wc -l)
GOT=$(git ls-files --cached | wc -l)
if [ "$WANT" -ne "$GOT" ]; then
  echo "REFUSING TO DEPLOY: built $WANT files, staged $GOT." >&2
  echo "Something dropped files on the way in — do not trust a partial publish." >&2
  exit 1
fi
echo "staged $GOT/$WANT files"

if git diff --cached --quiet; then echo "nothing changed"; exit 0; fi
git commit -q -m "Deploy Bizzing Geography

Built from $(git -C "$ROOT" rev-parse --short HEAD) on $(git -C "$ROOT" rev-parse --abbrev-ref HEAD).

Co-Authored-By: Claude <noreply@anthropic.com>"
git push -q origin gh-pages
echo "published → https://aayuvis.github.io/Bizzing_Geography/"
