#!/usr/bin/env python

from pygrowup import Calculator
from pygrowup import helpers

import datetime
import frappe
from frappe import msgprint, _
import math
from typing import Dict

from datetime import date

from dateutil.relativedelta import relativedelta


# The ``include_cdc`` option will enable CDC measurements for children >5 years.

def get_insurance_line_items(invoice):
    """
    Used to get the current insurance items on an invoices
    """
    try:
        item_list = frappe.db.get_list(
            "Invoice Insurance Item",
            filters={"parent": invoice},
            fields=["item", "preauth_feedback", "preauth_amount", "price", "preauth_amount",
                    "copay_amount", "insured_amount", "bal", "idx", "qty", "rate"],
        )
        current_item_list = []
        if item_list and len(item_list) > 0:
            for item in item_list:
                current_item = frappe.get_doc("Item", item.get("item"))
                current_item_list.append({
                    "item": item.get("item"),
                    "item_name": current_item.item_name,
                    "preauth_feedback": item.get("preauth_feedback"),
                    "preauth_amount": item.get("preauth_amount"),
                    "price": item.get("price"),
                    "preauth_amount": item.get("preauth_amount"),
                    "copay_amount": item.get("copay_amount"),
                    "insured_amount": item.get("insured_amount"),
                    "bal": item.get("bal"),
                    "qty": item.get("qty"),
                    "idx": item.get("idx"),
                    "item_group": current_item.item_group,
                    "doc": current_item,
                    "rate": item.get("rate")
                })
            return current_item_list

        # Get items from sales invoice
        invoice_items = frappe.db.get_list(
            "Sales Invoice Item",
            filters={"parent": invoice},
            fields=["item_code", "item_name", "rate", "idx", "qty"],
        )
        for item in invoice_items:
            current_item = frappe.get_doc("Item", item.get("item_code"))
            current_item_list.append({
                "item": item.get("item_code"),
                "item_name": item.get("item_name"),
                "preauth_feedback": "",
                "preauth_amount": 0,
                "price": item.get("rate"),
                "preauth_amount": 0,
                "copay_amount": 0,
                "insured_amount": item.get("rate"),
                "bal": item.get("rate"),
                "idx": item.get("idx"),
                "qty": item.get("qty"),
                "item_group": current_item.item_group,
                "doc": current_item,
                "rate": item.get("rate")
            })
        return current_item_list
    except Exception as e:
        # print(e)
        frappe.log_error(e, "GET INSURANCE ITEMS ERROR  /erp_slade.py")
        return []


calculator = Calculator(adjust_height_data=True, adjust_weight_scores=True,
                        include_cdc=True, logger_name='pygrowup', log_level='INFO')


@frappe.whitelist(allow_guest=True)
def calculates_zscore(patsdob: str, pgender: str, pweight: float, pheight: float) -> Dict:
    # frappe.msgprint(_("Date of Birth {0}").format(patsdob))

    print(f'percentile dob...{patsdob}')

    pats_obj = datetime.datetime.strptime(patsdob, "%Y-%m-%d").date()
    dob = pats_obj.strftime("%d%m%y")

    my_child = {'date_of_birth': dob, 'sex': pgender,
                'weight': pweight, 'height': pheight}

    valid_date = helpers.get_good_date(my_child['date_of_birth'])
    valid_gender = helpers.get_good_sex(pgender)
    valid_age = helpers.date_to_age_in_months(valid_date[1])

    # frappe.msgprint(_("Age in Months {0} ").format(valid_age))

    # calculate length/height-for-age zscore
    lhfa_zscore = calculator.lhfa(my_child['height'], valid_age, valid_gender)
    print(f'Height-for-age zscore..{lhfa_zscore}')

    lhfa_zscoreperc = z_percentile(lhfa_zscore) * 100
    # print(z_percentile(lhfa_zscoreperc))
    print(f'percentile HFA value...{lhfa_zscoreperc}')

    # calculate weight-for-age zscore
    wfa_zscore = calculator.wfa(my_child['weight'], valid_age, valid_gender)
    print(f'Weight-for-age zscore..{wfa_zscore}')

    wfa_zscoreperc = z_percentile(wfa_zscore) * 100
    # print(z_percentile(wfa_zscoreperc))
    print(f'percentile WFA value...{wfa_zscoreperc}')

    # calculate BMI-for-age zscore
    bfa_zscore = calculator.bmifa(my_child['height'], valid_age, valid_gender)
    print(f'BMI-for-age zscore..{bfa_zscore}')

    bfa_zscoreperc = z_percentile(bfa_zscore) * 100
    print(f'percentile BFA value...{bfa_zscoreperc}')

    response = dict(bfa=bfa_zscoreperc,
                    hfa=lhfa_zscoreperc, wfa=wfa_zscoreperc)
    print(f'Z-Score  values...{response}')

    return response


def z_percentile(z_score):
    return .5 * (math.erf(float(z_score) / 2 ** .5) + 1)

    # print(zptile(z_score))
    # print(f'percentile values.{zptile(z_score)}')


def format_duration(duration: datetime.timedelta) -> str:
    days, hours, minutes, secs = duration.days, duration.seconds // 3600, duration.seconds // 60, duration.seconds % 60

    duration_str = f""

    if days > 0:
        duration_str += f"{days} Days "
    if hours > 0:
        duration_str += f"{hours} Hours "
    if minutes > 0:
        duration_str += f"{minutes} Minutes "
    if secs > 0:
        duration_str += f"{secs} Seconds"

    return duration_str
