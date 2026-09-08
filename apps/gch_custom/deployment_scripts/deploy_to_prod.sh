#!/bin/bash
cd ~/gerties.prod/apps/gch_custom

git stash

git pull origin main

# List of directories to update
directories=(
    "~/gerties.prod/apps/gch_custom"
    "~/gerties.prod/apps/gch_insurance"
    "~/gerties.prod/apps/gch_messaging"
    "~/gerties.prod/apps/gch_middleware"
    "~/gerties.prod/apps/gch_queue"
    "~/gerties.prod/apps/gch_sentry"
    "~/gerties.prod/apps/gch_theme"
)

for dir in "${directories[@]}"; do
    echo "Updating directory: $dir"
    cd "$dir"

    # Stash and pull changes
    git stash
    git pull origin main
done

bench --site egerties.org build
bench --site egerties.org migrate
bench --site egerties.org clear-cache

supervisorctl restart all
