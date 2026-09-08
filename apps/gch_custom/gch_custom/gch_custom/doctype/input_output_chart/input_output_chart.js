const calculateFluidTotal = function (fluids) {
  if (!fluids) {
    return 0;
  }
  const totalFluidVolume = fluids.reduce((total, fluid) => {
    return total + fluid.volume;
  }, 0);
  return totalFluidVolume;
};

const updateTotalFuildDifference = function (cur_frm) {
  const inputTotal = cur_frm.doc.intake_fluid_total;
  const outputTotal = cur_frm.doc.output_fluid_total;
  const fluidDifference = inputTotal - outputTotal;
  cur_frm.doc.intake_fluid_balance = fluidDifference;
  cur_frm.refresh_field("intake_fluid_balance");
};

const updateTotalIntakeFluidSpecified = function (cur_frm) {
  const specifiedIntakeFluid = cur_frm.doc.input_fluids;

  const totalIntakeFluidSpecified = calculateFluidTotal(specifiedIntakeFluid);
  cur_frm.doc.intake_fluid_total = totalIntakeFluidSpecified;
  cur_frm.refresh_field("intake_fluid_total");
  updateTotalFuildDifference(cur_frm);
};

const updateTotalOutputFluidSpecified = function (cur_frm) {
  const specifiedOutputFluid = cur_frm.doc.output_fluids;

  const totalOutputFluidSpecified = calculateFluidTotal(specifiedOutputFluid);
  cur_frm.doc.output_fluid_total = totalOutputFluidSpecified;
  cur_frm.refresh_field("output_fluid_total");
  updateTotalFuildDifference(cur_frm);
};
const updateTotalIntakeFluid = function (cur_frm) {
  const totalIntakeFluid = cur_frm.doc.intake_fluid_details;

  const totalIntakeFluidCalculated = calculateFluidTotal(totalIntakeFluid);
  cur_frm.doc.total_intake_fluids = totalIntakeFluidCalculated;
  cur_frm.refresh_field("total_intake_fluids");
  updateTotalFluidsDifference(cur_frm);
};

const updateTotalOutputFluid = function (cur_frm) {
  const totalOutputFluid = cur_frm.doc.output_fluid_details;

  const totalOutputFluidCalculated = calculateFluidTotal(totalOutputFluid);
  cur_frm.doc.total_output_fluids = totalOutputFluidCalculated;
  cur_frm.refresh_field("total_output_fluids");
  updateTotalFluidsDifference(cur_frm);
};

const updateTotalFluidsDifference = function (cur_frm) {
  const totalIntakeFluid = cur_frm.doc.total_intake_fluids;
  const totalOutputFluid = cur_frm.doc.total_output_fluids;
  cur_frm.doc.total_fluid_difference = totalIntakeFluid - totalOutputFluid;
  cur_frm.refresh_field("total_fluid_difference");
};

const loadChart = function (cur_frm) {
  const chart_element = document.querySelector(
    '[data-fieldname="input_output_chart"]'
  );
  chart_element.id = "frost-chart";
  const intakes = cur_frm.doc.intake_fluid_details;
  const outputs = cur_frm.doc.output_fluid_details;
  const fluids = [...intakes, ...outputs];
  let fluid_dataset = {};
  let times = [
    "6",
    "7",
    "8",
    "9",
    "10",
    "11",
    "12",
    "13",
    "14",
    "15",
    "16",
    "17",
    "18",
    "19",
    "20",
    "21",
    "22",
    "23",
    "0",
    "1",
    "2",
    "3",
    "4",
    "5",
  ];
  for (let i = 0; i < fluids.length; i++) {
    let fluid = fluids[i];
    let _time = fluid.hour.split(":")[0];
    if (fluid_dataset[fluid.fluid]) {
      const idx = times.indexOf(_time);
      fluid_dataset[fluid.fluid].values[idx] =
        fluid_dataset[fluid.fluid].values[idx] + fluid.volume;
    } else {
      const idx = times.indexOf(_time);
      let defult_ary = [
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      ];
      defult_ary[idx] = defult_ary[idx] + fluid.volume;
      fluid_dataset[fluid.fluid] = {
        name: fluid.fluid,
        chartType: "line",
        values: defult_ary,
      };
      //   if (fluid.fluid_type) {
      //     if (fluid_dataset["Intakes"]) {
      //       fluid_dataset["Intakes"].values[idx] =
      //         fluid_dataset["Intakes"].values[idx] + fluid.volume;
      //     } else {
      //       fluid_dataset["Intakes"] = {
      //         name: "Intakes",
      //         chartType: "bar",
      //         values: defult_ary,
      //       };
      //     }
      //   } else {
      //     if (fluid_dataset["Outputs"]) {
      //       fluid_dataset["Outputs"].values[idx] =
      //         fluid_dataset["Outputs"].values[idx] + fluid.volume;
      //     } else {
      //       fluid_dataset["Outputs"] = {
      //         name: "Outputs",
      //         chartType: "bar",
      //         values: defult_ary,
      //       };
      //     }
      //   }
    }
  }
  let chart = new frappe.Chart("#frost-chart", {
    data: {
      labels: [
        "6am",
        "7am",
        "8am",
        "9am",
        "10am",
        "11am",
        "12pm",
        "1pm",
        "2pm",
        "3pm",
        "4pm",
        "5pm",
        "6pm",
        "7pm",
        "8pm",
        "9pm",
        "10pm",
        "11pm",
        "12am",
        "1am",
        "2am",
        "3am",
        "4am",
        "5am",
      ],
      datasets: Object.values(fluid_dataset),
    },
    title: "Input Output Chart",
    type: "axis-mixed", // or 'bar', 'line', 'pie', 'percentage'
    height: 300,
    colors: ["purple", "#ffa3ef", "light-blue"],
    tooltipOptions: {
      formatTooltipX: (d) => (d + "").toUpperCase(),
      formatTooltipY: (d) => d + " ml",
    },
  });
};

frappe.ui.form.on("Input Output Chart", {
  onload: function (frm) {},
  refresh: function (frm) {
    updateTotalIntakeFluidSpecified(cur_frm);
    updateTotalOutputFluidSpecified(cur_frm);
    loadChart(cur_frm);
    const options = cur_frm.doc.input_fluids.map((fluid) => fluid.fluid_type);
    cur_frm.fields_dict.intake_fluid_details.grid.update_docfield_property(
      "fluid_type",
      "options",
      [""].concat(options)
    );

    // BETTER WAY TO DO THIS
    // cur_frm.fields_dict["intake_fluid_details"].grid.get_field(
    //   "fluid"
    // ).get_query = function (doc, cdt, cdn) {
    //   const fluid_filters = cur_frm.doc.input_fluids.map(
    //     (fluid) => fluid.fluid
    //   );
    //   return {
    //     filters: {
    //       name: ["in", fluid_filters],
    //     },
    //   };
    // };
  },
  input_fluid_total: function (frm) {},
  output_fluid_total: function (frm) {},
  validate: function (frm) {
    updateTotalIntakeFluidSpecified(cur_frm);
    updateTotalOutputFluidSpecified(cur_frm);
    updateTotalIntakeFluid(cur_frm);
    updateTotalOutputFluid(cur_frm);
  },
  input_fluids_add: function (frm) {},
  output_fluids_add: function (frm) {},
});

frappe.ui.form.on(
  "Intake Fluid Details",
  "fluid_type",
  function (frm, cdt, cdn) {
    let item = locals[cdt][cdn];
    const fluids = cur_frm.doc.input_fluids;
    const fluid = fluids.find((fluid) => fluid.fluid_type === item.fluid_type);
    item.fluid = fluid.fluid;
    cur_frm.refresh_field("intake_fluid_details");
  }
);

frappe.ui.form.on("Intake Fluid Specification Table", {
  before_input_fluids_remove: function (frm, cdt, cdn) {
    let item = locals[cdt][cdn];

    const fluids = cur_frm.doc.intake_fluid_details;

    console.log({ item, fluids });

    const fluidHasBeenUsed = fluids.find(
      (fluid) => fluid.fluid_type === item.fluid_type
    );

    if (fluidHasBeenUsed) {
      frappe.throw(__("Fluid cannot be Removed as it is used already"));
    }
  },
  input_fluids_add(frm, cdt, cdn) {
    let item = locals[cdt][cdn];
    const previousFluids = cur_frm.doc.input_fluids;
    const options = [
      "1",
      "2",
      "3",
      "4",
      "5",
      "6",
      "7",
      "8",
      "9",
      "10",
      "11",
      "12",
      "13",
      "14",
      "15",
      "16",
      "17",
      "18",
      "19",
      "20",
    ].filter((option) => {
      const fluid = previousFluids.find((fluid) => fluid.fluid_type === option);
      return !fluid;
    });

    cur_frm.fields_dict.input_fluids.grid.update_docfield_property(
      "fluid_type",
      "options",
      [""].concat(options)
    );
    item.fluid_type = options[0];

    cur_frm.refresh_field("input_fluids");

    cur_frm.fields_dict["input_fluids"].grid.get_field("fluid").get_query =
      function (doc, cdt, cdn) {
        const fluid_filters = cur_frm.doc.input_fluids.map(
          (fluid) => fluid.fluid
        );
        return {
          filters: {
            name: ["not in", fluid_filters],
          },
        };
      };
  },
});
