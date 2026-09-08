
__version__ = '0.0.1'
import frappe 
frappe.utils.html_utils.acceptable_elements = frappe.utils.html_utils.acceptable_elements \
+ ["iframe"]
frappe.utils.html_utils.acceptable_attributes = frappe.utils.html_utils.acceptable_attributes \
+ ["data-toggle"]


from gch_custom.overrides.ldap import GCHLDAPSettings
# from frappe import _, get_context

def update_context(context):
    """
    Inject overridden `ldap_settings` into context
    """
    context.update({
        "ldap_settings": GCHLDAPSettings.get_ldap_client_settings()
    })
    return context

def override_ldap_settings():
    from frappe.integrations.doctype.ldap_settings.ldap_settings import LDAPSettings
    # print(frappe._dict())
    LDAPSettings = GCHLDAPSettings
    # get_context({})


override_ldap_settings()