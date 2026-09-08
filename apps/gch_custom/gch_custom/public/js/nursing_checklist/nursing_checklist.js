// Get all required checklist Templates in a given procedure template

const get_all_required_checklists = async (procedure_template) => {
  let required_checklist;
  await frappe
    .call({
      method: "gch_custom.services.rest.get_all_required_checklists",
      args: { procedure_template },
    })
    .done((r) => {
      required_checklist = r.message;
    });
  return required_checklist;
};

frappe.ui.form.on("Clinical Procedure", {
  // onload(frm) {
  //     const procedure_template = frm.doc.procedure_template;
  //     const required_checklist_list = await get_all_required_checklists(
  //       procedure_template
  //     );

  // },
  procedure_template: async (frm) => {
    const procedure_template = frm.doc.procedure_template;
    const required_checklist_list = await get_all_required_checklists(
      procedure_template
    );

    // if(required_checklist_list?.length >0) return

    frm.fields_dict["completed_nursing_checklist"].grid.get_field(
      "checklist"
    ).get_query = function (doc, cdt, cdn) {
      var child = locals[cdt][cdn];
      //console.log(child);

      return {
        filters: [
          [
            "checklist_name",
            "in",
            required_checklist_list.map((item) => item.template_name),
          ],
        ],
      };
    };

    let message = "";

    for (let index = 0; index < required_checklist_list.length; index++) {
      const list_name = required_checklist_list[index].template_name;
      message += `<li>${list_name}</li>`;
    }
    if (message != "") {
      frappe.msgprint({
        title: __("Required Nursing Checklists"),
        indicator: "red",
        message: `<ul>${message}</ul>`,
      });
    }

    // get checklist
  },
  validate: async (frm) => {
    // if all the checklist are done
    const procedure_template = frm.doc.procedure_template;
    const completed_nursing_checklist = frm.doc.completed_nursing_checklist;
    const required_checklist_list = await get_all_required_checklists(
      procedure_template
    );
    if (required_checklist_list?.length > 0) {
      if (!completed_nursing_checklist || completed_nursing_checklist < 0) {
        let message = "";

        for (let index = 0; index < required_checklist_list.length; index++) {
          const list_name = required_checklist_list[index].template_name;
          message += `<li>${list_name}  <span class="indicator-pill whitespace-nowrap orange">Not Done<span></li>`;
        }
        validated = false;
        frappe.msgprint({
          title: __("Required Nursing Checklists"),
          indicator: "red",
          message: `<ul>${message}</ul>`,
        });
      }
      if (completed_nursing_checklist?.length <= procedure_template?.length) {
        // check if the nursing tasks are completed

        let complete = true;
        let message = "";

        for (let index = 0; index < required_checklist_list.length; index++) {
          const template = required_checklist_list[index];

          let is_done = completed_nursing_checklist.some(
            (item) =>
              item.checklist_template == template.nursing_checklist_template
          );

          message += `<li>${template.template_name} ${
            !is_done
              ? '<span class="indicator-pill whitespace-nowrap orange">Not Done<span>'
              : '<span class="indicator-pill whitespace-nowrap green">completed<span>'
          }</li>`;
          if (!is_done) {
            complete = false;
          }
        }

        if (!complete) {
          validated = false;
          frappe.msgprint({
            title: __("Required Nursing Checklists"),
            indicator: "red",
            message: `<ul>${message}</ul>`,
          });
          return;
        }
        frappe.msgprint({
          title: __("Required Nursing Checklists"),
          indicator: "green",
          message: `<ul>${message}</ul>`,
        });
      }
      // check if
      console.log("hey");
    }
  },
});
