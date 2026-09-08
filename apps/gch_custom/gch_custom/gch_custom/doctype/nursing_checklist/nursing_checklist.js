// Get all checklist tasks in a given checklist template
// given the checklist template name

const get_all_checklist_tasks = async (checklist_template) => {
  let checklist_tasks;
  await frappe
    .call({
      method: "gch_custom.services.rest.get_all_checklist_tasks",
      args: { checklist_template },
    })
    .done((r) => {
      checklist_tasks = r.message;
    });
  return checklist_tasks;
};

// const hideAddRow = (frm) => {
//   frm.get_field("checklist_details").grid.only_sortable();
// };

frappe.ui.form.on("Nursing Checklist", {
  onload(frm) {
    // hideAddRow(frm);
  },
  refresh(frm) {
    // hideAddRow(frm);

    if(cur_frm.doc.__islocal && cur_frm.doc.inpatient_record) {
        cur_frm.set_value("is_inpatient", 1)
        cur_frm.refresh_field("is_inpatient")
    }

    //   frm.fields_dict['checklist_details'].grid.get_field('options').get_query = function(doc, cdt, cdn) {
    //     var child = locals[cdt][cdn];
    //     //console.log(child);
    //     return {
    //         filters:[
    //             ['IS_IT_OK_FIELD', '=', child.task]
    //         ]
    //     }
    // }
  },
  on_submit: function (frm) {
    // Creating completed nursing tools list
    frappe.call({
        method: "gch_custom.gch_custom.doctype.nursing_checklist.nursing_checklist.creating_completed_nursing_tools",
        args: {
            "inpatient_record": cur_frm.doc.inpatient_record,
            "tool_name": cur_frm.doc.checklist_name,
            "tool_id": cur_frm.doc.name,
            "tool_link": `<a href='/app/nursing-checklist/${cur_frm.doc.name}'><p style='color: blue;'>View</p></a>`
        },
        callback: (res) => {
            console.log(res, "============= SUBMITTEDDD ==========")
        }
    })
    
    window.history.go(-1);
  },
  checklist_template: async function (frm, cdt, cdn) {
    var checklist_template = frm.doc.checklist_template;
    const checklist_details = "checklist_details";
    if (!checklist_template) return;

    frm.doc.checklist_details = [];

    //   Get all task for the template

    // Get All Tasks
    const checklist_tasks = await get_all_checklist_tasks(checklist_template);

    if (checklist_tasks?.length > 0) {
      for (let index = 0; index < checklist_tasks.length; index++) {
        const task = checklist_tasks[index];
        let row = frm.add_child(checklist_details);
        //   row.task = task.task;
        row.task = task.checklist_task;
        row.task_name = task.task_name;
      }
      refresh_field(checklist_details);
    }
  },
});
