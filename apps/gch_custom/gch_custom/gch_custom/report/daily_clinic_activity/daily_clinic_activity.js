frappe.query_reports["Daily Clinic Activity"] = {
    "filters": [
        {
            "fieldname": "from_date",
            "fieldtype": "Date",
            "label": "From Date",
            "default": frappe.datetime.now_date()
        },
        {
            "fieldname": "to_date",
            "fieldtype": "Date",
            "label": "To Date",
            "default": frappe.datetime.now_date()
        },
    ]
}