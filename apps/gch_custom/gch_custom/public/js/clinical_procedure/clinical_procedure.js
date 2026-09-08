// Get all done checklists given the clinical procedure

const get_procedure_completed_checklists = async (clinical_procedure) => {
  let checklists;
  await frappe
    .call({
      method: "gch_custom.services.rest.get_procedure_completed_checklists",
      args: { clinical_procedure },
    })
    .done((r) => {
      checklists = r.message;
    });
  return checklists;
};

function create_patient_checklist(frm) {
  frappe.route_options = {
    patient: frm.doc.patient,
    patient_encounter: frm.doc.patient_encounter,
    checklist_template: frm.doc.nursing_checklist,
    procedure: frm.doc.name,
  };
  frappe.new_doc("Nursing Checklist");
}

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

const resetFields = () => {
  cur_frm.set_value("nursing_checklist", "");
};

const setChecklists = async (frm) => {
  // checkall checklists
  let checklists = await get_procedure_completed_checklists(frm.doc.name);
  console.log({ checklists });

  frm.doc.completed_nursing_checklist = [];

  if (checklists.length > 0) {
    for (let index = 0; index < checklists.length; index++) {
      const doneChecklist = checklists[index];

      let entry = frm.add_child("completed_nursing_checklist");
      entry.checklist = doneChecklist.name;
      entry.checklist_name = doneChecklist.checklist_name;
      entry.checklist_template = doneChecklist.checklist_template;
      entry.checklist_template_name = doneChecklist.checklist_template_name;
    }
  }
  refresh_field("completed_nursing_checklist");
};

frappe.ui.form.on("Clinical Procedure", {
  onload(frm) {
    resetFields();
    setChecklists(frm);
    frm.set_df_property("items", "cannot_delete_rows", 1);    
  },
  refesh(frm) {
    resetFields();
    setChecklists(frm);
    frm.set_df_property("items", "cannot_delete_rows", 1);
  },
  start_nursing_checklist_: async (frm) => {
    if (frm.doc.nursing_checklist != "" || frm.doc.nursing_checklist == null) {
      create_patient_checklist(frm);
    } else {
      frappe.msgprint({
        title: __("Required Nursing Checklists"),
        indicator: "red",
        message: `Please Select a Nursing Checklist Template`,
      });
    }
  },

  procedure_template: async (frm) => {
    const procedure_template = frm.doc.procedure_template;
    const required_checklist_list = await get_all_required_checklists(
      procedure_template
    );
    console.log(required_checklist_list);

    // if(required_checklist_list?.length >0) return
    console.log("Hey");

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

    frappe.msgprint({
      title: __("Required Nursing Checklists"),
      indicator: "red",
      message: `<ul>${message}</ul>`,
    });
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
  on_submit(frm){
    console.log("Submit ", cur_frm.doc)
    let type = frm.doc.type;
    let encounter = "";
    if(type == "Inpatient"){
      encounter = frm.doc.inpatient_record;
    }else {
      encounter = frm.doc.patient_encounter;
    }
    let procedure = cur_frm.doc.name
    console.log(encounter,"encounter", procedure);

    frappe.call({
      method: "gch_custom.services.rest.invoice_procedure_consumables",
      args: {
        encounter: encounter,
        procedure: procedure
      },callback(r){
        if(r.message){
          console.log(r.message)
        }else {
          console.log(r)
        }
      }
    })

    // Adding nurse notes to encounter on submission
    frappe.call({
        method: "gch_custom.services.rest.add_procedure_nurse_notes_to_encounter",
        args: {
            encounter: encounter,
            nurse_note: cur_frm.doc.notes,
            nurse_name: frappe.session.user,
            procedure_date: cur_frm.doc.start_date,
            procedure_time: cur_frm.doc.start_time
        },
        callback(r) {
            console.log(r.message)
        }
    })

  }
});
