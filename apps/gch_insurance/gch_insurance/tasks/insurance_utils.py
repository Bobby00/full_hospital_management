import frappe


def suspend_insurance_payer(insurance_company, suspend):

    # this job takes a long time to process
    categories_under_payer = get_categories_with_payer(insurance_company)

    for category_name in categories_under_payer:

        frappe.enqueue(
            "gch_insurance.tasks.insurance_utils.suspend_category",
            category_name=category_name,
            suspend=suspend,
        )
    is_active = 1

    if suspend == True:
        is_active = 0
    doc = frappe.get_doc("Insurance Company", insurance_company)
    doc.is_active = is_active
    doc.save(ignore_permissions=True)

    frappe.log_error(
        f"Insurance Payer {insurance_company} has been suspended",
        "INFO: Insurance Payer has been suspended",
    )
    frappe.publish_realtime(
        "msgprint",
        f"Suspending {len(categories_under_payer)} categories under {insurance_company}",
    )
    return True


def get_categories_with_payer(insurance_company):
    try:
        list_of_categories = frappe.get_all(
            "Insurance Category",
            filters={"outpatient_insurance": insurance_company},
            fields=["name"],
            pluck="name",
        )
        return list_of_categories
    except Exception as e:
        frappe.log_error(
            frappe.get_traceback(), f"Error getting categories for {insurance_company}"
        )
        return []


def suspend_category(category_name, suspend):
    try:
        _suspend = 0
        if suspend == True:
            _suspend = 1
        doc = frappe.get_doc("Insurance Category", category_name)
        doc.suspend = _suspend
        doc.save(ignore_permissions=True)
        # frappe.log_error(
        #     f"Insurance Category {category_name} has been suspended",
        #     "INFO: Insurance Category has been suspended",
        # )
        return True
    except Exception as e:
        frappe.log_error(
            frappe.get_traceback(), f"Error suspending category {category_name}"
        )
        return False


def check_payer_exists(insurance_company):
    try:
        return frappe.db.exists("Insurance Company", insurance_company)
    except Exception as e:
        frappe.log_error(
            frappe.get_traceback(),
            f"Error checking if payer exists for {insurance_company}",
        )
        return False


@frappe.whitelist(allow_guest=True)
def enqueue_suspend_insurance_payer(insurance_company, suspend):

    frappe.log_error(
        f"Enqueuing suspend_insurance_payer for {insurance_company} with suspend {suspend}",
        "INFO: Enqueuing suspend_insurance_payer",
    )

    payer_exists = check_payer_exists(insurance_company)

    if not payer_exists:
        return False

    frappe.enqueue(
        "gch_insurance.tasks.insurance_utils.suspend_insurance_payer",
        insurance_company=insurance_company,
        suspend=suspend,
    )
    return True


@frappe.whitelist(allow_guest=True)
def check_copayment_exists(insurance_catergory):
    try:
        # "Copayment Detail"
        copayment_list = frappe.get_all(
            "Copayment Detail",
            filters={"parent": insurance_catergory},
            fields=["name"],
            pluck="name",
        )

        if len(copayment_list) >= 1:
            return {
                "code": 200,
                "message": "Remember to collect copayment from patient",
            }
        return {
            "code": 404,
            "message": "No copayment found for this insurance category",
        }
    except Exception as e:

        return {
            "code": 500,
            "message": f"No copayment found for {insurance_catergory}",
        }


@frappe.whitelist(allow_guest=True)
def change_category_name(old_category_name, new_name):
    try:
        old_doc = frappe.get_doc("Insurance Category", old_category_name)

        new_doc = frappe.new_doc("Insurance Category")
        new_doc.update(old_doc.as_dict())
        new_doc.name1 = new_name
        new_doc.save(ignore_permissions=True)
        old_doc.suspend = 1
        old_doc.save(ignore_permissions=True)

        return {
            "code": 200,
            "message": f"Category name changed from {old_category_name} to {new_name}",
            "doc": new_doc.name,
        }
    except Exception as e:
        frappe.log_error(
            frappe.get_traceback(),
            f"Error changing category name from {old_category_name} to {new_name}",
        )
        return {
            "code": 500,
            "message": f"Error changing category name from {old_category_name} to {new_name}",
        }
