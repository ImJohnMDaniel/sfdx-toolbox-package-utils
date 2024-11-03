#!/bin/bash

devhub_org_alias=$1

devhub_string=blue

if ! [ -z "$devhub_org_alias" ]
  then
    echo devhub_org_alias is $devhub_org_alias
    devhub_string="--target-dev-hub $devhub_org_alias"
else
    echo devhub_org_alias is not specified
    devhub_string=""
fi

sf org delete scratch --no-prompt --target-org toolboxpu1
sf org create scratch --alias toolboxpu1 --definition-file config/project-scratch-def.json --set-default --wait 20 --duration-days 1 $devhub_string
# ../bin/run.js toolbox package dependencies install $devhub_string
