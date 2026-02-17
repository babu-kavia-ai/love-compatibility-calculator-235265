#!/bin/bash
cd /tmp/kavia/workspace/code-generation/love-compatibility-calculator-235265/love_calculator_frontend
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

