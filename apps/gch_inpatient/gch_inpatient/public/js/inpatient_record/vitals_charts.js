// Generating Vitals Charts
frappe.require("/assets/gch_custom/js/patient_encounter/percentile_data/chart.js", function() {
    
    let patient = cur_frm.doc.patient
    let patient_uhid = cur_frm.doc.uhid

    
    
    let dateBundle = document.createElement("script")

    dateBundle.setAttribute("src", "https://cdn.jsdelivr.net/npm/chartjs-adapter-date-fns/dist/chartjs-adapter-date-fns.bundle.min.js")
    dateBundle.async = false;
    document.body.appendChild(dateBundle);

    // console.log(vitals_data)

    let anthropometry_history = []

    console.log(patient, patient_uhid)
    // frappe.call({
    //   method: "gch_custom.services.rest.fetch_anthropometry_history",
    //   async: false,
    //   args: {
    //     patient, patient_uhid
    //   },
    //   callback: function (res) {
         
    //     $.each(res.message, function(_i, e){
          

    //       // CONVERT PATIENT_AGE TO MONTHS
    //       var getYears = parseInt(e.patient_age.trim().split(/\s+/)[0]) * 12;
    //       var getMonths = parseInt(e.patient_age.trim().split(/\s+/)[2]);
    //       var getDays = parseInt(e.patient_age.trim().split(/\s+/)[4]);

    //       // Assuming 28+ days to be a month
    //       if (getDays >= 28) {
    //         getMonths += 1;
    //       }

    //       // GETTING TOTAL NUMBER OF MONTHS
    //       var totalMonths = parseInt(getYears + getMonths);



    //       anthropometry_history.push([totalMonths, e.height_in_centimeters])

    //       console.log(e)
    //     })

    //     console.log(anthropometry_history)
         
    //   }

    // })

          
    const TENSION = 0.2;
    var ctx = document.getElementById("vitalsChart").getContext("2d");


    let vitals_data = cur_frm.doc.vital_signs_table

    var labels = []; 

    // 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24
    
    var dataTemperature=[];
    var dataHeartrate=[];
    var dataRespiratoryrate=[];
    var dataSystolic=[];
    var dataDiastolic=[];
    var dataOxygensaturation=[];


    for (var row in vitals_data) {
        // labels.push(obj[item].Month)
        console.log(vitals_data[row].patient_encounter_temperature, "Vitals row")

        console.log(vitals_data[row].recorded_at.split(" ")[0], vitals_data[row].recorded_at.split(" ")[1])

        dataTemperature.push(vitals_data[row].patient_encounter_temperature)
        dataHeartrate.push(vitals_data[row].patient_encounter_heart_rate)
        dataRespiratoryrate.push(vitals_data[row].patient_encounter_respiratory_rate)
        dataSystolic.push(vitals_data[row].patient_encounter_bp_systolic)
        dataDiastolic.push(vitals_data[row].patient_encounter_bp_diastolic)
        dataOxygensaturation.push(vitals_data[row].patient_encounter_percutaneous_oxygen)
        
        labels.push(vitals_data[row].recorded_at)
    }
    

    new Chart(ctx, {
    type: "line",
    data: {
        labels: labels,
        datasets: 
        
        [
        
        {
            label: "Temperature",
            data: dataTemperature,
            fill: false,
            pointRadius: 2,
            pointHoverRadius: 5,
            borderWidth: 4,
            borderColor: "rgba(0, 255, 0, 0.4)",
            lineTension: TENSION,
            },
            {
            label: "Heart Rate",
            data: dataHeartrate,
            fill: false,
            pointRadius: 2,
            pointHoverRadius: 5,
            borderWidth: 4,
            borderColor: "rgba(53, 129, 184, 0.4)",
            lineTension: TENSION,
            },
            {
            label: "Respiratory Rate",
            data: dataRespiratoryrate,
            fill: false,
            pointRadius: 2,
            pointHoverRadius: 5,
            borderWidth: 4,
            borderColor: "rgba(239, 189, 235, 0.4)",
            lineTension: TENSION,
            },
            {
            label: "BP Systolic",
            data: dataSystolic,
            fill: false,
            pointRadius: 2,
            pointHoverRadius: 5,
            borderWidth: 4,
            borderColor: "rgba(179, 123, 179, 0.4)",
            lineTension: TENSION,
            },
            {
            label: "BP Diastolic",
            data: dataDiastolic,
            fill: false,
            pointRadius: 2,
            pointHoverRadius: 5,
            borderWidth: 4,
            borderColor: "rgba(59, 232, 223, 0.4)",
            lineTension: TENSION,
            },
            {
            label: "Oxygen Saturation",
            data: dataOxygensaturation,
            fill: false,
            pointRadius: 2,
            pointHoverRadius: 5,
            borderWidth: 4,
            borderColor: "rgba(211, 218, 39, 0.4)",
            lineTension: TENSION,
            },
        // {
        //   label: cur_frm.doc.patient,
        //   data: anthropometry_history,
        //   fill: false,
        //   borderColor: "black",
        //   lineTension: TENSION,
        //   backgroundColor: "black",
        //   pointStyle: 'circle',
        //   pointRadius: 3,
        //   pointHoverRadius: 6
        // },
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
            text: cur_frm.doc.patient + "'s Vitals Chart",
        },
        },
        scales: {
        x: {
            title : {
            display: true,
            text: "Time (Hours)",
            },
            type: 'time',
            time: {
            unit: "hour"
            }
        },
        y: {
            title :{
            display: true,
            text: "Value",
            },
        },
        },
    },
    });


});
