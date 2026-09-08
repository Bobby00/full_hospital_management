from typing import List

import frappe

from .roles import Roles as roles
from .paths import Paths as paths


class LoginUtil:
    @staticmethod
    def _handle_set_station():
        frappe.local.response["home_page"] = paths.SET_STATION_PATH

    @staticmethod
    def _handle_system_manager() -> None:
        """Handle system manager login"""
        frappe.local.response["message"] = "Logged In"
        frappe.local.response["home_page"] = "/app"

    @staticmethod
    def _handle_receptionist() -> None:
        """Handle Receptionist login"""
        frappe.local.response["message"] = "Logged In"
        frappe.local.response["home_page"] = paths.RECEPTION_PATH

    @staticmethod
    def _handle_nurse() -> None:
        """Handle Nurse login"""
        frappe.local.response["message"] = "Logged In"
        frappe.local.response["home_page"] = paths.NURSE_PATH

    @staticmethod
    def _handle_doctor() -> None:
        """Handle Doctor login"""
        frappe.local.response["message"] = "Logged In"
        frappe.local.response["home_page"] = paths.DOCTOR_PATH

    @staticmethod
    def handle_login(user_roles: List[str]) -> None:
        LoginUtil._handle_set_station()
        # if not user_roles:
        #     return
        # if roles.SYSTEM_MANAGER in user_roles:
        #     LoginUtil._handle_system_manager()
        # elif roles.GCH_RECEPTION in user_roles:
        #     LoginUtil._handle_receptionist()
        # elif roles.GCH_NURSE in user_roles:
        #     LoginUtil._handle_nurse()
        # elif roles.GCH_DOCTOR in user_roles:
        #     LoginUtil._handle_doctor()

    @staticmethod
    def on_login(login_manager) -> None:
        user = frappe.session.user
        user_roles = frappe.get_roles(user)
        LoginUtil.handle_login(user_roles)


login_util = LoginUtil()
