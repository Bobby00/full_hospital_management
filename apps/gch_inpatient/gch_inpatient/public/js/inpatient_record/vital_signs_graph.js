const handleVitalSignsGraph = (frm) => {
    const chart_element = document.querySelector(
      '[data-fieldname="vital_signs_graph"]'
    );
  
    function generateGraphData(vitals) {
      let dates = [];
      let graph_data = {};
      for (let index = 0; index < vitals.length; index++) {
        const vital = vitals[index];
        let _date_time = vital.recorded_at.split(" ");
        let _date = _date_time[0];
        let _time = _date_time[1];
        dates.push(_date);
        let _date_exists = graph_data[_date];
        if (!_date_exists) {
          graph_data[_date] = [
            {
              name: "Temperature",
              chartType: "line",
              values: [vital.patient_encounter_temperature],
            },
            {
              name: "Heart Rate",
              chartType: "line",
              values: [vital.patient_encounter_heart_rate],
            },
            {
              name: "Respiratory Rate",
              chartType: "line",
              values: [vital.patient_encounter_respiratory_rate],
            },
            {
              name: "Percutaneous Oxygen Saturation",
              chartType: "line",
              values: [vital.patient_encounter_percutaneous_oxygen],
            },
            {
              name: "Blood Pressure systolic",
              chartType: "line",
              values: [vital.patient_encounter_bp_systolic],
            },
            {
              name: "Blood Pressure diastolic",
              chartType: "line",
              values: [vital.patient_encounter_bp_diastolic],
            },
          ];
        } else {
          graph_data[_date] = [
            {
              name: "Temperature",
              chartType: "line",
              values: [
                ...graph_data[_date][0].values,
                vital.patient_encounter_temperature,
              ],
            },
            {
              name: "Heart Rate",
              chartType: "line",
              values: [
                ...graph_data[_date][1].values,
                vital.patient_encounter_heart_rate,
              ],
            },
            {
              name: "Respiratory Rate",
              chartType: "line",
              values: [
                ...graph_data[_date][2].values,
                vital.patient_encounter_respiratory_rate,
              ],
            },
            {
              name: "Percutaneous Oxygen Saturation",
              chartType: "line",
              values: [
                ...graph_data[_date][3].values,
                vital.patient_encounter_percutaneous_oxygen,
              ],
            },
            {
              name: "Blood Pressure systolic",
              chartType: "line",
              values: [
                ...graph_data[_date][4].values,
                vital.patient_encounter_bp_systolic,
              ],
            },
            {
              name: "Blood Pressure diastolic",
              chartType: "line",
              values: [
                ...graph_data[_date][5].values,
                vital.patient_encounter_bp_diastolic,
              ],
            },
          ];
        }
      }
      let unique_date = new Set(dates);
      return {
        dates: [...unique_date],
        graph_data,
      };
    }
  
    chart_element.id = "frost-chart";
  
    let { dates, graph_data } = generateGraphData(
      cur_frm.doc.vital_signs_table || []
    );
  
    console.log(dates, graph_data, "GRAPH DATA ===================");
  
    let chart = new frappe.Chart("#frost-chart", {
      // or DOM element
      data: {
        labels: [
          "6am - 10am",
          "11am - 3pm",
          "4pm  - 8pm",
          "9pm - 1am",
          "2am - 6am",
          "7am - 11am",
          "12pm - 4pm",
          "5pm - 9pm",
          "10pm - 2am",
          "3am - 7am",
          "8am - 12pm",
          "1pm - 5pm",
          "6pm - 10pm",
        ],
  
        datasets: graph_data[dates[0]],
  
        yMarkers: [{ label: "Marker", value: 70, options: { labelPos: "left" } }],
        yRegions: [
          {
            label: "Region",
            start: -10,
            end: 50,
            options: { labelPos: "right" },
          },
        ],
      },
  
      title: "Vitals Chart",
      type: "axis-mixed", // or 'bar', 'line', 'pie', 'percentage'
      height: 300,
      colors: ["purple", "#ffa3ef", "light-blue"],
  
      tooltipOptions: {
        formatTooltipX: (d) => (d + "").toUpperCase(),
        formatTooltipY: (d) => d + " pts",
      },
    });
  
    // chart.export();
  };