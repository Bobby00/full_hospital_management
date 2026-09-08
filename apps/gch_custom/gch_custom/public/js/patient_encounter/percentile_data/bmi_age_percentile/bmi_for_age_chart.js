// Generating BMI_for_age Percentile chart
frappe.require("/assets/gch_custom/js/patient_encounter/percentile_data/chart.js", function() {
    
    let patient = cur_frm.doc.patient
    let patient_uhid = cur_frm.doc.patient_uhid

    let anthropometry_history = []

    console.log(patient, patient_uhid)
    frappe.call({
      method: "gch_custom.services.rest.fetch_anthropometry_history",
      async: false,
      args: {
        patient, patient_uhid
      },
      callback: function (res) {
        
        $.each(res.message, function(_i, e){
          

          // CONVERT PATIENT_AGE TO MONTHS
          var getYears = parseInt(e.patient_age.trim().split(/\s+/)[0]) * 12;
          var getMonths = parseInt(e.patient_age.trim().split(/\s+/)[2]);
          var getDays = parseInt(e.patient_age.trim().split(/\s+/)[4]);

          // Assuming 28+ days to be a month
          if (getDays >= 28) {
            getMonths += 1;
          }

          // GETTING TOTAL NUMBER OF MONTHS
          var totalMonths = parseInt(getYears + getMonths);



          anthropometry_history.push([totalMonths, e.bmi])

          console.log(e)
        })

        console.log(anthropometry_history)
        
      }

    })

    const TENSION = 0.2;
    var ctx = document.getElementById("bmiAgeChart").getContext("2d");

    // Fetching bmi chart data
    var obj; // initializing object to store fetch data


    // CONVERT PATIENT_AGE TO MONTHS
    var getYears = parseInt(cur_frm.doc.patient_age.trim().split(/\s+/)[0]) * 12;
    var getMonths = parseInt(cur_frm.doc.patient_age.trim().split(/\s+/)[2]);
    var getDays = parseInt(cur_frm.doc.patient_age.trim().split(/\s+/)[4]);

    // Assuming 28+ days to be a month
    if (getDays >= 28) {
      getMonths += 1;
    }

    // GETTING TOTAL NUMBER OF MONTHS
    var totalMonths = parseInt(getYears + getMonths);

    console.log("Total Months.......................", totalMonths)


    // GENERATING CHARTS FOR BMI PERCENTILE MONTH 0 - 24

    if (totalMonths < 24) {

      // Check for patient sex and age to generate the right link
      var zeroTo24
      if (totalMonths < 24 && cur_frm.doc.patient_sex == "Male") {
        console.log("Male under 24 months")
        zeroTo24 = "/assets/gch_custom/js/patient_encounter/percentile_data/bmi_age_percentile/boysPercentileMonth0To24.json"
      } else if (totalMonths < 24 && cur_frm.doc.patient_sex == "Female") {
        console.log("Female under 24 months")
        zeroTo24 = "/assets/gch_custom/js/patient_encounter/percentile_data/bmi_age_percentile/girlsPercentileMonth0To24.json"
      }
      
      fetch(
        zeroTo24
      )
        .then((response) => {
          return response.json();
        })
        .then((data) => (obj = data))
        .then(() => {
          // Generating chart for age 0 - 24
          
          console.log(obj)

          var labels = []; 
          var dataP1=[];
          var dataP3=[];
          var dataP5=[];
          var dataP10=[];
          var dataP15=[];
          var dataP25=[];
          var dataP50=[];
          var dataP75=[];
          var dataP85=[];
          var dataP90=[];
          var dataP95=[];
          var dataP97=[];
          var dataP99=[];


          for (var item in obj) {
            labels.push(obj[item].Month)
            dataP1.push(obj[item].P1)
            dataP3.push(obj[item].P3)
            dataP5.push(obj[item].P5)
            dataP10.push(obj[item].P10)
            dataP15.push(obj[item].P15)
            dataP25.push(obj[item].P25)
            dataP50.push(obj[item].P50)
            dataP75.push(obj[item].P75)
            dataP85.push(obj[item].P85)
            dataP90.push(obj[item].P90)
            dataP95.push(obj[item].P95)
            dataP97.push(obj[item].P97)
            dataP99.push(obj[item].P99)
          }
          

          new Chart(ctx, {
            type: "line",
            data: {
              labels: labels,
              datasets: 
              
              [
                
                {
                    label: "1st percentile",
                    data: dataP1,
                    fill: false,
                    pointRadius: 0,
                    borderWidth: 2,
                    borderColor: "rgba(78, 141, 239, 0.4)",
                    lineTension: TENSION,
                  },
                  {
                    label: "3rd percentile",
                    data: dataP3,
                    fill: false,
                    pointRadius: 0,
                    borderWidth: 2,
                    borderColor: "rgba(78, 141, 239, 0.4)",
                    lineTension: TENSION,
                  },
                  {
                    label: "5th percentile",
                    data: dataP5,
                    fill: false,
                    pointRadius: 0,
                    borderWidth: 2,
                    borderColor: "rgba(78, 141, 239, 0.4)",
                    lineTension: TENSION,
                  },
                  {
                    label: "10th percentile",
                    data: dataP10,
                    fill: false,
                    pointRadius: 0,
                    borderWidth: 2,
                    borderColor: "rgba(78, 141, 239, 0.4)",
                    lineTension: TENSION,
                  },
                  {
                    label: "15th percentile",
                    data: dataP15,
                    fill: false,
                    pointRadius: 0,
                    borderWidth: 2,
                    borderColor: "rgba(78, 141, 239, 0.4)",
                    lineTension: TENSION,
                  },
                  {
                    label: "25th percentile",
                    data: dataP25,
                    fill: false,
                    pointRadius: 0,
                    borderWidth: 2,
                    borderColor: "rgba(78, 141, 239, 0.4)",
                    lineTension: TENSION,
                  },
                  {
                    label: "50th percentile",
                    data: dataP50,
                    fill: false,
                    pointRadius: 0,
                    borderWidth: 2,
                    borderColor: "rgba(78, 141, 239, 0.4)",
                    lineTension: TENSION,
                  },
                  {
                    label: "75th percentile",
                    data: dataP75,
                    fill: false,
                    pointRadius: 0,
                    borderWidth: 2,
                    borderColor: "rgba(78, 141, 239, 0.4)",
                    lineTension: TENSION,
                  },
                  {
                    label: "85th percentile",
                    data: dataP85,
                    pointRadius: 0,
                    borderWidth: 2,
                    fill: false,
                    borderColor: "rgba(78, 141, 239, 0.4)",
                    lineTension: TENSION,
                  },
                  {
                    label: "90th percentile",
                    data: dataP90,
                    pointRadius: 0,
                    borderWidth: 2,
                    fill: false,
                    borderColor: "rgba(78, 141, 239, 0.4)",
                    lineTension: TENSION,
                  },
                  {
                    label: "95th percentile",
                    data: dataP95,
                    pointRadius: 0,
                    borderWidth: 2,
                    fill: false,
                    borderColor: "rgba(78, 141, 239, 0.4)",
                    lineTension: TENSION,
                  },
                  {
                    label: "97th percentile",
                    data: dataP97,
                    pointRadius: 0,
                    borderWidth: 2,
                    fill: false,
                    borderColor: "rgba(78, 141, 239, 0.4)",
                    lineTension: TENSION,
                  },
                  {
                    label: "99th percentile",
                    data: dataP99,
                    pointRadius: 0,
                    borderWidth: 2,
                    fill: false,
                    borderColor: "rgba(78, 141, 239, 0.4)",
                    lineTension: TENSION,
                  },
                {
                  label: cur_frm.doc.patient,
                  data: anthropometry_history,
                  fill: false,
                  borderColor: "black",
                  lineTension: TENSION,
                  backgroundColor: "black",
                  pointStyle: 'circle',
                  pointRadius: 3,
                  pointHoverRadius: 6
                },
              ],
            },
            options: {
              animations: {
                radius: {
                  duration: 400,
                  easing: 'linear',
                  loop: (context) => context.active
                }
              },
              hoverRadius: 3,
              hoverBackgroundColor: '#2490ef',
              interaction: {
                mode: 'nearest',
                intersect: true,
                axis: 'y'
              },
              responsive: true,
              plugins: {
                title: {
                  display: true,
                  text: cur_frm.doc.patient + "'s BMI for Age Growth Chart",
                },
              },
              scales: {
                x: {
                  title : {
                    display: true,
                    text: "Age (Months)",
                  },
                },
                y: {
                  title :{
                    display: true,
                    text: "BMI (kg/m2)",
                  },
                },
              },
            },
          });


        });

    } else if (totalMonths >= 24 && totalMonths < 60) {


      // GENERATING CHARTS FOR BMI PERCENTILE MONTH 24 - 60

      // Check for patient sex and age to generate the right link
      var Twenty4to60
      if (totalMonths >= 24 && totalMonths < 60 && cur_frm.doc.patient_sex == "Male") {
        console.log("Male under 60 months")
        Twenty4to60 = "/assets/gch_custom/js/patient_encounter/percentile_data/bmi_age_percentile/boysPercentileMonth24To60.json"
      } else if (totalMonths > 24 && totalMonths < 60 && cur_frm.doc.patient_sex == "Female") {
        console.log("Female under 60 months")
        Twenty4to60 = "/assets/gch_custom/js/patient_encounter/percentile_data/bmi_age_percentile/girlsPercentileMonth24To60.json"
      }
      
      fetch(
        Twenty4to60
      )
        .then((response) => {
          return response.json();
        })
        .then((data) => (obj = data))
        .then(() => {
          // Generating chart for age 24 - 60
          
          console.log(obj)

          var labels = []; 
          var dataP1=[];
          var dataP3=[];
          var dataP5=[];
          var dataP10=[];
          var dataP15=[];
          var dataP25=[];
          var dataP50=[];
          var dataP75=[];
          var dataP85=[];
          var dataP90=[];
          var dataP95=[];
          var dataP97=[];
          var dataP99=[];


          for (var item in obj) {
            labels.push(obj[item].Month)
            dataP1.push(obj[item].P1)
            dataP3.push(obj[item].P3)
            dataP5.push(obj[item].P5)
            dataP10.push(obj[item].P10)
            dataP15.push(obj[item].P15)
            dataP25.push(obj[item].P25)
            dataP50.push(obj[item].P50)
            dataP75.push(obj[item].P75)
            dataP85.push(obj[item].P85)
            dataP90.push(obj[item].P90)
            dataP95.push(obj[item].P95)
            dataP97.push(obj[item].P97)
            dataP99.push(obj[item].P99)
          }
          

          new Chart(ctx, {
            type: "line",
            data: {
              labels: labels,
              datasets: 
              
              [
                
                {
                    label: "1st percentile",
                    data: dataP1,
                    fill: false,
                    pointRadius: 0,
                    borderWidth: 2,
                    borderColor: "rgba(0, 255, 0, 0.4)",
                    lineTension: TENSION,
                  },
                  {
                    label: "3rd percentile",
                    data: dataP3,
                    fill: false,
                    pointRadius: 0,
                    borderWidth: 2,
                    borderColor: "rgba(53, 129, 184, 0.4)",
                    lineTension: TENSION,
                  },
                  {
                    label: "5th percentile",
                    data: dataP5,
                    fill: false,
                    pointRadius: 0,
                    borderWidth: 2,
                    borderColor: "rgba(239, 189, 235, 0.4)",
                    lineTension: TENSION,
                  },
                  {
                    label: "10th percentile",
                    data: dataP10,
                    fill: false,
                    pointRadius: 0,
                    borderWidth: 2,
                    borderColor: "rgba(179, 123, 179, 0.4)",
                    lineTension: TENSION,
                  },
                  {
                    label: "15th percentile",
                    data: dataP15,
                    fill: false,
                    pointRadius: 0,
                    borderWidth: 2,
                    borderColor: "rgba(59, 232, 223, 0.4)",
                    lineTension: TENSION,
                  },
                  {
                    label: "25th percentile",
                    data: dataP25,
                    fill: false,
                    pointRadius: 0,
                    borderWidth: 2,
                    borderColor: "rgba(211, 218, 39, 0.4)",
                    lineTension: TENSION,
                  },
                  {
                    label: "50th percentile",
                    data: dataP50,
                    fill: false,
                    pointRadius: 0,
                    borderWidth: 2,
                    borderColor: "rgba(88, 0, 288, 0.4)",
                    lineTension: TENSION,
                  },
                  {
                    label: "75th percentile",
                    data: dataP75,
                    fill: false,
                    pointRadius: 0,
                    borderWidth: 2,
                    borderColor: "rgba(255, 255, 56, 0.4)",
                    lineTension: TENSION,
                  },
                  {
                    label: "85th percentile",
                    data: dataP85,
                    pointRadius: 0,
                    borderWidth: 2,
                    fill: false,
                    borderColor: "rgba(248, 150, 216, 0.4)",
                    lineTension: TENSION,
                  },
                  {
                    label: "90th percentile",
                    data: dataP90,
                    pointRadius: 0,
                    borderWidth: 2,
                    fill: false,
                    borderColor: "rgba(255, 139, 56, 0.4)",
                    lineTension: TENSION,
                  },
                  {
                    label: "95th percentile",
                    data: dataP95,
                    pointRadius: 0,
                    borderWidth: 2,
                    fill: false,
                    borderColor: "rgba(248, 150, 216, 0.4)",
                    lineTension: TENSION,
                  },
                  {
                    label: "97th percentile",
                    data: dataP97,
                    pointRadius: 0,
                    borderWidth: 2,
                    fill: false,
                    borderColor: "rgba(36, 141, 239, 0.4)",
                    lineTension: TENSION,
                  },
                  {
                    label: "99th percentile",
                    data: dataP99,
                    pointRadius: 0,
                    borderWidth: 2,
                    fill: false,
                    borderColor: "rgba(78, 141, 239, 0.4)",
                    lineTension: TENSION,
                  },
                {
                  label: cur_frm.doc.patient,
                  data: anthropometry_history,
                  fill: false,
                  borderColor: "black",
                  lineTension: TENSION,
                  backgroundColor: "black",
                  pointStyle: 'circle',
                  pointRadius: 3,
                  pointHoverRadius: 6
                },
              ],
            },
            options: {
              animations: {
                radius: {
                  duration: 400,
                  easing: 'linear',
                  loop: (context) => context.active
                }
              },
              hoverRadius: 3,
              hoverBackgroundColor: '#2490ef',
              interaction: {
                mode: 'nearest',
                intersect: true,
                axis: 'y'
              },
              responsive: true,
              plugins: {
                title: {
                  display: true,
                  text: cur_frm.doc.patient + "'s BMI for Age Growth Chart",
                },
              },
              scales: {
                x: {
                  title : {
                    display: true,
                    text: "Age (Months)",
                  },
                },
                y: {
                  title :{
                    display: true,
                    text: "BMI (kg/m2)",
                  },
                },
              },
            },
          });


        });

    } else {

      // GENERATING CHARTS FOR BMI PERCENTILE MONTH 60 - 240

      // Check for patient sex and age to generate the right link
      var sixtyto240
      if (totalMonths >= 60 && totalMonths <= 240 && cur_frm.doc.patient_sex == "Male") {
        console.log("Male under 240 months")
        sixtyto240 = "/assets/gch_custom/js/patient_encounter/percentile_data/bmi_age_percentile/boysPercentileMonth60to240.json"
      } else if (totalMonths >= 60 && totalMonths <= 240 && cur_frm.doc.patient_sex == "Female") {
        console.log("Female under 240 months")
        sixtyto240 = "/assets/gch_custom/js/patient_encounter/percentile_data/bmi_age_percentile/girlsPercentileMonth60to240.json"
      }
      
      fetch(
        sixtyto240
      )
        .then((response) => {
          return response.json();
        })
        .then((data) => (obj = data))
        .then(() => {
          // Generating chart for age 60 - 240
          
          console.log("Data............", obj[216].Agemos)
          
          var labels = []; 
          var dataP3=[];
          var dataP5=[];
          var dataP10=[];
          var dataP25=[];
          var dataP50=[];
          var dataP75=[];
          var dataP85=[];
          var dataP90=[];
          var dataP95=[];
          var dataP97=[];


          for (var item in obj) {
            labels.push(obj[item].Agemos)
            dataP3.push(obj[item].P3)
            dataP5.push(obj[item].P5)
            dataP10.push(obj[item].P10)
            dataP25.push(obj[item].P25)
            dataP50.push(obj[item].P50)
            dataP75.push(obj[item].P75)
            dataP85.push(obj[item].P85)
            dataP90.push(obj[item].P90)
            dataP95.push(obj[item].P95)
            dataP97.push(obj[item].P97)
          }

          new Chart(ctx, {
            type: "line",
            data: {
              labels: labels,

              datasets: 
              
              [
                
                {
                  label: "3rd percentile",
                  data: dataP3,
                  fill: false,
                  pointRadius: 0,
                  borderWidth: 2.5,
                  borderColor: "rgba(0, 255, 0, 0.6)",
                  lineTension: TENSION,
                },
                {
                  label: "5th percentile",
                  data: dataP5,
                  fill: false,
                  pointRadius: 0,
                  borderWidth: 2.5,
                  borderColor: "rgba(239, 189, 235, 0.6)",
                  lineTension: TENSION,
                },
                {
                  label: "10th percentile",
                  data: dataP10,
                  fill: false,
                  pointRadius: 0,
                  borderWidth: 2.5,
                  borderColor: "rgba(174, 183, 179, 0.6)",
                  lineTension: TENSION,
                },
                {
                  label: "25th percentile",
                  data: dataP25,
                  fill: false,
                  pointRadius: 0,
                  borderWidth: 2.5,
                  borderColor: "rgba(159, 252, 223, 0.6)",
                  lineTension: TENSION,
                },
                {
                  label: "50th percentile",
                  data: dataP50,
                  fill: false,
                  pointRadius: 0,
                  borderWidth: 2.5,
                  borderColor: "rgba(211, 218, 39, 0.6)",
                  lineTension: TENSION,
                },
                {
                  label: "75th percentile",
                  data: dataP75,
                  fill: false,
                  pointRadius: 0,
                  borderWidth: 2.5,
                  borderColor: "rgba(255, 255, 56, 0.6)",
                  lineTension: TENSION,
                },
                {
                  label: "85th percentile",
                  data: dataP85,
                  fill: false,
                  pointRadius: 0,
                  borderWidth: 2.5,
                  borderColor: "rgba(248, 150, 216, 0.6)",
                  lineTension: TENSION,
                },
                {
                  label: "90th percentile",
                  data: dataP90,
                  fill: false,
                  pointRadius: 0,
                  borderWidth: 2.5,
                  borderColor: "rgba(255, 139, 56, 0.6)",
                  lineTension: TENSION,
                },
                {
                  label: "95th percentile",
                  data: dataP95,
                  fill: false,
                  pointRadius: 0,
                  borderWidth: 2.5,
                  borderColor: "rgba(248, 150, 216, 0.6)",
                  lineTension: TENSION,
                },
                {
                  label: "97th percentile",
                  data: dataP97,
                  fill: false,
                  pointRadius: 0,
                  borderWidth: 2.5,
                  borderColor: "rgba(36, 141, 239, 0.6)",
                  lineTension: TENSION,
                },
                
                {
                  label: cur_frm.doc.patient,
                  data: anthropometry_history,
                  fill: false,
                  borderColor: "black",
                  lineTension: TENSION,
                  backgroundColor: "black",
                  pointStyle: 'circle',
                  pointRadius: 3,
                  pointHoverRadius: 6
                },
              ],
            },
            options: {
              animations: {
                radius: {
                  duration: 400,
                  easing: 'linear',
                  loop: (context) => context.active
                }
              },
              hoverRadius: 3,
              hoverBackgroundColor: '#2490ef',
              interaction: {
                mode: 'nearest',
                intersect: true,
                axis: 'y'
              },
              responsive: true,
              plugins: {
                title: {
                  display: true,
                  text: cur_frm.doc.patient + "'s BMI for Age Growth Chart",
                },
              },
              scales: {
                x: {
                  title : {
                    display: true,
                    text: "Age (Months)",
                  },
                },
                y: {
                  title :{
                    display: true,
                    text: "BMI (kg/m2)",
                  },
                },
              },
            },
          });


        });
      }
  });
  