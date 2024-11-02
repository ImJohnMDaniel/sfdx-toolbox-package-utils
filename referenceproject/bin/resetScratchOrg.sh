#!/bin/bash

sf org delete scratch --no-prompt --target-org toolboxpu1
sf org create scratch --alias toolboxpu1 --definition-file config/project-scratch-def.json --set-default --wait 20 --duration-days 1
../bin/run.js toolbox package dependencies install --wait 120
