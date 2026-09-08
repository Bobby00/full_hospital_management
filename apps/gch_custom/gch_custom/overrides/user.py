import frappe
from frappe.core.doctype.user.user import User
from frappe.desk.notifications import clear_notifications


class GCHUser(User):
    ...

    # def on_update(self):
    #     # clear new password
    #     self.share_with_self()
    #     clear_notifications(user=self.name)
    #     frappe.clear_cache(user=self.name)
    #     now=frappe.flags.in_test or frappe.flags.in_install
    #     # self.send_password_notification(self.__new_password)
    #     frappe.enqueue(
    #         'frappe.core.doctype.user.user.create_contact',
    #         user=self,
    #         ignore_mandatory=True,
    #         now=now
    #     )
    #     if self.name not in ('Administrator', 'Guest') and not self.user_image:
    #         frappe.enqueue('frappe.core.doctype.user.user.update_gravatar', name=self.name, now=now)

    #     # Set user selected timezone
    #     if self.time_zone:
    #         frappe.defaults.set_default("time_zone", self.time_zone, self.name)

    #     if self.has_value_changed('allow_in_mentions') or self.has_value_changed('user_type'):
    #         frappe.cache().delete_key('users_for_mentions')

    #     if self.has_value_changed('enabled'):
    #         frappe.cache().delete_key('enabled_users')
    #     super().on_update()
