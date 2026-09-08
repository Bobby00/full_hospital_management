const block_nurse_from_editing = (frm) => {
  if (!frm.doc.inpatient_record || frm.doc.inpatient_record === "") {
    return;
  }
  if (frappe.user.has_role("GCH-Nurse") && !frappe.user.has_role("System Manager") ) {

    // frappe.call({
    //     method: "gch_inpatient.services.get_current_primary_nurse",
    //     args: {
    //       inpatient_record: frm.doc.inpatient_record,
    //     },
    //     callback: function (r) {
    //       console.log(`INFO: ${r.message}`);
    //       console.log(`INFO: ${frappe.session.user}`);
    
    //       if (r.message) {
    //         if (r.message !== frappe.session.user) {
    //           frm.set_read_only();
    //           frm.disable_save();
    //           frm.isPrimaryNurse = false;
    //           cur_frm.isPrimaryNurse = false;
    //           frappe.msgprint(
    //             __(
    //               "You are not allowed to edit this record as you are not the primary nurse."
    //             )
    //           );
    //         } else if (r.message === frappe.session.user) {
    //           // frm.set_read_only(false);
    //           frm.enable_save();
    //           console.log("INFO: You are the primary nurse.");
    //         }
    //       } else {
    //         frm.set_read_only(false);
    //         frm.enable_save();
    //         frm.isPrimaryNurse = true;
    //         cur_frm.isPrimaryNurse = true;
    //         frappe.msgprint(
    //           __(
    //             "You are not allowed to edit this record as you are not the primary nurse."
    //           )
    //         );
    //       }
    //       // frm.reload_doc();
    //     },
    //   });

  }
  
};

const unblock_receiving_nurse = (frm) => {
  if (!frm.doc.inpatient_record || frm.doc.inpatient_record === "") {
    return;
  }
//   frappe.call({
//     method: "gch_inpatient.services.get_receiving_nurse",
//     args: {
//       handsoff: frm.doc.name,
//     },
//     callback: function (r) {
//       console.log(`INFO: ${r.message}`);
//       console.log(`INFO: ${frappe.session.user}`);

//       if (r.message) {
//         if (r.message !== frappe.session.user) {
//           frm.set_read_only();
//           frm.disable_save();

//           frappe.msgprint(
//             __(
//               "You are not allowed to edit this record as you are not the receiving nurse."
//             )
//           );
//         } else if (r.message === frappe.session.user) {
//           // frm.set_read_only(false);
//           frm.enable_save();
//           console.log("INFO: You are the receiving primary nurse.");
//         }
//       } else {
//         frm.set_read_only(false);
//         frm.enable_save();
//         frappe.msgprint(
//           __(
//             "You are not allowed to edit this record as you are not the receiving nurse."
//           )
//         );
//       }
//       // frm.reload_doc();
//     },
//   });
};
