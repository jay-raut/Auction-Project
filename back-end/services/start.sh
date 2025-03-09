#!/bin/sh

env-cmd -f ./auction/docker.env node ./auction/server.js &
env-cmd -f ./orders/docker.env node ./orders/server.js &
env-cmd -f ./notification/docker.env node ./notification/server.js &
env-cmd -f ./authentication/docker.env node ./authentication/server.js &

wait