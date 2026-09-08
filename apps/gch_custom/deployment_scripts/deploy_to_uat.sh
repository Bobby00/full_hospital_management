#!/bin/bash
cd ~/gerties.uat/apps/gch_custom

git stash

git pull origin main

# List of directories to update
directories=(
    "~/gerties.uat/apps/gch_custom"
    "~/gerties.uat/apps/gch_insurance"
    "~/gerties.uat/apps/gch_messaging"
    "~/gerties.uat/apps/gch_middleware"
    "~/gerties.uat/apps/gch_queue"
    "~/gerties.uat/apps/gch_sentry"
    "~/gerties.uat/apps/gch_theme"
    "~/gerties.test/apps/gch_purchases"
)

for dir in "${directories[@]}"; do
    echo "Updating directory: $dir"
    cd "$dir"

    # Stash and pull changes
    git stash
    git pull origin main
done

bench --site gerties.uat build
bench --site gerties.uat migrate
bench --site gerties.uat clear-cache

supervisorctl restart all
