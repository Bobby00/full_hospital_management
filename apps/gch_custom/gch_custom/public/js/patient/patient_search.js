frappe.ui.form.on('Patient', {
    refresh: function (frm) {
      frm.fields_dict['kranium_uhid'].$input.on('keydown', function (e) {
        if (e.key === 'Enter' && this.value) {
          e.preventDefault();
          custom_action(frm);
        }
      });
    },
  });
  
  function custom_action(frm) {
    console.log('Enter key pressed and input has a value');
    // Add your custom action logic here
  }
  