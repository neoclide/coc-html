#! /bin/sh

set -e
[ "$TRACE" ] && set -x

version=$(json version < package.json)
git add .
git commit -a -m "Release $version"
git tag -a "$version" -m "Release $version"
git push --tags
git push
mkdir -p .release/lib/server
cp -r jquery.d.ts Readme.md .release
cat package.json | json -e 'this.dependencies={"typescript": "^3"};this.scripts={}' > .release/package.json
webpack --config webpack.config.js
webpack --config webpack.server.config.js
cd .release && yarn install --prod && npm publish
