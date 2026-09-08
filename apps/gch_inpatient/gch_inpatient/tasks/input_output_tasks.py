import frappe


@frappe.whitelist(allow_guest=True)
def get_current_input_output_charts():
    try:
        current_charts = frappe.get_list(
            "Nursing Input Output Chart",
            filters={"docstatus": 0},
            fields=["name"],
        )

        return current_charts

    except Exception as e:
        frappe.log_error(e, "ERROR: GET CURRENT INPUT OUTPUT CHARTS")
        return []


@frappe.whitelist(allow_guest=True)
def process_input_output_charts(input_output_chart: str):
    try:
        chart = frappe.get_doc("Nursing Input Output Chart", input_output_chart)
        chart.submit()
        return True

    except Exception as e:
        frappe.log_error(e, "ERROR: PROCESS INPUT OUTPUT CHART")
        return False


@frappe.whitelist(allow_guest=True)
def get_prev_charts(inpatient_record: str):
    try:
        prev_charts = frappe.get_list(
            "Nursing Input Output Chart",
            filters={"inpatient_record": inpatient_record},
            fields=["name", "creation"],
            order_by="creation desc",
        )

        return prev_charts

    except Exception as e:
        frappe.log_error(e, "ERROR: GET PREVIOUS CHARTS")
        return []


@frappe.whitelist(allow_guest=True)
def runner():
    success_chart_list = []
    failed_chart_list = []
    current_charts = get_current_input_output_charts()
    for chart in current_charts:
        done = process_input_output_charts(chart.name)
        if done:
            success_chart_list.append(chart.name)
        else:
            failed_chart_list.append(chart.name)

    return {"success": success_chart_list, "failed": failed_chart_list}


@frappe.whitelist(allow_guest=True)
def get_previouse_prescription(io_chart: str):
    try:
        io_chart = frappe.get_doc("Nursing Input Output Chart", io_chart)
        print("IO CHART: ", io_chart.input_output_orders)
        return io_chart.input_output_orders

    except Exception as e:
        frappe.log_error(e, "ERROR: GET PREVIOUS PRESCRIPTION")
        return []
