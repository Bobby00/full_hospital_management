// Copyright (c) 2023, eGerties Devs and contributors
// For license information, please see license.txt

const format_date = (date) => {
  var date = new Date(date);
  let options = {
    year: "numeric",
    month: "long",
    day: "numeric",
  };
  var fmt = new Intl.DateTimeFormat("en-US", options);
  return fmt.format(date);
};

const INPUT_FIELDS = [
  "date",
  "time",
  "fluid_no",
  "intravenous_type",
  "total_in_bottle",
  "infused",
  "alimentary_type",
  "amount",
  "vomit",
  "stool",
  "ng",
  "urine",
  "other",
  "specific_gravity",
  "comment",
];

const TABLE_HEADER_DEFAULT = `
<tr>
<th colspan="8">Intake (in ml) A</th>
<th colspan="6">Output (in ml) B</th>
<th colspan="3"></th>
</tr>
<tr>
<th colspan="3"></th>
<th colspan="3">Intravenous</th>
<th colspan="2">Alimentary</th>
<th colspan="9"></th>
</tr>
<tr>
<th>Date</th>
<th>Time</th>
<th>Fluid No</th>
<th>Type</th>
<th>Total Bottle</th>
<th>Infused</th>
<th>Type</th>
<th>Amount</th>
<th>Vomit</th>
<th>Stool</th>
<th>NG</th>
<th>Urine</th>
<th>Drains</th>
<th>Specific Gravity</th>
<th>Comment</th>
<th>By</th>
<th>action</th>
</tr>
`;

const get_current_fluids = () => {
  let fluids = [];

  let prescribed_fluids = cur_frm.doc.input_output_orders;

  if (prescribed_fluids && prescribed_fluids.length > 0) {
    prescribed_fluids.forEach((fluid) => {
      fluids.push({
        name: fluid.name,
        fluid_name: fluid.fluid,
        fluid_type: fluid.fluid_type,
        volume: fluid.volume,
        volume_given: fluid.volume_given,
        volume_remaining: fluid.volume_remaining,
      });
    });
  }
  // console.log(fluids);
  return fluids;
};

const calculate_totals = (data) => {
  let total_intake = 0;
  let total_output = 0;
  let total_vomit = 0;
  let total_stool = 0;
  try {
    for (let index = 0; index < data.length; index++) {
      const row = data[index];

      console.log({ row });
      total_intake += parseFloat(row.infused) + parseFloat(row.amount);
      // console.log({ total_intake });
      total_output +=
        parseFloat(row.urine == "" ? 0 : row.urine) +
        parseFloat(row.ng == "" ? 0 : row.ng) +
        parseFloat(row.other == "" ? 0 : row.other);

      total_vomit += parseFloat(row.vomit) || 0;
      total_stool += parseFloat(row.stool) || 0;
    }
    return {
      total_difference: parseFloat(total_intake) - parseFloat(total_output),
      total_intake,
      total_output,
      total_vomit,
      total_stool,
    };
  } catch (err) {
    alert("something is not a number");
  }
};

const create_nursing_input_output_table = (frm, selector, table_name) => {
  // <div class="frappe-control" data-fieldtype="HTML" data-fieldname="table_1" title="table_1"></div>
  const TABLE_WRAPPER = document.querySelector(
    `[data-fieldname="${selector}"]`
  );
  const PAGE_WRAPPER = document.querySelector(".page-body");
  PAGE_WRAPPER.classList.remove("container");
  PAGE_WRAPPER.classList.add("m-4");
  if (TABLE_WRAPPER) {
    TABLE_WRAPPER.innerHTML = "";
  }

  const data = get_table_data(frm, table_name);

  data.sort(function (a, b) {
    let key1 = new Date(a.date);
    let key2 = new Date(b.date);
    return key1 - key2;
  });

  const TABLE_TBODY = create_table_rows_elements(
    data,
    frm,
    selector,
    table_name
  );

  const {
    total_difference,
    total_intake,
    total_output,
    total_stool,
    total_vomit,
  } = calculate_totals(data);

  const table = `
	<table class="table table-bordered" id="table_1" style="background-color:rgb(153, 204, 255);">
	<thead>
${TABLE_HEADER_DEFAULT}

	</thead>
	${TABLE_TBODY.outerHTML}
	<tfoot>
  <tr>
  <th colspan="9"></th>
 
  <th>Stool</th>  
  <th colspan="8">${Math.round((total_stool + Number.EPSILON) * 100) / 100}</th>
 
 
  </tr>
  <tr>
  <th colspan="9"></th>
  <th>Vomit</th>
  <th colspan="8">${Math.round((total_vomit + Number.EPSILON) * 100) / 100}</th>
 
 
  </tr>
	  <tr>
		<th colspan="3">TOTAL INTAKE (A)</th>
		<th colspan="4">${Math.round((total_intake + Number.EPSILON) * 100) / 100}</th>
		<th colspan="3">TOTAL OUTPUT (B)</th>
		<th colspan="7">${Math.round((total_output + Number.EPSILON) * 100) / 100}</th>
   
	  </tr>
 
	  <tr>
		<th colspan="3">Difference(A-B)</th>
		<th colspan="13">${Math.round((total_difference + Number.EPSILON) * 100) / 100}</th>
   
	  </tr>
	</tfoot>
  </table>
  ${frm.doc.docstatus == 1 ? "" : INPUT_FORM}
	`;
  if (TABLE_WRAPPER) {
    TABLE_WRAPPER.innerHTML = table;
  }

  frm.refresh_field(selector);

  // add event listeners to the input form
  INPUT_FIELDS.forEach((field) => {
    document.querySelector(`#${field}`).addEventListener("change", (e) => {
      const { value, id } = e.target;

      if (id === "fluid_no") {
        let fluids = get_current_fluids();
        const fluid = fluids.find((fluid) => fluid.fluid_type === value);
        document.querySelector("#intravenous_type").value = fluid.fluid_name;
        document.querySelector("#total_in_bottle").value =
          fluid.volume - fluid.volume_given;
        document.querySelector("#infused").max =
          fluid.volume - fluid.volume_given;
      }

      // console.log({ value, id });
    });
  });
};

const get_table_data = (frm, table_name) => {
  let list = frm.doc[table_name];
  if (list && list.length > 0) {
    return list;
  }
  return [];
};

const handle_delete_row = (selector, table_name, row_name, frm) => {
  if (cur_frm.doc.docstatus == 1) {
    frappe.msgprint("You can't delete a record that has been submitted");
    return;
  }
  const list = cur_frm.doc.input_output_table_1;

  const row_to_delete = list.find((r) => r.name == row_name);

  if (row_to_delete) {
    if (row_to_delete.sign != frappe.session.user) {
      console.log({
        message: "INFO: You cant delete someones else records.",
      });
      return;
    }
  }
  console.log({
    message: "INFO: Deleting row: " + row_to_delete.name,
  });

  const new_list = list.filter((row) => row.name !== row_name);

  cur_frm.doc.input_output_table_1 = new_list;
  cur_frm.refresh_field("input_output_table_1");

  cur_frm.save();
  console.log({ list, new_list });
  create_form();
};

let fluids = get_current_fluids();

const INPUT_FORM = `
<table class="table table-bordered" style="background-color:rgb(153, 204, 255);">
<thead>
 ${TABLE_HEADER_DEFAULT}
</thead>
<tbody>
  <tr>
  <td><input type="date" class="form-control" id="date" value="${frappe.datetime.nowdate()}"
   /></td>
  <td><input type="time" class="form-control" id="time" 
   /></td>
  <td>
  <select class="form-control" id="fluid_no">
  <option value="">Select Fluid</option>
  ${fluids.map((fluid) => {
    return `<option value="${fluid.fluid_type}">${fluid.fluid_type}</option>`;
  })}
  </select>
 
  
  </td>
  <td><input type="text" readonly class="form-control" id="intravenous_type" /></td>
  <td><input type="number" readonly class="form-control" id="total_in_bottle" /></td>
  <td><input type="number" class="form-control" id="infused" /></td>
  <td><input type="text" class="form-control" id="alimentary_type" /></td>
  <td><input type="number" class="form-control" id="amount" /></td>
  <td><input type="number" class="form-control" id="vomit" /></td>
  <td><input type="number" class="form-control" id="stool" /></td>
  <td><input type="number" class="form-control" id="ng" /></td>
  <td><input type="number" class="form-control" id="urine" /></td>
  <td><input type="number" class="form-control" id="other" /></td>
  <td><input type="text" class="form-control" id="specific_gravity" /></td>
  <td><input type="text" class="form-control" id="comment" /></td>
  <td><input type="text" class="form-control" id="sign" disabled value="${
    frappe.session.user
  }" /></td>
  <td>
  <button class="btn btn-primary btn-xs" onclick="window.handle_add_row()">Save</button>
  </td>
</tr>
</tbody>
</table>`;

const handle_add_row = () => {
  // if (!cur_frm.isPrimaryNurse) {
  //   frappe.msgprint(__("You are not the primary nurse for this patient"));
  //   return;
  // }

  // query all fields and values
  let child_table = cur_frm.add_child("input_output_table_1");

  INPUT_FIELDS.map((field) => {
    const field_elem = document.querySelector(`#${field}`);
    // console.log({ field, value: field_elem.value });
    child_table[field] = field_elem.value;
    field_elem.value = "";
  });

  child_table.sign = frappe.session.user;

  let fluids = cur_frm.doc.input_output_orders;

  let fluid_idx = fluids.findIndex(
    (fluid) => fluid.fluid_type === child_table.fluid_no
  );

  if (fluid_idx !== -1) {
    fluids[fluid_idx].volume_remaining =
      parseFloat(fluids[fluid_idx].volume) -
      (parseFloat(child_table.infused) +
        parseFloat(fluids[fluid_idx].volume_given));
    fluids[fluid_idx].volume_given += parseFloat(child_table.infused);
    cur_frm.doc.input_output_orders = fluids;
  }

  cur_frm.save();
  // frm.fields_dict['input_output_table_1'].grid.refresh();
  cur_frm.refresh_field("input_output_table_1");
};

const create_table_rows_elements = (data, selector, table_name) => {
  const TABLE_TBODY = document.createElement("tbody");
  let current_date = null;
  data.forEach((row) => {
    if (current_date == null) {
      current_date = row.date;
    }
    if (current_date != row.date) {
      const TABLE_ROW = document.createElement("tr");
      const TABLE_ROW_HTML = `
       <td colspan="17" style="background-color: white;"> </td>
      `;
      TABLE_ROW.innerHTML = TABLE_ROW_HTML;
      TABLE_TBODY.appendChild(TABLE_ROW);
      current_date == row.date;
    }
    const TABLE_ROW = document.createElement("tr");
    const TABLE_ROW_HTML = `
		 <td>${row.date || ""}</td>
		 <td>${row.time || ""}</td>
		 <td>${row.fluid_no || ""}</td>
		 <td>${row.intravenous_type || ""}</td>
		 <td>${row.total_in_bottle}</td>
		 <td>${row.infused}</td>
		 <td>${row.alimentary_type || ""}</td>
		 <td>${row.amount || ""}</td>
		 <td>${row.vomit}</td>
		 <td>${row.stool}</td>
		 <td>${row.ng}</td>
		 <td>${row.urine}</td>
		 <td>${row.other || ""}</td>
		 <td>${row.specific_gravity || ""}</td>
     <td>${row.comment || ""}</td>
		 <td>${row.sign || ""}</td>
		 <td>
    
     <button class="btn btn-danger btn-xs" data-id="${
       row.name
     }" onclick="window.handle_delete_row('${selector}','${table_name}','${
      row.name
    }')">Delete</button>
    
    </td>
		 `;
    TABLE_ROW.innerHTML = TABLE_ROW_HTML;
    TABLE_TBODY.appendChild(TABLE_ROW);
  });
  return TABLE_TBODY;
};

const add_row_items_diag = (frm, selector, table_name) => {
  const new_items_modal = new frappe.ui.Dialog({
    title: "Fluid Chart Entry",
    fields: [
      {
        fieldname: "Input Chart",
        fieldtype: "Section Break",
      },
      {
        fieldname: "date",
        fieldtype: "Date",
        label: "Date",
      },
      {
        fieldname: "column_break_1",
        fieldtype: "Column Break",
      },
      {
        fieldname: "time",
        fieldtype: "Time",
        label: "Time",
      },
      {
        fieldname: "Input Chart",
        fieldtype: "Section Break",
        label: "Input",
      },
      {
        fieldname: "fluid_no",
        fieldtype: "Select",
        label: "Fluid No",
        options: "\n1\n2\n3\n4\n5\n6\n7\n8\n9\n10",
      },

      {
        fieldname: "intravenous_type",
        fieldtype: "Data",
        label: "Intravenous Type",
      },

      {
        fieldname: "total_in_bottle",
        fieldtype: "Float",
        label: "Total In Bottle",
      },

      {
        fieldname: "infused",
        fieldtype: "Float",
        label: "Infused",
      },

      {
        fieldname: "alimentary_type",
        fieldtype: "Data",
        label: "Alimentary Type",
      },

      {
        fieldname: "amount",
        fieldtype: "Data",
        label: "Amount",
      },
      {
        fieldname: "Output Chart",
        fieldtype: "Section Break",
        label: "Output",
      },

      {
        fieldname: "vomit",
        fieldtype: "Float",
        label: "Vomit",
      },
      {
        fieldname: "stool",
        fieldtype: "Float",
        label: "Stool",
      },
      {
        fieldname: "ng",
        fieldtype: "Float",
        label: "NG",
      },
      {
        fieldname: "column_break_1",
        fieldtype: "Column Break",
      },
      {
        fieldname: "urine",
        fieldtype: "Float",
        label: "Urine",
      },
      {
        fieldname: "other",
        fieldtype: "Data",
        label: "Drains",
      },
      {
        fieldname: "specific_gravity",
        fieldtype: "Data",
        label: "Specific Gravity",
      },
    ],
    primary_action_label: "Save",
    primary_action(values) {
      const {
        date,
        time,
        fluid_no,
        intravenous_type,
        total_in_bottle,
        infused,
        alimentary_type,
        amount,
        vomit,
        stool,
        ng,
        urine,
        other,
        specific_gravity,
      } = values;

      const row = {
        date,
        time,
        fluid_no,
        intravenous_type,
        total_in_bottle,
        infused,
        alimentary_type,
        amount,
        vomit,
        stool,
        ng,
        urine,
        other,
        specific_gravity,
      };

      let child_table = frm.add_child(table_name);
      child_table.date = date;
      child_table.time = time;
      child_table.fluid_no = fluid_no;
      child_table.intravenous_type = intravenous_type;
      child_table.total_in_bottle = total_in_bottle;
      child_table.infused = infused;
      child_table.alimentary_type = alimentary_type;
      child_table.amount = amount;
      child_table.vomit = vomit;
      child_table.stool = stool;
      child_table.ng = ng;
      child_table.urine = urine;
      child_table.other = other;
      child_table.specific_gravity = specific_gravity;
      child_table.sign = frappe.session.user;
      frm.save();

      frm.refresh_field(table_name);
      create_nursing_input_output_table(frm, selector, table_name);
      new_items_modal.hide();
    },
  });
  new_items_modal.show();
};

const create_form = () => {
  create_nursing_input_output_table(cur_frm, "table_1", "input_output_table_1");
};

const create_generate_new_btn = (frm) => {
  console.log("INFO: creating generate btn");
  frm.add_custom_button(__("Generate New"), function () {
    frappe.route_options = {
      patient: frm.doc.patient,
      inpatient_record: frm.doc.inpatient_record,
      previous_nursing_input_output_chart: frm.doc.name,
      input_output_orders: frm.doc.input_output_orders,
    };
    frappe.new_doc("Nursing Input Output Chart");
  });
};

const fetch_previous_prescription = (cur_frm) => {
  if (cur_frm.doc.name.startsWith("new-nursing-input-output-chart")) return;

  frappe.call({
    method: "gch_inpatient.tasks.input_output_tasks.get_previouse_prescription",
    args: {
      io_chart: cur_frm.doc.name,
    },
    callback: (res) => {
      console.log(res);
      if (res.message) {
        cur_frm.doc.input_output_orders = res.message;
        cur_frm.refresh_field("input_output_orders");

        console.log("INFO: previous prescription fetched eee");
        console.log(res.message);
      }
    },
  });
};

frappe.ui.form.on("Nursing Input Output Chart", {
  refresh: function (frm) {
    if (cur_frm.doc.inpatient_record && cur_frm.doc.inpatient_record != "") {
    //   frappe.require(
    //     "/assets/gch_inpatient/js/inpatient_record_utils.js",
    //     () => {
    //       block_nurse_from_editing(frm);
    //     }
    //   );

      // Add button that navigates to inpatient record
      frm.add_custom_button(__("Inpatient Record"), () => {
        window.location.href = "/app/inpatient-record/"+ cur_frm.doc.inpatient_record
      })

      frappe.call({
        method: "gch_inpatient.tasks.input_output_tasks.get_prev_charts",
        args: {
          inpatient_record: frm.doc.inpatient_record,
        },
        callback: (res) => {
          console.log(res);
          if (res.message) {
            const TABLE = `
          <h3>Previous Input Output Charts</h3>
          <table class="table table-bordered" style="background-color:rgb(153, 204, 255);">
          <thead>
              <tr>
              <th>Date</th>
                  <th style=" width: 70%;">Name</th>
                  <th>Link</th>
              </tr>
          </thead>
          <tbody>
              ${res.message.map((chart) => {
                if (chart.name == cur_frm.doc.name) return null;
                return `<tr>
                <td>${format_date(chart.creation)}</td>
                <td>${chart.name}</td>
                <td><a href="/app/nursing-input-output-chart/${
                  chart.name
                }" target='_blank' >Click to View</a></td>
                </tr>`;
              })}
          </tbody>
      </table>`;

            const TABLE_WRAPPER = document.querySelector(
              `[data-fieldname="prev_io_charts"]`
            );

            if (TABLE_WRAPPER) {
              TABLE_WRAPPER.innerHTML = TABLE;
            }
          }
        },
      });

      frappe.require(
        "/assets/gch_inpatient/js/inpatient_record/highlighted_menu.js",
        () => {
          handleHighlightedMenu(cur_frm);
        }
      );

      fetch_previous_prescription(cur_frm);

      if (frm.doc.docstatus == 1) {
        create_generate_new_btn(frm);
      }
    }
    get_current_fluids();
    create_form();
    window.handle_delete_row = (selector, table_name, row_name) =>
      handle_delete_row("table_1", table_name, row_name, frm);
    window.handle_add_row = handle_add_row;

    // Attempting to fetch multidisciplinary if not available

    if(cur_frm.doc.inpatient_record && !cur_frm.doc.multidisciplinary) {

        frappe.db.get_value("Multidisciplinary", {'inpatient_record':cur_frm.doc.inpatient_record}, ["name"])
        .then( (res) => { 
            cur_frm.set_value("multidisciplinary", res.message.name)
            cur_frm.refresh_field("multidisciplinary")

            })

    }

  },

  before_save: function (frm) {
    console.log("INFO: before save");
    if (
      cur_frm.doc.previous_nursing_input_output_chart ||
      cur_frm.doc.previous_nursing_input_output_chart != ""
    ) {
      if (
        !cur_frm.doc.input_output_orders ||
        cur_frm.doc.input_output_orders?.length == 0
      ) {
        fetch_previous_prescription(cur_frm);
      }
    }
  },
  inpatient_record: function (frm) {
    if (cur_frm.doc.inpatient_record && cur_frm.doc.inpatient_record != "") {
      frappe.require(
        "/assets/gch_inpatient/js/inpatient_record_utils.js",
        () => {
          block_nurse_from_editing(cur_frm);
          fetch_previous_prescription(cur_frm);
        }
      );
    }
  },
  add_record_t1: function () {
    add_row_items_diag(cur_frm, "table_1", "input_output_table_1");
    create_form();
  },

  after_save: () => {

    // Refresh fluid drop down whenever the fluids table is altered
    console.log("refreshing...........")
    fetch_previous_prescription(cur_frm);
    

  }

});
