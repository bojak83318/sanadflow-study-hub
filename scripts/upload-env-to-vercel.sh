#!/bin/bash
# Script to upload .env.local variables to Vercel
set -e

# File to read
ENV_FILE=".env.local"

if [ ! -f "$ENV_FILE" ]; then
    echo "Error: $ENV_FILE not found."
    exit 1
fi

echo "Uploading variables from $ENV_FILE to Vercel Production..."

# Read line by line, ignoring comments and empty lines
grep -v '^#' "$ENV_FILE" | grep -v '^$' | while read -r line; do
    # Split by first = only
    KEY=$(echo "$line" | cut -d '=' -f 1)
    # Value is the rest, checking if it's quoted
    VALUE=$(echo "$line" | cut -d '=' -f 2-)
    
    # Remove surrounding quotes if present
    VALUE=$(echo "$VALUE" | sed -e 's/^"//' -e 's/"$//')

    # Skip GH_TOKEN as it's for local use only
    if [ "$KEY" == "GH_TOKEN" ]; then
        echo "Skipping GH_TOKEN (local only)"
        continue
    fi
    
    if [ -n "$KEY" ]; then
        echo "Adding $KEY..."
        # Pipe value to stdin details: vercel env add <name> <target>
        # Added --force to overwrite if exists
        echo -n "$VALUE" | vercel env add "$KEY" production --force || echo "Failed to add $KEY (might already exist?)"
    fi
done

echo "✅ Environment variables upload complete."
