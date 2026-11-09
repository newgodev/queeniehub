#!/usr/bin/env bash
# Sync this project into the GitHub Pages repository (newgodev/queeniehub).
# The GitHub repo has its own linear history, so we rsync the working tree into a
# clone and commit there. GitHub Actions then rebuilds dist/ and deploys Pages.
set -euo pipefail

SRC="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WORK="${GH_DEPLOY_DIR:-/home/ubuntu/work/gh-deploy}"
REPO="https://github.com/newgodev/queeniehub.git"
MSG="${1:-Update site}"

if [ -d "$WORK/.git" ]; then
  git -C "$WORK" fetch -q origin main
  git -C "$WORK" reset -q --hard origin/main
else
  rm -rf "$WORK"
  git clone -q "$REPO" "$WORK"
fi

# wipe tracked content except .git/.github, then copy source tree with tar
find "$WORK" -mindepth 1 -maxdepth 1 ! -name '.git' ! -name '.github' -exec rm -rf {} +
tar -C "$SRC" \
  --exclude='./.git' --exclude='./.github' --exclude='./node_modules' --exclude='./.manus*' \
  -cf - . | tar -C "$WORK" -xf -

cd "$WORK"
git add -A
if git diff --cached --quiet; then
  echo "No changes to deploy"
  exit 0
fi
git -c user.name="QueenieHub Bot" -c user.email="bot@queeniehub.estate" commit -q -m "$MSG"
git push -q origin main
echo "Pushed to GitHub: $(git rev-parse --short HEAD)"
