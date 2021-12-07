#!/bin/bash -e
set -e;

export SERVER=locke.brightblock.org
export BUILDER=build-app-stag
export DEPLOYMENT=$1
if [ "$DEPLOYMENT" == "prod" ]; then
  SERVER=chomsky.brightblock.org;
  BUILDER=build-app-prod
fi

printf "\n-----------------------------------------------------------------------------------------------------\n";
printf "Running script: $0 \n";
printf "Deploying to: $SERVER \n";
printf "\n-----------------------------------------------------------------------------------------------------\n";

function __build() {
  pushd $BUILD_PATH
  npm run $BUILDER
  popd;
  echo "Initialisation of $BUILD_PATH complete";
}

function __pushcode() {
  printf "\n- deploying from pipeline build \n";
  rsync -aP -e "ssh  -p 7019" ./dist/* bob@$SERVER:/var/www/rpay
}

BUILD_PATH=./

__build
__pushcode

exit 0;
