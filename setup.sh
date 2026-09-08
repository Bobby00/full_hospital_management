echo "Setting up environment"

sleep 2

echo "Enter site name: "

read sitename

bench new-site $sitename

sleep 2

echo "Successfully set up new site `$sitename`"

echo "Installing ERPNext"

bench get-app erpnext

echo "Installing erpnext..."

bench --site $sitename install-app erpnext

echo "Fetching GCHMessaging App..."

bench get-app gch_messaging gch_messaging https://github.com/Gertrude-s-Children-s-Hospital/gch-messaging

echo "Setting up GCHMessaging..."

mv apps/gch_messaging/example.env apps/gch_messaging/.env

echo "Installing GCHMessaging..."

bench --site $sitename install-app gch_messaging

sleep 2

echo "Fetching GCHQueue Management App..."

bench get-app gch_queue https://github.com/Gertrude-s-Children-s-Hospital/gch-queue

sleep 2

echo "Installing GCHQueue..."

bench --site $sitename install-app gch_queue

sleep 2

echo "Fetching GCH Midleware App..."

bench get-app gch_middleware https://github.com/Gertrude-s-Children-s-Hospital/gch_middleware.git

sleep 2

echo "Installing GCH Middleware..."

bench --site $sitename install-app gch_middleware

sleep 2

echo "Fetching GCH Custom App..."

bench get-app gch_custom https://github.com/Gertrude-s-Children-s-Hospital/gch-custom.git

sleep 2

echo "Installing GCH Custom App..."

bench --site $sitename install-app gch_custom


