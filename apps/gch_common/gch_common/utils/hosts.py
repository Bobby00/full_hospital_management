from urllib.parse import urlparse
import frappe

def get_host_url():
    # Assuming you want to use the current request's hostname
    request = frappe.local.request
    host_url = urlparse(request.host_url).netloc
    return host_url