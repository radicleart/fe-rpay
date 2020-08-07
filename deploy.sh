#!/bin/bash -e

PATH_DEPLOY=../radsoc/volumes/www/development

printf "\n-----------------------------------------------------------------------------------------------------\n";
printf "Running script: $0 \n";
printf "Deploying to: $PATH_DEPLOY \n";
printf "\n-----------------------------------------------------------------------------------------------------\n";

pwd
npm run build
mkdir -p $PATH_DEPLOY
cp dist/rpay-entry*.js $PATH_DEPLOY/assets/.
cp dist/rpay-entry*.js $PATH_DEPLOY/loopbomb/.

exit 0;
