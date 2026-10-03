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

# ---------------------------------------------------------------- the gatekeeper
# Two chats once deployed this site from two branches: each publish replaced gh-pages
# wholesale, so the second one silently erased the first one's work (the Play tab vanished
# under My Feed). So before anything is built, the deploy proves three things:
#   1. NOTHING LIVE IS ERASED — the commit the live site was built from (stamped in every
#      gh-pages commit as "Built from <sha>") must already be inside what we are deploying.
#   2. ONLY COMMITTED WORK SHIPS — a dirty tree would publish a site no commit can rebuild.
#   3. THE SOURCE IS ON GITHUB — HEAD must be pushed, so anyone can rebuild what is live.
# It refuses rather than warns. Merge the other work in, commit, push, then deploy.
if [ "${1:-}" != "--dry" ]; then
  git -C "$ROOT" fetch origin --quiet
  if [ -n "$(git -C "$ROOT" status --porcelain -- app)" ]; then
    echo "REFUSING TO DEPLOY: app/ has uncommitted changes. Commit (and push) first — the live site must be a commit." >&2
    git -C "$ROOT" status --short -- app | head -10 >&2; exit 1
  fi
  if [ -z "$(git -C "$ROOT" branch -r --contains HEAD 2>/dev/null)" ]; then
    echo "REFUSING TO DEPLOY: HEAD ($(git -C "$ROOT" rev-parse --short HEAD)) is not on GitHub. Push it first." >&2; exit 1
  fi
  if git -C "$ROOT" show-ref --verify --quiet refs/remotes/origin/gh-pages; then
    LIVE=$(git -C "$ROOT" log -1 --format=%B origin/gh-pages | sed -n 's/^Built from \([0-9a-f]\{7,40\}\).*/\1/p' | head -1)
    if [ -z "$LIVE" ]; then
      echo "REFUSING TO DEPLOY: the live site's last commit does not say what it was built from, so this deploy cannot prove it keeps it." >&2; exit 1
    fi
    if ! git -C "$ROOT" cat-file -e "$LIVE^{commit}" 2>/dev/null; then
      echo "REFUSING TO DEPLOY: the live site was built from $LIVE, which is not in this checkout. Fetch and merge the branch it came from." >&2; exit 1
    fi
    if ! git -C "$ROOT" merge-base --is-ancestor "$LIVE" HEAD; then
      echo "REFUSING TO DEPLOY: the live site was built from $LIVE, which is NOT inside HEAD — deploying would erase it." >&2
      echo "  live came from: $(git -C "$ROOT" branch -r --contains "$LIVE" | tr -d ' ' | paste -sd' ')" >&2
      echo "  merge it first:  git merge $LIVE   (then test, commit, push, deploy)" >&2
      git -C "$ROOT" log --oneline "HEAD..$LIVE" | head -8 | sed 's/^/    missing: /' >&2; exit 1
    fi
    echo "gatekeeper: live ($LIVE) is inside HEAD — nothing live is erased"
  fi
  # not a refusal, but said out loud: work on other branches that this deploy does not carry
  for b in $(git -C "$ROOT" branch -r --format='%(refname:short)' | grep -v -e '/HEAD$' -e '/gh-pages$'); do
    n=$(git -C "$ROOT" rev-list --count "HEAD..$b" -- app 2>/dev/null || echo 0)
    if [ "$n" -gt 0 ]; then echo "note: $b has $n commit(s) touching app/ that this deploy does not include"; fi
  done
fi

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
