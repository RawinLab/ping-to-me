#!/bin/bash
# Extract accessToken from JSON response
grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4
