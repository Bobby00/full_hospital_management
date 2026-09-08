const build_select_options = (select_value) => {
  const SELECT_OPTIONS = [];
  for (let index = 1; index <= 1000; index++) {
    let is_selected = index == select_value ? "selected" : undefined;
    SELECT_OPTIONS.push(
      `<option value="${index}"  ${is_selected}>${index}</option>`
    );
  }
  return SELECT_OPTIONS;
};

const build_item_name_select_options = (item_options, select_value) => {
  const SELECT_OPTIONS = [];

  for (let index = 0; index < item_options.length; index++) {
    const item_option = item_options[index];
    let is_selected = item_option.name == select_value ? "selected" : undefined;
    SELECT_OPTIONS.push(
      `<option value="${item_option.name}" ${is_selected}>${item_option.display_name}</option>`
    );
  }

  return SELECT_OPTIONS;
};

const build_table_rows = (table_row_items) => {
  let ROWS = [];

  for (let index = 0; index < table_row_items.length; index++) {
    const single_row = table_row_items[index];
    ROWS.push(` <tr id="${single_row.item.name}">
    <td scope="col">
      <div class="form-check">
        <input
          type="checkbox"
          class="form-check-input"
          id="exampleCheck1"
        />
      </div>
    </td>
    <td scope="col">${single_row.item.generic_drug}</td>
    <td scope="col">${single_row.item.route}</td>
    <td scope="col">${single_row.item.dose}</td>
    <td scope="col">${single_row.item.prescription_frequency} ${
      single_row.item.frequency_type
    }</td>
    <td scope="col">${single_row.item.duration} Days</td>
    <td scope="col">
      <select class="form-control"   data-column="pharmacy_dose" id="${
        single_row.item.name
      }" onchange="window.handlePrescriptionChange(this)"  >
      ${build_select_options(single_row.item.pharmacy_dose)}
        
      </select>
    </td>
    <td scope="col">
      <select class="form-control" data-column="pharmacy_frequency" id="${
        single_row.item.name
      }" onchange="window.handlePrescriptionChange(this)" >
      ${build_select_options(single_row.item.pharmacy_frequency)}
      </select>
    </td>
    <td scope="col">
      <select class="form-control"  data-column="pharmacy_duration" id="${
        single_row.item.name
      }" onchange="window.handlePrescriptionChange(this)" >
      ${build_select_options(single_row.item.pharmacy_duration)}
      </select>
    </td>
    <td scope="col-2">
      <select class="form-control" data-column="medication" id="${
        single_row.item.name
      }" onchange="window.handlePrescriptionChange(this)">
     
      ${build_item_name_select_options(
        single_row.item_options,
        single_row.item.medication
      )}
      </select>
    </td>
    <td scope="col">0</td>
    <td scope="col">
      <input type="number" class="form-control" id="billed_qty_${
        single_row.item.name
      }" />
    </td>
    <td scope="col">
      <input type="number" class="form-control" id="discount_${
        single_row.item.name
      }" />
    </td>
    <td scope="col">sales</td>
    <td scope="col">100</td>
  </tr>`);
  }
  return ROWS;
};

const build_dispensement_table = (frm, prescription_table) => {
  if (prescription_table.length <= 0) return;

  const handlePrescriptionChange = (field_element) => {
    frm.call({
      method: "gch_custom.services.rest.update_prescription_table",
      args: {
        id: field_element.id,
        value: field_element.value,
        column: field_element.dataset.column,
      },
      callback(r) {
        if (r.message) {
          frappe.msgprint({
            title: __("Success"),
            indicator: "green",
            message: r.message,
          });
        }
      },
    });
    console.log(test.value, test.id, test.dataset.column);
  };
  window.handlePrescriptionChange = handlePrescriptionChange;

  let TABLE_ROWS = build_table_rows(prescription_table);

  const HTML_TEMPLATE = `
  <div style="overflow-x: scroll" id="pharmacy_scrollable_table" class="mb-4">
  <table class="table table-bordered table-hover">
  <thead>
    <tr>
      <th scope="col"></th>
      <th scope="col">Generic Name</th>
      <th scope="col">Route</th>
      <th scope="col">Dos.</th>
      <th scope="col">Freq.</th>
      <th scope="col">Dur.</th>
      <th scope="col" style="min-width: 6.875rem">Dos.</th>
      <th scope="col" style="min-width: 6.875rem">Freq.</th>
      <th scope="col" style="min-width: 6.875rem">Dur.</th>
      <th scope="col-2" style="min-width: 12.5rem">Item Name</th>
      <th scope="col" style="min-width: 6.875rem">Available Qty</th>
      <th scope="col" style="min-width: 6.875rem">Billed Qty</th>
      <th scope="col" style="min-width: 6.875rem">Discount %</th>
      <th scope="col" style="min-width: 6.875rem">Sales Rate</th>
      <th scope="col" style="min-width: 6.875rem">Total</th>
    </tr>
  </thead>
  <tbody>
   ${TABLE_ROWS}
  </tbody>
  </table>
  </div>
  `;

  $(frm.fields_dict["pharmacy_scrollable_table"].wrapper).html(HTML_TEMPLATE);
};

frappe.ui.form.on("Pharmacy Dispensement Form", {
  onload(frm) {
    if (frm.doc.patient_encounter) {
      frappe.call({
        method: "gch_custom.services.rest.get_scroll_table_data",
        args: {
          encounter_name: cur_frm.doc.patient_encounter,
        },
        callback(r) {
          if (r.message) {
            var prescription_table = r.message.prescription_table;

            build_dispensement_table(frm, prescription_table);
          }
        },
      });
    }
  },
  patient_encounter(frm) {
    frappe.call({
      method: "gch_custom.services.rest.get_scroll_table_data",
      args: {
        encounter_name: cur_frm.doc.patient_encounter,
      },
      callback(r) {
        if (r.message) {
          var prescription_table = r.message.prescription_table;

          build_dispensement_table(frm, prescription_table);
        }
      },
    });
  },
});
