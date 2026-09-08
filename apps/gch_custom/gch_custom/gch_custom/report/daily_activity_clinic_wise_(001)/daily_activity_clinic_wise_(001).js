frappe.query_reports["Daily Clinic Activity (001)"] = {
    "filters": [
        {
            "fieldname": "DateSelected",
            "fieldtype": "Date",
            "label": "From Date",
            "default": frappe.datetime.now_date()
        }
    ]
}