// Generating PCCU Vitals Charts
frappe.require("/assets/gch_custom/js/patient_encounter/percentile_data/chart.js", function() {
    
    let patient = cur_frm.doc.patient
    let patient_uhid = cur_frm.doc.uhid


    $.getScript('https://cdn.jsdelivr.net/npm/chartjs-adapter-date-fns/dist/chartjs-adapter-date-fns.bundle.min.js', function () {

        console.log(patient, patient_uhid)
    

          
        const TENSION = 0.2;
        var ctx = document.getElementById("vitalsChart").getContext("2d");


        let vitals_data = cur_frm.doc.pccu_vital_signs_table

        var labels = []; 
        // '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23', '24', '1', '2', '3', '4', '5', '6'
        
        var dataPulseRate=[];
        var dataIbp=[];
        var dataMeanIbp=[];
        var datanNibp=[];
        var dataMeanNibp=[];
        var dataCerebralPerfusionPressure=[];
        var dataRespiratoryRate=[];
        var dataTemperature = []
        var dataCentralVenousPressure=[]
        var dataPulmonaryArteryRate=[]
        var dataLeftAtrialPressure=[]
        var dataSpo2 = []
        var dataBrainSaturation = []

        for (var row in vitals_data) {
            // labels.push(obj[item].Month)
            console.log(vitals_data[row], "Vitals row")

            console.log(vitals_data[row].recorded_at.split(" ")[0], vitals_data[row].recorded_at.split(" ")[1])
            
            dataPulseRate.push(vitals_data[row].pulse_rate)
            dataIbp.push(vitals_data[row].invasive_blood_pressure)
            dataMeanIbp.push(vitals_data[row].mean_invasive_blood_pressure)
            datanNibp.push(vitals_data[row].non_invasive_blood_pressure)
            dataMeanNibp.push(vitals_data[row].mean_non_invasive_blood_pressure)
            dataCerebralPerfusionPressure.push(vitals_data[row].cerebral_perfusion_pressure)
            dataRespiratoryRate.push(vitals_data[row].respiratory_rate)
            dataTemperature.push(vitals_data[row].temperature)
            dataCentralVenousPressure.push(vitals_data[row].central_venous_pressure)
            dataPulmonaryArteryRate.push(vitals_data[row].pulmonary_artery)
            dataLeftAtrialPressure.push(vitals_data[row].left_atrial_pressure)
            dataSpo2.push(vitals_data[row].spo2)
            dataBrainSaturation.push(vitals_data[row].brain_saturation)
            
            labels.push(vitals_data[row].recorded_at)
        }
        

        new Chart(ctx, {
        type: "line",
        data: {
            labels: labels,
            datasets: 
            
            [
            {
                label: "Pulse Rate",
                data: dataPulseRate,
                fill: false,
                pointRadius: 2,
                pointHoverRadius: 5,
                borderWidth: 4,
                borderColor: "rgba(10, 250, 64, 0.5)",
                lineTension: TENSION,
                },
                {
                label: "IBP",
                data: dataIbp,
                fill: false,
                pointRadius: 2,
                pointHoverRadius: 5,
                borderWidth: 4,
                borderColor: "rgba(0, 255, 0, 0.5)",
                lineTension: TENSION,
                },
                {
                label: "Mean IBP",
                data: dataMeanIbp,
                fill: false,
                pointRadius: 2,
                pointHoverRadius: 5,
                borderWidth: 4,
                borderColor: "rgba(53, 129, 184, 0.5)",
                lineTension: TENSION,
                },
                {
                label: "NIBP",
                data: datanNibp,
                fill: false,
                pointRadius: 2,
                pointHoverRadius: 5,
                borderWidth: 4,
                borderColor: "rgba(53, 129, 184, 0.5)",
                lineTension: TENSION,
                },
                {
                label: "Mean NIBP",
                data: dataMeanNibp,
                fill: false,
                pointRadius: 2,
                pointHoverRadius: 5,
                borderWidth: 4,
                borderColor: "rgba(239, 189, 235, 0.5)",
                lineTension: TENSION,
                },
                {
                label: "Celebral Perfusion Pressure",
                data: dataCerebralPerfusionPressure,
                fill: false,
                pointRadius: 2,
                pointHoverRadius: 5,
                borderWidth: 4,
                borderColor: "rgba(179, 123, 179, 0.5)",
                lineTension: TENSION,
                },
                {
                label: "Respiratory Rate",
                data: dataRespiratoryRate,
                fill: false,
                pointRadius: 2,
                pointHoverRadius: 5,
                borderWidth: 4,
                borderColor: "rgba(59, 232, 223, 0.5)",
                lineTension: TENSION,
                },
                {
                label: "Temperature",
                data: dataTemperature,
                fill: false,
                pointRadius: 2,
                pointHoverRadius: 5,
                borderWidth: 4,
                borderColor: "rgba(211, 218, 39, 0.5)",
                lineTension: TENSION,
                },
                {
                label: "Central Venous Pressure",
                data: dataCentralVenousPressure,
                fill: false,
                pointRadius: 2,
                pointHoverRadius: 5,
                borderWidth: 4,
                borderColor: "rgba(77, 18, 62, 0.5)",
                lineTension: TENSION,
                },
                {
                label: "Pulmonary Artery Rate",
                data: dataPulmonaryArteryRate,
                fill: false,
                pointRadius: 2,
                pointHoverRadius: 5,
                borderWidth: 4,
                borderColor: "rgba(37, 118, 24, 0.5)",
                lineTension: TENSION,
                },

                {
                label: "Left Atrial Pressure",
                data: dataLeftAtrialPressure,
                fill: false,
                pointRadius: 2,
                pointHoverRadius: 5,
                borderWidth: 4,
                borderColor: "rgba(10, 18, 100, 0.5)",
                lineTension: TENSION,
                },
                {
                label: "SPO2",
                data: dataSpo2,
                fill: false,
                pointRadius: 2,
                pointHoverRadius: 5,
                borderWidth: 4,
                borderColor: "rgba(210, 184, 13, 0.5)",
                lineTension: TENSION,
                },
                {
                label: "Brain Saturation",
                data: dataBrainSaturation,
                fill: false,
                pointRadius: 2,
                pointHoverRadius: 5,
                borderWidth: 4,
                borderColor: "rgba(24, 18, 139, 0.5)",
                lineTension: TENSION,
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
                text: cur_frm.doc.patient + "'s PCCU Vitals Chart",
            },
            },
            scales: {
            x: {
                title : {
                display: true,
                text: "Time",
                },
                type: 'time',
                time: {
                    unit: "minute"
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


    })

    

});
