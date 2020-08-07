#!/bin/bash -e

PATH_DEPLOY=../radsoc/volumes/www/development/loopbomb
mkdir -p $PATH_DEPLOY

printf "\n-----------------------------------------------------------------------------------------------------\n";
printf "Running script: $0 \n";
printf "Deploying to: $PATH_DEPLOY \n";
printf "\n-----------------------------------------------------------------------------------------------------\n";

function __build() {
  pushd $BUILD_PATH
  npm run build
  popd;
  echo "------------------------------------------------------------------------------";
  echo "Initialisation of $BUILD_PATH complete";
}

rm -rf $PATH_DEPLOY/*

BUILD_PATH=./
__build
cp $BUILD_PATH/dist/rpay-entry*.js $PATH_DEPLOY/.

exit 0;
