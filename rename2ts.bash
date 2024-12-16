#!/bin/bash

# Recursively rename all .js files to .ts
find src -type f -name "*.js" -exec bash -c 'mv "$0" "${0%.js}.ts"' {} \;

# Delete all original .js files
find src -type f -name "*.js" -exec rm {} \;

echo "Converted all .js files to .ts and deleted the .js files."
