#!/usr/bin/bash

#preps the js file for linking! what a hack, i love it!

rm ./jsin.js

echo "let INARR=\`" | tee -a ./jsin.js
cat ./log | tee -a ./jsin.js
echo "\`;" | tee -a ./jsin.js
