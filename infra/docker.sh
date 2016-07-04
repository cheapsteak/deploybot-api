#!/bin/bash
set -euo pipefail
IFS=$'\n\t'

docker build -t deploybot-server .

# If this is not a pull request, update the branch's docker tag.
if [ $TRAVIS_PULL_REQUEST = 'false' ]; then
  docker tag deploybot-server quay.io/ncigdc/deploybot:server \
    && docker push quay.io/ncigdc/deploybot:server;
fi
