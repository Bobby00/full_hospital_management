## GCH Messaging

App utility to handle all messaging channels within the GCH ERPNext ecosystem.

All SMS message requests are forwarded to a background task handler

### Set up Instructions

1. Rename `example.env` to `.env`
2. Populate the `.env` with the relevant values i.e `username` and `password`
3. Run tests

i. Background tasks

    bench --site <SITE_NAME> run-tests --module gch_messaging.tasks.test_tasks


#### License

MIT

