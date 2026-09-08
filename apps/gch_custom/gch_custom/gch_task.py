import frappe

import datetime


# CRON JOB FOR AUTO CLOSING ENCOUNTERS THAT ARE OPEN FOR MORE THAN 24 HRS
def cron():

    # bill_list = frappe.get_all(
    #     "Sales Invoice", fields=['name', 'modified', "modified_by"], filters={"modified_by" : "API automated", "docstatus" : '1'}
    # )

    # encounter_list = frappe.get_all(
    #     "Patient Encounter", fields=['name', 'modified', "modified_by"], filters={"modified_by": "API automated"}
    # )

    # # for bill in bill_list:
    # #     print("\n\n", 'bill-----', bill, "\n\n\n")
    # #     lastv_details = bill.modified

    # #     timenow = datetime.datetime.now()

    # #     dur_diff = (timenow - lastv_details).total_seconds()

    # #     if dur_diff > 300:
    # #         frappe.db.set_value('Sales Invoice', bill.name, 
    # #         {
    # #         'docstatus': '0',
    # #         'modified_by': 'API automated'
    # #         })
    # #         print("BILL yes", bill.name)



    # for encounter in encounter_list:
    #     print("\n\n", encounter, "\n\n\n")
    
    #     lastv_details = encounter.modified

    #     timenow = datetime.datetime.now()

    #     dur_diff = (timenow - lastv_details).total_seconds()

    #     if dur_diff > 300:
    #         frappe.db.set_value('Patient Encounter', encounter.name, 
    #         {
    #         'modified_by': 'API automated',        
    #         'workflow_state': 'Pending Reception',
    #         'docstatus': '0',
    #         })
    #         print("ENCOUNTER yes", encounter.name)



    # print(bill_list, "\n ENCOUNTERS ........... \n")
    ...
    