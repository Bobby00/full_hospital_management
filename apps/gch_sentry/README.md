## GCH Sentry

Sends errors and performance data from eGerties to Sentry - [https://sentry.io/organizations/gertrudes-childrens-hospital/issues/](https://sentry.io/organizations/gertrudes-childrens-hospital/issues/). 

## Features

- Sends front-end and backend errors to Sentry
- Performance monitoring (only front-end)
- Sends account email and site when error occurs
- If `frappe.log_error` is called without exception, it takes the message and title and passes that to Sentry

## Setup 

1. Install the app:

```
    bench get-app gch_sentry https://github.com/Gertrude-s-Children-s-Hospital/gch-sentry

    bench --site <SITE_NAME> install-app gch_sentry

    bench --site <SITE_NAME> migrate

    bench --site <SITE_NAME> build

    bench --site <SITE_NAME> clear-cache
```


2. For GCH Sentry to work with the python backend and background jobs some changes are required in Frappe.

You will need to add the below block of code:

i. Within the `handle_exception` function in the `app.py` file (https://github.com/frappe/frappe/blob/version-13/frappe/app.py#L207)

``` 
    def handle_exception(e):
        ...
        ...
        from gch_sentry.utils import handle
        handle()
        return response  # DO NOT ADD THIS LINE. IT IS ALREADY THERE. INCLUDED IT HERE FOR BREVITY AND CONTEXT
```


For frontend errors no changes are needed in Frappe. 

## Configuring Sentry

You need to get the Sentry DSN - [https://sentry.io/settings/gertrudes-childrens-hospital/projects/egertiesprod/keys/](https://sentry.io/settings/gertrudes-childrens-hospital/projects/egertiesprod/keys/) and add it to the `sentry_dsn` field on the `GCH Sentry Settings` DocType.

Alternatively, you could set it up on the `site_config.json` or `common_site_config.json` file like so:

```
{
    "sentry_dsn": "https://<key>:<secret>@sentry.io/<project_id>"
}
```

Adding it to the `site_config.json` file for a site will override the Sentry DSN in the `common_site_config.json` file.


By default GCH Sentry will not log errors if `developer_mode` is set to True. For enabling Sentry in developer mode you must set the `enable_sentry_developer_mode` key as True in the `site_config.json` or `common_site_config.json` file.


## Logging
To capture a log, 

    ```
    from gch_sentry.utils import log

    log({
        "message":"Hello",
        "level":"info",
        "extra":{}
    })
    ```
`level` and `extra` are optional, defaulting to `info` and `{}` respectively.

#### License

MIT