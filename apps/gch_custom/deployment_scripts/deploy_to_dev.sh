#!/bin/bash
cd ~/gerties.test/apps/gch_custom

git stash

git pull origin main

# List of directories to update
directories=(
    "~/gerties.test/apps/gch_custom"
    "~/gerties.test/apps/gch_insurance"
    "~/gerties.test/apps/gch_messaging"
    "~/gerties.test/apps/gch_middleware"
    "~/gerties.test/apps/gch_queue"
    "~/gerties.test/apps/gch_sentry"
    "~/gerties.test/apps/gch_theme"
     "~/gerties.test/apps/gch_purchases"
)

for dir in "${directories[@]}"; do
    echo "Updating directory: $dir"
    cd "$dir"

    # Stash and pull changes
    git stash
    git pull origin main
done

bench --site apps.gerties.org build
bench --site apps.gerties.org migrate
bench --site apps.gerties.org clear-cache

supervisorctl restart all
