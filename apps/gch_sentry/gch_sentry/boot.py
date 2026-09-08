import frappe


def boot_session(bootinfo):
    """Inject the Sentry DSN into bootinfo

    Args:
        bootinfo (_type_): _description_
    """
    bootinfo.sentry_dsn = frappe.db.get_single_value("GCH Sentry Settings", "sentry_dsn")
