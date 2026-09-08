// Copyright (c) 2022, Karani and contributors
// For license information, please see license.txt

let FREQUENCY_OPTIONS = [
    "Every 24 hrs",
    "Every 12 hrs",
    "Every 8 hrs",
    "Every 6 hrs",
    "Every 5 hrs",
    "Every 4 hrs",
    "Every 3 hrs",
    "Every 2 hrs",
    "Every 1 hr",
    "As Needed",
    "Stat",
    "Weekly",
    "Monthly",
    "Quarterly",
];

let range = (start, end) => {
    return Array(end - start + 1)
      .fill()
      .map((_, idx) => start + idx);
};

frappe.ui.form.on('Dental Clinic Procedure', {
	// refresh: function(frm) {

	// }

    setup: function(frm) {

        console.log("Setuuppppppp........")

        // Filtering Dental Prodedure Item section to only show Dental Items First Procedure
        cur_frm.set_query("procedure", "dental_procedure_table", function() {
            return {
              query: "gch_custom.gch_custom.doctype.dental_clinic_procedure.dental_clinic_procedure.show_procedure_and_price",
              filters: [
                ["item_group", "in", ["Dental"]]
              ]
            }
        })
        

        // Filtering Dental Prodedure Item section to only show Dental Item Second Procedure
        cur_frm.set_query("second_procedure", "dental_procedure_table", function() {
            return {
              query: "gch_custom.gch_custom.doctype.dental_clinic_procedure.dental_clinic_procedure.show_procedure_and_price",
              filters: [
                ["item_group", "in", ["Dental"]]
              ]
            }
        })

        // Filtering Dental Prodedure Item section to only show Dental Third Procedure
        cur_frm.set_query("third_procedure", "dental_procedure_table", function() {
            return {
                query: "gch_custom.gch_custom.doctype.dental_clinic_procedure.dental_clinic_procedure.show_procedure_and_price",
              filters: [
                ["item_group", "in", ["Dental"]]
              ]
            }
        })

        // Filtering Dental Prodedure Item section to only show Dental Fourth Procedure
        cur_frm.set_query("fourth_procedure", "dental_procedure_table", function() {
            return {
                query: "gch_custom.gch_custom.doctype.dental_clinic_procedure.dental_clinic_procedure.show_procedure_and_price",
              filters: [
                ["item_group", "in", ["Dental"]]
              ]
            }
        })


        // Filtering medical codes to ICD-10-Diagnosis 
        cur_frm.set_query("medical_code", "diagnosis_table", function() {
            return {
              query: "gch_custom.services.rest.group_medical_query",
              filters: [
                ["medical_code_standard", "in", ["ICD-10-Diagnosis"]]
              ]
            }
        })

        frm.set_df_property("diagnosis_table", "reqd", 1);
        // frm.set_df_property("dental_procedure_table", "reqd", 1);


    },

    validate: function(frm) {

        // frappe.call({
        //     method: "gch_custom.services.rest.add_doctor_prescription_to_encounter",
        //     args: {
        //         patient_encounter: patient_encounter,
        //         doctor_prescriptions: cur_frm.doc.prescription_table
        //     },callback(r) {
        //         if(r.message) {
        //             console.log(r.message)
        //         } else {
        //             console.log(r)
        //         }
        //     }
        // })

        // let patient_encounter = cur_frm.doc.patient_encounter

        // frappe.call({
        //     method: "gch_custom.services.rest.add_dental_diagnosis_to_encounter",
        //     args: {
        //         patient_encounter: patient_encounter,
        //         medical_codes: cur_frm.doc.diagnosis_table
        //     },callback(r) {
        //         if(r.message) {
        //             console.log(r.message)
        //         } else {
        //             console.log(r)
        //         }
        //     }
        // })
        
    },

    refresh: function(frm) {
        // Changing page width defaults to ensure the smileys appear at the right place
        let body = document.getElementsByClassName("page-body")
        
        body[0].style.maxWidth = "1290px"
cur_frm.doc.dental_procedure_table

        //Checking if dental procedure table has items to render the smileys on the dental template
        let dentalItems = cur_frm.doc.dental_procedure_table

        let dentalItemsIdArray = []

        for (let i in dentalItems) {
            dentalItemsIdArray.push(dentalItems[i].tooth_number)
        }

        console.log(dentalItemsIdArray)

        for (let x in dentalItemsIdArray) {
            if (dentalItemsIdArray[x] == "55") {

                const img = document.createElement("img")
                img.id = "55"
                // Create smiley image properties
                img.src = "/files/smiley.png"
                img.width = "18"
                img.title = "55"
                img.style.position = "absolute"
                img.style.top = "35%"
                img.style.left = "21%"
                document.querySelector('[data-fieldname="dental_screen_gch"]').appendChild(img)

            } else if (dentalItemsIdArray[x] == "54") {
                const img = document.createElement("img")
                img.id = "54"
                img.src = "/files/smiley.png"
                img.width = "18"
                img.style.position = "absolute"
                img.style.top = "28%"
                img.style.left = "21.5%"
                document.querySelector('[data-fieldname="dental_screen_gch"]').appendChild(img)

            } else if (dentalItemsIdArray[x] == "53") {
                const img = document.createElement("img")
                img.id = "53"
                img.src = "/files/smiley.png"
                img.width = "18"
                img.style.position = "absolute"
                img.style.top = "23%"
                img.style.left = "23%"
                document.querySelector('[data-fieldname="dental_screen_gch"]').appendChild(img)

            } else if (dentalItemsIdArray[x] == "52") {
                const img = document.createElement("img")
                img.id = "52"
                img.src = "/files/smiley.png"
                img.width = "18"
                img.style.position = "absolute"
                img.style.top = "19.3%"
                img.style.left = "24.4%"
                document.querySelector('[data-fieldname="dental_screen_gch"]').appendChild(img)

            } else if (dentalItemsIdArray[x] == "51") {
                const img = document.createElement("img")
                img.id = "51"
                img.src = "/files/smiley.png"
                img.width = "18"
                img.style.position = "absolute"
                img.style.top = "17.5%"
                img.style.left = "26%"
                document.querySelector('[data-fieldname="dental_screen_gch"]').appendChild(img)

            } else if (dentalItemsIdArray[x] == "65") {
                const img = document.createElement("img")
                img.id = "65"
                img.src = "/files/smiley.png"
                img.width = "18"
                img.style.position = "absolute"
                img.style.top = "35%"
                img.style.left = "34%"
                document.querySelector('[data-fieldname="dental_screen_gch"]').appendChild(img)

            } else if (dentalItemsIdArray[x] == "64") {
                const img = document.createElement("img")
                img.id = "64"
                img.src = "/files/smiley.png"
                img.width = "18"
                img.style.position = "absolute"
                img.style.top = "28%"
                img.style.left = "33%"
                document.querySelector('[data-fieldname="dental_screen_gch"]').appendChild(img)

            } else if (dentalItemsIdArray[x] == "63") {
                const img = document.createElement("img")
                img.id = "63"
                img.src = "/files/smiley.png"
                img.width = "18"
                img.style.position = "absolute"
                img.style.top = "23%"
                img.style.left = "32%"
                document.querySelector('[data-fieldname="dental_screen_gch"]').appendChild(img)

            } else if (dentalItemsIdArray[x] == "62") {
                const img = document.createElement("img")
                img.id = "62"
                img.src = "/files/smiley.png"
                img.width = "18"
                img.style.position = "absolute"
                img.style.top = "20%"
                img.style.left = "30.3%"
                document.querySelector('[data-fieldname="dental_screen_gch"]').appendChild(img)

            } else if (dentalItemsIdArray[x] == "61") {
                const img = document.createElement("img")
                img.id = "61"
                img.src = "/files/smiley.png"
                img.width = "18"
                img.style.position = "absolute"
                img.style.top = "18.3%"
                img.style.left = "28.4%"
                document.querySelector('[data-fieldname="dental_screen_gch"]').appendChild(img)

            } else if (dentalItemsIdArray[x] == "75") {
                const img = document.createElement("img")
                img.id = "75"
                img.src = "/files/smiley.png"
                img.width = "18"
                img.style.position = "absolute"
                img.style.top = "48%"
                img.style.left = "33.4%"
                document.querySelector('[data-fieldname="dental_screen_gch"]').appendChild(img)

            } else if (dentalItemsIdArray[x] == "74") {
                const img = document.createElement("img")
                img.id = "74"
                img.src = "/files/smiley.png"
                img.width = "18"
                img.style.position = "absolute"
                img.style.top = "55%"
                img.style.left = "32.4%"
                document.querySelector('[data-fieldname="dental_screen_gch"]').appendChild(img)

            } else if (dentalItemsIdArray[x] == "73") {
                const img = document.createElement("img")
                img.id = "73"
                img.src = "/files/smiley.png"
                img.width = "18"
                img.style.position = "absolute"
                img.style.top = "60%"
                img.style.left = "31%"
                document.querySelector('[data-fieldname="dental_screen_gch"]').appendChild(img)

            } else if (dentalItemsIdArray[x] == "72") {
                const img = document.createElement("img")
                img.id = "72"
                img.src = "/files/smiley.png"
                img.width = "18"
                img.style.position = "absolute"
                img.style.top = "64%"
                img.style.left = "29.7%"
                document.querySelector('[data-fieldname="dental_screen_gch"]').appendChild(img)

            } else if (dentalItemsIdArray[x] == "71") {
                const img = document.createElement("img")
                img.id = "71"
                img.src = "/files/smiley.png"
                img.width = "18"
                img.style.position = "absolute"
                img.style.top = "64.3%"
                img.style.left = "28%"
                document.querySelector('[data-fieldname="dental_screen_gch"]').appendChild(img)

            } else if (dentalItemsIdArray[x] == "85") {
                const img = document.createElement("img")
                img.id = "85"
                img.src = "/files/smiley.png"
                img.width = "18"
                img.style.position = "absolute"
                img.style.top = "47.5%"
                img.style.left = "20.7%"
                document.querySelector('[data-fieldname="dental_screen_gch"]').appendChild(img)

            } else if (dentalItemsIdArray[x] == "84") {
                const img = document.createElement("img")
                img.id = "84"
                img.src = "/files/smiley.png"
                img.width = "18"
                img.style.position = "absolute"
                img.style.top = "55%"
                img.style.left = "22%"
                document.querySelector('[data-fieldname="dental_screen_gch"]').appendChild(img)
                

            } else if (dentalItemsIdArray[x] == "83") {
                const img = document.createElement("img")
                img.id = "83"
                img.src = "/files/smiley.png"
                img.width = "18"
                img.style.position = "absolute"
                img.style.top = "60%"
                img.style.left = "23.2%"
                document.querySelector('[data-fieldname="dental_screen_gch"]').appendChild(img)

            } else if (dentalItemsIdArray[x] == "82") {
                const img = document.createElement("img")
                img.id = "82"
                img.src = "/files/smiley.png"
                img.width = "18"
                img.style.position = "absolute"
                img.style.top = "62.5%"
                img.style.left = "24.7%"
                document.querySelector('[data-fieldname="dental_screen_gch"]').appendChild(img)
                

            } else if (dentalItemsIdArray[x] == "81") {
                const img = document.createElement("img")
                img.id = "81"
                img.src = "/files/smiley.png"
                img.width = "18"
                img.style.position = "absolute"
                img.style.top = "64.5%"
                img.style.left = "26.3%"
                document.querySelector('[data-fieldname="dental_screen_gch"]').appendChild(img)

            } else if (dentalItemsIdArray[x] == "18") {
                const img = document.createElement("img")
                img.id = "18"
                img.src = "/files/smiley.png"
                img.width = "18"
                img.style.position = "absolute"
                img.style.top = "42%"
                img.style.right = "38%"
                document.querySelector('[data-fieldname="dental_screen_gch"]').appendChild(img)

            } else if (dentalItemsIdArray[x] == "17") {
                const img = document.createElement("img")
                img.id = "17"
                img.src = "/files/smiley.png"
                img.width = "18"
                img.style.position = "absolute"
                img.style.top = "35.6%"
                img.style.right = "38%"
                document.querySelector('[data-fieldname="dental_screen_gch"]').appendChild(img)

            } else if (dentalItemsIdArray[x] == "16") {
                const img = document.createElement("img")
                img.id = "16"
                img.src = "/files/smiley.png"
                img.width = "18"
                img.style.position = "absolute"
                img.style.top = "30%"
                img.style.right = "37.5%"
                document.querySelector('[data-fieldname="dental_screen_gch"]').appendChild(img)

            } else if (dentalItemsIdArray[x] == "15") {
                const img = document.createElement("img")
                img.id = "15"
                img.src = "/files/smiley.png"
                img.width = "18"
                img.style.position = "absolute"
                img.style.top = "24.6%"
                img.style.right = "36.5%"
                document.querySelector('[data-fieldname="dental_screen_gch"]').appendChild(img)

            } else if (dentalItemsIdArray[x] == "16") {
                const img = document.createElement("img")
                img.id = "16"
                img.src = "/files/smiley.png"
                img.width = "18"
                img.style.position = "absolute"
                img.style.top = "42%"
                img.style.right = "38%"
                document.querySelector('[data-fieldname="dental_screen_gch"]').appendChild(img)

            } else if (dentalItemsIdArray[x] == "15") {
                const img = document.createElement("img")
                img.id = "15"
                img.src = "/files/smiley.png"
                img.width = "18"
                img.style.position = "absolute"
                img.style.top = "42%"
                img.style.right = "38%"
                document.querySelector('[data-fieldname="dental_screen_gch"]').appendChild(img)

            } else if (dentalItemsIdArray[x] == "14") {
                const img = document.createElement("img")
                img.id = "14"
                img.src = "/files/smiley.png"
                img.width = "18"
                img.style.position = "absolute"
                img.style.top = "19.7%"
                img.style.right = "35.5%"
                document.querySelector('[data-fieldname="dental_screen_gch"]').appendChild(img)

            } else if (dentalItemsIdArray[x] == "13") {
                const img = document.createElement("img")
                img.id = "13"
                img.src = "/files/smiley.png"
                img.width = "18"
                img.style.position = "absolute"
                img.style.top = "15.3%"
                img.style.right = "34.4%"
                document.querySelector('[data-fieldname="dental_screen_gch"]').appendChild(img)

            } else if (dentalItemsIdArray[x] == "12") {
                const img = document.createElement("img")
                img.id = "12"
                img.src = "/files/smiley.png"
                img.width = "18"
                img.style.position = "absolute"
                img.style.top = "12%"
                img.style.right = "32.8%"
                document.querySelector('[data-fieldname="dental_screen_gch"]').appendChild(img)

            } else if (dentalItemsIdArray[x] == "11") {
                const img = document.createElement("img")
                img.id = "11"
                img.src = "/files/smiley.png"
                img.width = "18"
                img.style.position = "absolute"
                img.style.top = "10%"
                img.style.right = "30.7%"
                document.querySelector('[data-fieldname="dental_screen_gch"]').appendChild(img)

            } else if (dentalItemsIdArray[x] == "21") {
                const img = document.createElement("img")
                img.id = "21"
                img.src = "/files/smiley.png"
                img.width = "18"
                img.style.position = "absolute"
                img.style.top = "10%"
                img.style.right = "28%"
                document.querySelector('[data-fieldname="dental_screen_gch"]').appendChild(img)

            } else if (dentalItemsIdArray[x] == "22") {
                const img = document.createElement("img")
                img.id = "22"
                img.src = "/files/smiley.png"
                img.width = "18"
                img.style.position = "absolute"
                img.style.top = "12%"
                img.style.right = "25.5%"
                document.querySelector('[data-fieldname="dental_screen_gch"]').appendChild(img)

            } else if (dentalItemsIdArray[x] == "23") {
                const img = document.createElement("img")
                img.id = "23"
                img.src = "/files/smiley.png"
                img.width = "18"
                img.style.position = "absolute"
                img.style.top = "15.3%"
                img.style.right = "24%"
                document.querySelector('[data-fieldname="dental_screen_gch"]').appendChild(img)

            } else if (dentalItemsIdArray[x] == "24") {
                const img = document.createElement("img")
                img.id = "24"
                img.src = "/files/smiley.png"
                img.width = "18"
                img.style.position = "absolute"
                img.style.top = "19.7%"
                img.style.right = "23%"
                document.querySelector('[data-fieldname="dental_screen_gch"]').appendChild(img)

            } else if (dentalItemsIdArray[x] == "25") {
                const img = document.createElement("img")
                img.id = "25"
                img.src = "/files/smiley.png"
                img.width = "18"
                img.style.position = "absolute"
                img.style.top = "24.6%"
                img.style.right = "22%"
                document.querySelector('[data-fieldname="dental_screen_gch"]').appendChild(img)

            } else if (dentalItemsIdArray[x] == "26") {
                const img = document.createElement("img")
                img.id = "26"
                img.src = "/files/smiley.png"
                img.width = "18"
                img.style.position = "absolute"
                img.style.top = "30%"
                img.style.right = "21%"
                document.querySelector('[data-fieldname="dental_screen_gch"]').appendChild(img)

            } else if (dentalItemsIdArray[x] == "27") {
                const img = document.createElement("img")
                img.id = "27"
                img.src = "/files/smiley.png"
                img.width = "18"
                img.style.position = "absolute"
                img.style.top = "35.6%"
                img.style.right = "20.5%"
                document.querySelector('[data-fieldname="dental_screen_gch"]').appendChild(img)

            } else if (dentalItemsIdArray[x] == "28") {
                const img = document.createElement("img")
                img.id = "28"
                img.src = "/files/smiley.png"
                img.width = "18"
                img.style.position = "absolute"
                img.style.top = "42%"
                img.style.right = "20.7%"
                document.querySelector('[data-fieldname="dental_screen_gch"]').appendChild(img)

            } else if (dentalItemsIdArray[x] == "31") {
                const img = document.createElement("img")
                img.id = "31"
                img.src = "/files/smiley.png"
                img.width = "18"
                img.style.position = "absolute"
                img.style.top = "82%"
                img.style.right = "28%"
                document.querySelector('[data-fieldname="dental_screen_gch"]').appendChild(img)

            } else if (dentalItemsIdArray[x] == "32") {
                const img = document.createElement("img")
                img.id = "32"
                img.src = "/files/smiley.png"
                img.width = "18"
                img.style.position = "absolute"
                img.style.top = "80.5%"
                img.style.right = "26.5%"
                document.querySelector('[data-fieldname="dental_screen_gch"]').appendChild(img)

            } else if (dentalItemsIdArray[x] == "33") {
                const img = document.createElement("img")
                img.id = "33"
                img.src = "/files/smiley.png"
                img.width = "18"
                img.style.position = "absolute"
                img.style.top = "78%"
                img.style.right = "25%"
                document.querySelector('[data-fieldname="dental_screen_gch"]').appendChild(img)

            } else if (dentalItemsIdArray[x] == "34") {
                const img = document.createElement("img")
                img.id = "34"
                img.src = "/files/smiley.png"
                img.width = "18"
                img.style.position = "absolute"
                img.style.top = "73.7%"
                img.style.right = "23.6%"
                document.querySelector('[data-fieldname="dental_screen_gch"]').appendChild(img)

            } else if (dentalItemsIdArray[x] == "35") {
                const img = document.createElement("img")
                img.id = "35"
                img.src = "/files/smiley.png"
                img.width = "18"
                img.style.position = "absolute"
                img.style.top = "68.6%"
                img.style.right = "22%"
                document.querySelector('[data-fieldname="dental_screen_gch"]').appendChild(img)

            } else if (dentalItemsIdArray[x] == "36") {
                const img = document.createElement("img")
                img.id = "36"
                img.src = "/files/smiley.png"
                img.width = "18"
                img.style.position = "absolute"
                img.style.top = "63%"
                img.style.right = "21%"
                document.querySelector('[data-fieldname="dental_screen_gch"]').appendChild(img)

            } else if (dentalItemsIdArray[x] == "37") {
                const img = document.createElement("img")
                img.id = "37"
                img.src = "/files/smiley.png"
                img.width = "18"
                img.style.position = "absolute"
                img.style.top = "55.6%"
                img.style.right = "20.5%"
                document.querySelector('[data-fieldname="dental_screen_gch"]').appendChild(img)

            } else if (dentalItemsIdArray[x] == "38") {
                const img = document.createElement("img")
                img.id = "38"
                img.src = "/files/smiley.png"
                img.width = "18"
                img.style.position = "absolute"
                img.style.top = "51%"
                img.style.right = "20.7%"
                document.querySelector('[data-fieldname="dental_screen_gch"]').appendChild(img)

            } else if (dentalItemsIdArray[x] == "41") {
                const img = document.createElement("img")
                img.id = "41"
                img.src = "/files/smiley.png"
                img.width = "18"
                img.style.position = "absolute"
                img.style.top = "82%"
                img.style.right = "29.7%"
                document.querySelector('[data-fieldname="dental_screen_gch"]').appendChild(img)

            } else if (dentalItemsIdArray[x] == "42") {
                const img = document.createElement("img")
                img.id = "42"
                img.src = "/files/smiley.png"
                img.width = "18"
                img.style.position = "absolute"
                img.style.top = "81%"
                img.style.right = "31.5%"
                document.querySelector('[data-fieldname="dental_screen_gch"]').appendChild(img)

            } else if (dentalItemsIdArray[x] == "43") {
                const img = document.createElement("img")
                img.id = "43"
                img.src = "/files/smiley.png"
                img.width = "18"
                img.style.position = "absolute"
                img.style.top = "78.3%"
                img.style.right = "33%"
                document.querySelector('[data-fieldname="dental_screen_gch"]').appendChild(img)

            } else if (dentalItemsIdArray[x] == "44") {
                const img = document.createElement("img")
                img.id = "44"
                img.src = "/files/smiley.png"
                img.width = "18"
                img.style.position = "absolute"
                img.style.top = "74.7%"
                img.style.right = "34.5%"
                document.querySelector('[data-fieldname="dental_screen_gch"]').appendChild(img)

            } else if (dentalItemsIdArray[x] == "45") {
                const img = document.createElement("img")
                img.id = "45"
                img.src = "/files/smiley.png"
                img.width = "18"
                img.style.position = "absolute"
                img.style.top = "69.6%"
                img.style.right = "36.1%"
                document.querySelector('[data-fieldname="dental_screen_gch"]').appendChild(img)

            } else if (dentalItemsIdArray[x] == "46") {
                const img = document.createElement("img")
                img.id = "46"
                img.src = "/files/smiley.png"
                img.width = "18"
                img.style.position = "absolute"
                img.style.top = "64%"
                img.style.right = "37.5%"
                document.querySelector('[data-fieldname="dental_screen_gch"]').appendChild(img)

            } else if (dentalItemsIdArray[x] == "47") {
                const img = document.createElement("img")
                img.id = "47"
                img.src = "/files/smiley.png"
                img.width = "18"
                img.style.position = "absolute"
                img.style.top = "57.6%"
                img.style.right = "38%"
                document.querySelector('[data-fieldname="dental_screen_gch"]').appendChild(img)

            } else if (dentalItemsIdArray[x] == "48") {
                const img = document.createElement("img")
                img.id = "48"
                img.src = "/files/smiley.png"
                img.width = "18"
                img.style.position = "absolute"
                img.style.top = "51%"
                img.style.right = "38%"
                document.querySelector('[data-fieldname="dental_screen_gch"]').appendChild(img)

            }
        }



        // Showing Procedure Total Price
        let total = 0

        if(cur_frm.doc.dental_procedure_table && cur_frm.doc.dental_procedure_table.length > 0) {
            for(let row in cur_frm.doc.dental_procedure_table) {
                let single_row = cur_frm.doc.dental_procedure_table[row]

                if(single_row.price) {
                    total += Number(single_row.price)
                }
                if(single_row.second_procedure_price) {
                    total += Number(single_row.second_procedure_price)
                }

                if(single_row.third_procedure_price) {
                    total += Number(single_row.third_procedure_price)
                }

                if(single_row.forth_procedure_price) {
                    total += Number(single_row.forth_procedure_price)
                }

            }
        }

        cur_frm.set_value("procedures_total", total)

    },
    

    

    onload_post_render: function(frm) {

        // Changing page width defaults to ensure the smileys appear at the right place
        let body = document.getElementsByClassName("page-body")
        
        body[0].style.maxWidth = "1290px"

        // console.log(body[0])

        cur_frm.get_field("prescription_table").grid.toggle_reqd("generic_drug_name", true);
        cur_frm.get_field("prescription_table").grid.toggle_reqd("route", true);
        cur_frm.get_field("prescription_table").grid.toggle_reqd("dose", true);
        cur_frm.get_field("prescription_table").grid.toggle_reqd("dose_uom", true);
        cur_frm.get_field("prescription_table").grid.toggle_reqd("prescription_frequency", true);
        cur_frm.get_field("prescription_table").grid.toggle_reqd("duration", true);

        document.getElementById("fiveFive").style.cursor = "pointer"
        document.getElementById("fiveFour").style.cursor = "pointer"
        document.getElementById("fiveThree").style.cursor = "pointer"
        document.getElementById("fiveTwo").style.cursor = "pointer"
        document.getElementById("fiveOne").style.cursor = "pointer"

        document.getElementById("sixOne").style.cursor = "pointer"
        document.getElementById("sixTwo").style.cursor = "pointer"
        document.getElementById("sixThree").style.cursor = "pointer"
        document.getElementById("sixFour").style.cursor = "pointer"
        document.getElementById("sixFive").style.cursor = "pointer"

        document.getElementById("sevenFive").style.cursor = "pointer"
        document.getElementById("sevenFour").style.cursor = "pointer"
        document.getElementById("sevenThree").style.cursor = "pointer"
        document.getElementById("sevenTwo").style.cursor = "pointer"
        document.getElementById("sevenOne").style.cursor = "pointer"

        document.getElementById("eightOne").style.cursor = "pointer"
        document.getElementById("eightTwo").style.cursor = "pointer"
        document.getElementById("eightThree").style.cursor = "pointer"
        document.getElementById("eightFour").style.cursor = "pointer"
        document.getElementById("eightFive").style.cursor = "pointer"

        document.getElementById("oneEight").style.cursor = "pointer"
        document.getElementById("oneSeven").style.cursor = "pointer"
        document.getElementById("oneSix").style.cursor = "pointer"
        document.getElementById("oneFive").style.cursor = "pointer"
        document.getElementById("oneFour").style.cursor = "pointer"
        document.getElementById("oneThree").style.cursor = "pointer"
        document.getElementById("oneTwo").style.cursor = "pointer"
        document.getElementById("oneOne").style.cursor = "pointer"

        document.getElementById("twoEight").style.cursor = "pointer"
        document.getElementById("twoSeven").style.cursor = "pointer"
        document.getElementById("twoSix").style.cursor = "pointer"
        document.getElementById("twoFive").style.cursor = "pointer"
        document.getElementById("twoFour").style.cursor = "pointer"
        document.getElementById("twoThree").style.cursor = "pointer"
        document.getElementById("twoTwo").style.cursor = "pointer"
        document.getElementById("twoOne").style.cursor = "pointer"

        document.getElementById("threeEight").style.cursor = "pointer"
        document.getElementById("threeSeven").style.cursor = "pointer"
        document.getElementById("threeSix").style.cursor = "pointer"
        document.getElementById("threeFive").style.cursor = "pointer"
        document.getElementById("threeFour").style.cursor = "pointer"
        document.getElementById("threeThree").style.cursor = "pointer"
        document.getElementById("threeTwo").style.cursor = "pointer"
        document.getElementById("threeOne").style.cursor = "pointer"

        document.getElementById("fourEight").style.cursor = "pointer"
        document.getElementById("fourSeven").style.cursor = "pointer"
        document.getElementById("fourSix").style.cursor = "pointer"
        document.getElementById("fourFive").style.cursor = "pointer"
        document.getElementById("fourFour").style.cursor = "pointer"
        document.getElementById("fourThree").style.cursor = "pointer"
        document.getElementById("fourTwo").style.cursor = "pointer"
        document.getElementById("fourOne").style.cursor = "pointer"

        document.getElementById("fiveFive").onclick = function() {
            const img = document.createElement("img")
            img.id = "55"

            // Checking if tooth has been selected
            var el = document.getElementById(img.id) || " "
            console.log(el)
            if (el != " ") {

                frappe.msgprint({
                    title: __('Alert'),
                    indicator: 'orange',
                    message: __('This tooth has already been selected.')
                });

                // frappe.throw(__('This tooth has already been selected'))

            } else {

                // Create smiley image properties
                img.src = "/files/smiley.png"
                img.width = "18"
                img.title = "55"
                img.style.position = "absolute"
                img.style.top = "35%"
                img.style.left = "21%"
                document.querySelector('[data-fieldname="dental_screen_gch"]').appendChild(img)

                // Scroll to Procedure table
                document.getElementById('scroll_to_procedure_table').scrollIntoView({ behavior: 'smooth'});

                // Add tooth selected row to procedure table
                let child = cur_frm.add_child("dental_procedure_table")
                frappe.model.set_value(child.doctype, child.name, "tooth_number", img.id)

            }

            
        }
        document.getElementById("fiveFour").onclick = function() {
            const img = document.createElement("img")
            img.id = "54"

            // Checking if tooth has been selected
            var el = document.getElementById(img.id) || " "
            console.log(el)
            if (el != " ") {

                frappe.msgprint({
                    title: __('Alert'),
                    indicator: 'orange',
                    message: __('This tooth has already been selected.')
                });

                // frappe.throw(__('This tooth has already been selected'))

            } else {

                // Create smiley image properties

                img.src = "/files/smiley.png"
                img.width = "18"
                img.style.position = "absolute"
                img.style.top = "28%"
                img.style.left = "21.5%"
                document.querySelector('[data-fieldname="dental_screen_gch"]').appendChild(img)
                // Scroll to Procedure table
                document.getElementById('scroll_to_procedure_table').scrollIntoView({ behavior: 'smooth'});

                // Add tooth selected row to procedure table
                let child = cur_frm.add_child("dental_procedure_table")
                frappe.model.set_value(child.doctype, child.name, "tooth_number", img.id)
            }
        }
        document.getElementById("fiveThree").onclick = function() {
            const img = document.createElement("img")
            img.id = "53"

            // Checking if tooth has been selected
            var el = document.getElementById(img.id) || " "
            console.log(el)
            if (el != " ") {

                frappe.msgprint({
                    title: __('Alert'),
                    indicator: 'orange',
                    message: __('This tooth has already been selected.')
                });

                // frappe.throw(__('This tooth has already been selected'))

            } else {

                // Create smiley image properties
                img.src = "/files/smiley.png"
                img.width = "18"
                img.style.position = "absolute"
                img.style.top = "23%"
                img.style.left = "23%"
                document.querySelector('[data-fieldname="dental_screen_gch"]').appendChild(img)

                // Scroll to Procedure table
                document.getElementById('scroll_to_procedure_table').scrollIntoView({ behavior: 'smooth'});

                // Add tooth selected row to procedure table
                let child = cur_frm.add_child("dental_procedure_table")
                frappe.model.set_value(child.doctype, child.name, "tooth_number", img.id)

            }

        }
        document.getElementById("fiveTwo").onclick = function() {
            const img = document.createElement("img")
            img.id = "52"

            // Checking if tooth has been selected
            var el = document.getElementById(img.id) || " "
            console.log(el)
            if (el != " ") {

                frappe.msgprint({
                    title: __('Alert'),
                    indicator: 'orange',
                    message: __('This tooth has already been selected.')
                });

                // frappe.throw(__('This tooth has already been selected'))

            } else {

                // Create smiley image properties

                img.src = "/files/smiley.png"
                img.width = "18"
                img.style.position = "absolute"
                img.style.top = "19.3%"
                img.style.left = "24.4%"
                document.querySelector('[data-fieldname="dental_screen_gch"]').appendChild(img)

                // Scroll to Procedure table
                document.getElementById('scroll_to_procedure_table').scrollIntoView({ behavior: 'smooth'});

                // Add tooth selected row to procedure table
                let child = cur_frm.add_child("dental_procedure_table")
                frappe.model.set_value(child.doctype, child.name, "tooth_number", img.id)
            }

        }
        document.getElementById("fiveOne").onclick = function() {
            const img = document.createElement("img")
            img.id = "51"

            // Checking if tooth has been selected
            var el = document.getElementById(img.id) || " "
            console.log(el)
            if (el != " ") {

                frappe.msgprint({
                    title: __('Alert'),
                    indicator: 'orange',
                    message: __('This tooth has already been selected.')
                });

                // frappe.throw(__('This tooth has already been selected'))

            } else {

                // Create smiley image properties

                img.src = "/files/smiley.png"
                img.width = "18"
                img.style.position = "absolute"
                img.style.top = "17.5%"
                img.style.left = "26%"
                document.querySelector('[data-fieldname="dental_screen_gch"]').appendChild(img)

                // Scroll to Procedure table
                document.getElementById('scroll_to_procedure_table').scrollIntoView({ behavior: 'smooth'});

                // Add tooth selected row to procedure table
                let child = cur_frm.add_child("dental_procedure_table")
                frappe.model.set_value(child.doctype, child.name, "tooth_number", img.id)
            }

        }

        document.getElementById("sixOne").onclick = function() {
            const img = document.createElement("img")
            img.id = "61"

            // Checking if tooth has been selected
            var el = document.getElementById(img.id) || " "
            console.log(el)
            if (el != " ") {

                frappe.msgprint({
                    title: __('Alert'),
                    indicator: 'orange',
                    message: __('This tooth has already been selected.')
                });

                // frappe.throw(__('This tooth has already been selected'))

            } else {

                // Create smiley image properties

                img.src = "/files/smiley.png"
                img.width = "18"
                img.style.position = "absolute"
                img.style.top = "18.3%"
                img.style.left = "28.4%"
                document.querySelector('[data-fieldname="dental_screen_gch"]').appendChild(img)

                // Scroll to Procedure table
                document.getElementById('scroll_to_procedure_table').scrollIntoView({ behavior: 'smooth'});

                // Add tooth selected row to procedure table
                let child = cur_frm.add_child("dental_procedure_table")
                frappe.model.set_value(child.doctype, child.name, "tooth_number", img.id)
            }

        }

        document.getElementById("sixTwo").onclick = function() {
            const img = document.createElement("img")
            img.id = "62"

            // Checking if tooth has been selected
            var el = document.getElementById(img.id) || " "
            console.log(el)
            if (el != " ") {

                frappe.msgprint({
                    title: __('Alert'),
                    indicator: 'orange',
                    message: __('This tooth has already been selected.')
                });

                // frappe.throw(__('This tooth has already been selected'))

            } else {

                // Create smiley image properties

                img.src = "/files/smiley.png"
                img.width = "18"
                img.style.position = "absolute"
                img.style.top = "20%"
                img.style.left = "30.3%"
                document.querySelector('[data-fieldname="dental_screen_gch"]').appendChild(img)

                // Scroll to Procedure table
                document.getElementById('scroll_to_procedure_table').scrollIntoView({ behavior: 'smooth'});

                // Add tooth selected row to procedure table
                let child = cur_frm.add_child("dental_procedure_table")
                frappe.model.set_value(child.doctype, child.name, "tooth_number", img.id)
            }

        }

        document.getElementById("sixThree").onclick = function() {
            const img = document.createElement("img")
            img.id = "63"

            // Checking if tooth has been selected
            var el = document.getElementById(img.id) || " "
            console.log(el)
            if (el != " ") {

                frappe.msgprint({
                    title: __('Alert'),
                    indicator: 'orange',
                    message: __('This tooth has already been selected.')
                });

                // frappe.throw(__('This tooth has already been selected'))

            } else {

                // Create smiley image properties

                img.src = "/files/smiley.png"
                img.width = "18"
                img.style.position = "absolute"
                img.style.top = "23%"
                img.style.left = "32%"
                document.querySelector('[data-fieldname="dental_screen_gch"]').appendChild(img)

                // Scroll to Procedure table
                document.getElementById('scroll_to_procedure_table').scrollIntoView({ behavior: 'smooth'});

                // Add tooth selected row to procedure table
                let child = cur_frm.add_child("dental_procedure_table")
                frappe.model.set_value(child.doctype, child.name, "tooth_number", img.id)
            }

        }

        document.getElementById("sixFour").onclick = function() {
            const img = document.createElement("img")
            img.id = "64"

            // Checking if tooth has been selected
            var el = document.getElementById(img.id) || " "
            console.log(el)
            if (el != " ") {

                frappe.msgprint({
                    title: __('Alert'),
                    indicator: 'orange',
                    message: __('This tooth has already been selected.')
                });

                // frappe.throw(__('This tooth has already been selected'))

            } else {

                // Create smiley image properties
                img.src = "/files/smiley.png"
                img.width = "18"
                img.style.position = "absolute"
                img.style.top = "28%"
                img.style.left = "33%"
                document.querySelector('[data-fieldname="dental_screen_gch"]').appendChild(img)

                // Scroll to Procedure table
                document.getElementById('scroll_to_procedure_table').scrollIntoView({ behavior: 'smooth'});

                // Add tooth selected row to procedure table
                let child = cur_frm.add_child("dental_procedure_table")
                frappe.model.set_value(child.doctype, child.name, "tooth_number", img.id)
            }
        }

        document.getElementById("sixFive").onclick = function() {
            const img = document.createElement("img")
            img.id = "65"

            // Checking if tooth has been selected
            var el = document.getElementById(img.id) || " "
            console.log(el)
            if (el != " ") {

                frappe.msgprint({
                    title: __('Alert'),
                    indicator: 'orange',
                    message: __('This tooth has already been selected.')
                });

                // frappe.throw(__('This tooth has already been selected'))

            } else {

                // Create smiley image properties
                img.src = "/files/smiley.png"
                img.width = "18"
                img.style.position = "absolute"
                img.style.top = "35%"
                img.style.left = "34%"
                document.querySelector('[data-fieldname="dental_screen_gch"]').appendChild(img)

                // Scroll to Procedure table
                document.getElementById('scroll_to_procedure_table').scrollIntoView({ behavior: 'smooth'});

                // Add tooth selected row to procedure table
                let child = cur_frm.add_child("dental_procedure_table")
                frappe.model.set_value(child.doctype, child.name, "tooth_number", img.id)
            }
        }

        document.getElementById("sevenFive").onclick = function() {
            const img = document.createElement("img")
            img.id = "75"

            // Checking if tooth has been selected
            var el = document.getElementById(img.id) || " "
            console.log(el)
            if (el != " ") {

                frappe.msgprint({
                    title: __('Alert'),
                    indicator: 'orange',
                    message: __('This tooth has already been selected.')
                });

                // frappe.throw(__('This tooth has already been selected'))

            } else {

                // Create smiley image properties
                img.src = "/files/smiley.png"
                img.width = "18"
                img.style.position = "absolute"
                img.style.top = "48%"
                img.style.left = "33.4%"
                document.querySelector('[data-fieldname="dental_screen_gch"]').appendChild(img)

                // Scroll to Procedure table
                document.getElementById('scroll_to_procedure_table').scrollIntoView({ behavior: 'smooth'});

                // Add tooth selected row to procedure table
                let child = cur_frm.add_child("dental_procedure_table")
                frappe.model.set_value(child.doctype, child.name, "tooth_number", img.id)
            }
        }

        document.getElementById("sevenFour").onclick = function() {
            const img = document.createElement("img")
            img.id = "74"

            // Checking if tooth has been selected
            var el = document.getElementById(img.id) || " "
            console.log(el)
            if (el != " ") {

                frappe.msgprint({
                    title: __('Alert'),
                    indicator: 'orange',
                    message: __('This tooth has already been selected.')
                });

                // frappe.throw(__('This tooth has already been selected'))

            } else {

                // Create smiley image properties
                img.src = "/files/smiley.png"
                img.width = "18"
                img.style.position = "absolute"
                img.style.top = "55%"
                img.style.left = "32.4%"
                document.querySelector('[data-fieldname="dental_screen_gch"]').appendChild(img)

                // Scroll to Procedure table
                document.getElementById('scroll_to_procedure_table').scrollIntoView({ behavior: 'smooth'});

                // Add tooth selected row to procedure table
                let child = cur_frm.add_child("dental_procedure_table")
                frappe.model.set_value(child.doctype, child.name, "tooth_number", img.id)
            }
        }

        document.getElementById("sevenThree").onclick = function() {
            const img = document.createElement("img")
            img.id = "73"

            // Checking if tooth has been selected
            var el = document.getElementById(img.id) || " "
            console.log(el)
            if (el != " ") {

                frappe.msgprint({
                    title: __('Alert'),
                    indicator: 'orange',
                    message: __('This tooth has already been selected.')
                });

                // frappe.throw(__('This tooth has already been selected'))

            } else {

                // Create smiley image properties
                img.src = "/files/smiley.png"
                img.width = "18"
                img.style.position = "absolute"
                img.style.top = "60%"
                img.style.left = "31%"
                document.querySelector('[data-fieldname="dental_screen_gch"]').appendChild(img)

                // Scroll to Procedure table
                document.getElementById('scroll_to_procedure_table').scrollIntoView({ behavior: 'smooth'});

                // Add tooth selected row to procedure table
                let child = cur_frm.add_child("dental_procedure_table")
                frappe.model.set_value(child.doctype, child.name, "tooth_number", img.id)
            }
        }

        document.getElementById("sevenTwo").onclick = function() {
            const img = document.createElement("img")
            img.id = "72"

            // Checking if tooth has been selected
            var el = document.getElementById(img.id) || " "
            console.log(el)
            if (el != " ") {

                frappe.msgprint({
                    title: __('Alert'),
                    indicator: 'orange',
                    message: __('This tooth has already been selected.')
                });

                // frappe.throw(__('This tooth has already been selected'))

            } else {

                // Create smiley image properties
                img.src = "/files/smiley.png"
                img.width = "18"
                img.style.position = "absolute"
                img.style.top = "64%"
                img.style.left = "29.7%"
                document.querySelector('[data-fieldname="dental_screen_gch"]').appendChild(img)

                // Scroll to Procedure table
                document.getElementById('scroll_to_procedure_table').scrollIntoView({ behavior: 'smooth'});

                // Add tooth selected row to procedure table
                let child = cur_frm.add_child("dental_procedure_table")
                frappe.model.set_value(child.doctype, child.name, "tooth_number", img.id)
            }
        }

        document.getElementById("sevenOne").onclick = function() {
            const img = document.createElement("img")
            img.id = "71"

            // Checking if tooth has been selected
            var el = document.getElementById(img.id) || " "
            console.log(el)
            if (el != " ") {

                frappe.msgprint({
                    title: __('Alert'),
                    indicator: 'orange',
                    message: __('This tooth has already been selected.')
                });

                // frappe.throw(__('This tooth has already been selected'))

            } else {

                // Create smiley image properties
                img.src = "/files/smiley.png"
                img.width = "18"
                img.style.position = "absolute"
                img.style.top = "64.3%"
                img.style.left = "28%"
                document.querySelector('[data-fieldname="dental_screen_gch"]').appendChild(img)

                // Scroll to Procedure table
                document.getElementById('scroll_to_procedure_table').scrollIntoView({ behavior: 'smooth'});

                // Add tooth selected row to procedure table
                let child = cur_frm.add_child("dental_procedure_table")
                frappe.model.set_value(child.doctype, child.name, "tooth_number", img.id)
            }
        }

        document.getElementById("eightOne").onclick = function() {
            const img = document.createElement("img")
            img.id = "81"

            // Checking if tooth has been selected
            var el = document.getElementById(img.id) || " "
            console.log(el)
            if (el != " ") {

                frappe.msgprint({
                    title: __('Alert'),
                    indicator: 'orange',
                    message: __('This tooth has already been selected.')
                });

                // frappe.throw(__('This tooth has already been selected'))

            } else {

                // Create smiley image properties
                img.src = "/files/smiley.png"
                img.width = "18"
                img.style.position = "absolute"
                img.style.top = "64.5%"
                img.style.left = "26.3%"
                document.querySelector('[data-fieldname="dental_screen_gch"]').appendChild(img)

                // Scroll to Procedure table
                document.getElementById('scroll_to_procedure_table').scrollIntoView({ behavior: 'smooth'});

                // Add tooth selected row to procedure table
                let child = cur_frm.add_child("dental_procedure_table")
                frappe.model.set_value(child.doctype, child.name, "tooth_number", img.id)
            }
        }

        document.getElementById("eightTwo").onclick = function() {
            const img = document.createElement("img")
            img.id = "82"

            // Checking if tooth has been selected
            var el = document.getElementById(img.id) || " "
            console.log(el)
            if (el != " ") {

                frappe.msgprint({
                    title: __('Alert'),
                    indicator: 'orange',
                    message: __('This tooth has already been selected.')
                });

                // frappe.throw(__('This tooth has already been selected'))

            } else {

                // Create smiley image properties
                img.src = "/files/smiley.png"
                img.width = "18"
                img.style.position = "absolute"
                img.style.top = "62.5%"
                img.style.left = "24.7%"
                document.querySelector('[data-fieldname="dental_screen_gch"]').appendChild(img)

                // Scroll to Procedure table
                document.getElementById('scroll_to_procedure_table').scrollIntoView({ behavior: 'smooth'});

                // Add tooth selected row to procedure table
                let child = cur_frm.add_child("dental_procedure_table")
                frappe.model.set_value(child.doctype, child.name, "tooth_number", img.id)
            }
        }

        document.getElementById("eightThree").onclick = function() {
            const img = document.createElement("img")
            img.id = "83"

            // Checking if tooth has been selected
            var el = document.getElementById(img.id) || " "
            console.log(el)
            if (el != " ") {

                frappe.msgprint({
                    title: __('Alert'),
                    indicator: 'orange',
                    message: __('This tooth has already been selected.')
                });

                // frappe.throw(__('This tooth has already been selected'))

            } else {

                // Create smiley image properties
                img.src = "/files/smiley.png"
                img.width = "18"
                img.style.position = "absolute"
                img.style.top = "60%"
                img.style.left = "23.2%"
                document.querySelector('[data-fieldname="dental_screen_gch"]').appendChild(img)

                // Scroll to Procedure table
                document.getElementById('scroll_to_procedure_table').scrollIntoView({ behavior: 'smooth'});

                // Add tooth selected row to procedure table
                let child = cur_frm.add_child("dental_procedure_table")
                frappe.model.set_value(child.doctype, child.name, "tooth_number", img.id)
            }
        }

        document.getElementById("eightFour").onclick = function() {
            const img = document.createElement("img")
            img.id = "84"

            // Checking if tooth has been selected
            var el = document.getElementById(img.id) || " "
            console.log(el)
            if (el != " ") {

                frappe.msgprint({
                    title: __('Alert'),
                    indicator: 'orange',
                    message: __('This tooth has already been selected.')
                });

                // frappe.throw(__('This tooth has already been selected'))

            } else {

                // Create smiley image properties
                img.src = "/files/smiley.png"
                img.width = "18"
                img.style.position = "absolute"
                img.style.top = "55%"
                img.style.left = "22%"
                document.querySelector('[data-fieldname="dental_screen_gch"]').appendChild(img)

                // Scroll to Procedure table
                document.getElementById('scroll_to_procedure_table').scrollIntoView({ behavior: 'smooth'});

                // Add tooth selected row to procedure table
                let child = cur_frm.add_child("dental_procedure_table")
                frappe.model.set_value(child.doctype, child.name, "tooth_number", img.id)
            }
        }

        document.getElementById("eightFive").onclick = function() {
            const img = document.createElement("img")
            img.id = "85"

            // Checking if tooth has been selected
            var el = document.getElementById(img.id) || " "
            console.log(el)
            if (el != " ") {

                frappe.msgprint({
                    title: __('Alert'),
                    indicator: 'orange',
                    message: __('This tooth has already been selected.')
                });

                // frappe.throw(__('This tooth has already been selected'))

            } else {

                // Create smiley image properties
                img.src = "/files/smiley.png"
                img.width = "18"
                img.style.position = "absolute"
                img.style.top = "48%"
                img.style.left = "21%"
                document.querySelector('[data-fieldname="dental_screen_gch"]').appendChild(img)

                // Scroll to Procedure table
                document.getElementById('scroll_to_procedure_table').scrollIntoView({ behavior: 'smooth'});

                // Add tooth selected row to procedure table
                let child = cur_frm.add_child("dental_procedure_table")
                frappe.model.set_value(child.doctype, child.name, "tooth_number", img.id)
            }
        }



        document.getElementById("oneEight").onclick = function() {
            const img = document.createElement("img")
            img.id = "18"

            // Checking if tooth has been selected
            var el = document.getElementById(img.id) || " "
            console.log(el)
            if (el != " ") {

                frappe.msgprint({
                    title: __('Alert'),
                    indicator: 'orange',
                    message: __('This tooth has already been selected.')
                });

                // frappe.throw(__('This tooth has already been selected'))

            } else {

                // Create smiley image properties
                img.src = "/files/smiley.png"
                img.width = "18"
                img.style.position = "absolute"
                img.style.top = "42%"
                img.style.right = "38%"
                document.querySelector('[data-fieldname="dental_screen_gch"]').appendChild(img)

                // Scroll to Procedure table
                document.getElementById('scroll_to_procedure_table').scrollIntoView({ behavior: 'smooth'});

                // Add tooth selected row to procedure table
                let child = cur_frm.add_child("dental_procedure_table")
                frappe.model.set_value(child.doctype, child.name, "tooth_number", img.id)
            }
        }

        document.getElementById("oneSeven").onclick = function() {
            const img = document.createElement("img")
            img.id = "17"

            // Checking if tooth has been selected
            var el = document.getElementById(img.id) || " "
            console.log(el)
            if (el != " ") {

                frappe.msgprint({
                    title: __('Alert'),
                    indicator: 'orange',
                    message: __('This tooth has already been selected.')
                });

                // frappe.throw(__('This tooth has already been selected'))

            } else {

                // Create smiley image properties
                img.src = "/files/smiley.png"
                img.width = "18"
                img.style.position = "absolute"
                img.style.top = "35.6%"
                img.style.right = "38%"
                document.querySelector('[data-fieldname="dental_screen_gch"]').appendChild(img)

                // Scroll to Procedure table
                document.getElementById('scroll_to_procedure_table').scrollIntoView({ behavior: 'smooth'});

                // Add tooth selected row to procedure table
                let child = cur_frm.add_child("dental_procedure_table")
                frappe.model.set_value(child.doctype, child.name, "tooth_number", img.id)
            }
        }

        document.getElementById("oneSix").onclick = function() {
            const img = document.createElement("img")
            img.id = "16"

            // Checking if tooth has been selected
            var el = document.getElementById(img.id) || " "
            console.log(el)
            if (el != " ") {

                frappe.msgprint({
                    title: __('Alert'),
                    indicator: 'orange',
                    message: __('This tooth has already been selected.')
                });

                // frappe.throw(__('This tooth has already been selected'))

            } else {

                // Create smiley image properties
                img.src = "/files/smiley.png"
                img.width = "18"
                img.style.position = "absolute"
                img.style.top = "30%"
                img.style.right = "37.5%"
                document.querySelector('[data-fieldname="dental_screen_gch"]').appendChild(img)

                // Scroll to Procedure table
                document.getElementById('scroll_to_procedure_table').scrollIntoView({ behavior: 'smooth'});

                // Add tooth selected row to procedure table
                let child = cur_frm.add_child("dental_procedure_table")
                frappe.model.set_value(child.doctype, child.name, "tooth_number", img.id)

            }
        }

        document.getElementById("oneFive").onclick = function() {
            const img = document.createElement("img")
            img.id = "15"

            // Checking if tooth has been selected
            var el = document.getElementById(img.id) || " "
            console.log(el)
            if (el != " ") {

                frappe.msgprint({
                    title: __('Alert'),
                    indicator: 'orange',
                    message: __('This tooth has already been selected.')
                });

                // frappe.throw(__('This tooth has already been selected'))

            } else {

                // Create smiley image properties
                img.src = "/files/smiley.png"
                img.width = "18"
                img.style.position = "absolute"
                img.style.top = "24.6%"
                img.style.right = "36.5%"
                document.querySelector('[data-fieldname="dental_screen_gch"]').appendChild(img)

                // Scroll to Procedure table
                document.getElementById('scroll_to_procedure_table').scrollIntoView({ behavior: 'smooth'});

                // Add tooth selected row to procedure table
                let child = cur_frm.add_child("dental_procedure_table")
                frappe.model.set_value(child.doctype, child.name, "tooth_number", img.id)
            }
        }

        document.getElementById("oneFour").onclick = function() {
            const img = document.createElement("img")
            img.id = "14"

            // Checking if tooth has been selected
            var el = document.getElementById(img.id) || " "
            console.log(el)
            if (el != " ") {

                frappe.msgprint({
                    title: __('Alert'),
                    indicator: 'orange',
                    message: __('This tooth has already been selected.')
                });

                // frappe.throw(__('This tooth has already been selected'))

            } else {

                // Create smiley image properties
                img.src = "/files/smiley.png"
                img.width = "18"
                img.style.position = "absolute"
                img.style.top = "19.7%"
                img.style.right = "35.5%"
                document.querySelector('[data-fieldname="dental_screen_gch"]').appendChild(img)

                // Scroll to Procedure table
                document.getElementById('scroll_to_procedure_table').scrollIntoView({ behavior: 'smooth'});

                // Add tooth selected row to procedure table
                let child = cur_frm.add_child("dental_procedure_table")
                frappe.model.set_value(child.doctype, child.name, "tooth_number", img.id)
            }
        }

        document.getElementById("oneThree").onclick = function() {
            const img = document.createElement("img")
            img.id = "13"

            // Checking if tooth has been selected
            var el = document.getElementById(img.id) || " "
            console.log(el)
            if (el != " ") {

                frappe.msgprint({
                    title: __('Alert'),
                    indicator: 'orange',
                    message: __('This tooth has already been selected.')
                });

                // frappe.throw(__('This tooth has already been selected'))

            } else {

                // Create smiley image properties
                img.src = "/files/smiley.png"
                img.width = "18"
                img.style.position = "absolute"
                img.style.top = "15.3%"
                img.style.right = "34.4%"
                document.querySelector('[data-fieldname="dental_screen_gch"]').appendChild(img)

                // Scroll to Procedure table
                document.getElementById('scroll_to_procedure_table').scrollIntoView({ behavior: 'smooth'});

                // Add tooth selected row to procedure table
                let child = cur_frm.add_child("dental_procedure_table")
                frappe.model.set_value(child.doctype, child.name, "tooth_number", img.id)
            }
        }

        document.getElementById("oneTwo").onclick = function() {
            const img = document.createElement("img")
            img.id = "12"

            // Checking if tooth has been selected
            var el = document.getElementById(img.id) || " "
            console.log(el)
            if (el != " ") {

                frappe.msgprint({
                    title: __('Alert'),
                    indicator: 'orange',
                    message: __('This tooth has already been selected.')
                });

                // frappe.throw(__('This tooth has already been selected'))

            } else {

                // Create smiley image properties
                img.src = "/files/smiley.png"
                img.width = "18"
                img.style.position = "absolute"
                img.style.top = "12%"
                img.style.right = "32.8%"
                document.querySelector('[data-fieldname="dental_screen_gch"]').appendChild(img)

                // Scroll to Procedure table
                document.getElementById('scroll_to_procedure_table').scrollIntoView({ behavior: 'smooth'});

                // Add tooth selected row to procedure table
                let child = cur_frm.add_child("dental_procedure_table")
                frappe.model.set_value(child.doctype, child.name, "tooth_number", img.id)
            }
        }

        document.getElementById("oneOne").onclick = function() {
            const img = document.createElement("img")
            img.id = "11"

            // Checking if tooth has been selected
            var el = document.getElementById(img.id) || " "
            console.log(el)
            if (el != " ") {

                frappe.msgprint({
                    title: __('Alert'),
                    indicator: 'orange',
                    message: __('This tooth has already been selected.')
                });

                // frappe.throw(__('This tooth has already been selected'))

            } else {

                // Create smiley image properties
                img.src = "/files/smiley.png"
                img.width = "18"
                img.style.position = "absolute"
                img.style.top = "10%"
                img.style.right = "30.7%"
                document.querySelector('[data-fieldname="dental_screen_gch"]').appendChild(img)

                // Scroll to Procedure table
                document.getElementById('scroll_to_procedure_table').scrollIntoView({ behavior: 'smooth'});

                // Add tooth selected row to procedure table
                let child = cur_frm.add_child("dental_procedure_table")
                frappe.model.set_value(child.doctype, child.name, "tooth_number", img.id)
            }
        }






        document.getElementById("twoOne").onclick = function() {
            const img = document.createElement("img")
            img.id = "21"

            // Checking if tooth has been selected
            var el = document.getElementById(img.id) || " "
            console.log(el)
            if (el != " ") {

                frappe.msgprint({
                    title: __('Alert'),
                    indicator: 'orange',
                    message: __('This tooth has already been selected.')
                });

                // frappe.throw(__('This tooth has already been selected'))

            } else {

                // Create smiley image properties
                img.src = "/files/smiley.png"
                img.width = "18"
                img.style.position = "absolute"
                img.style.top = "10%"
                img.style.right = "28%"
                document.querySelector('[data-fieldname="dental_screen_gch"]').appendChild(img)

                // Scroll to Procedure table
                document.getElementById('scroll_to_procedure_table').scrollIntoView({ behavior: 'smooth'});

                // Add tooth selected row to procedure table
                let child = cur_frm.add_child("dental_procedure_table")
                frappe.model.set_value(child.doctype, child.name, "tooth_number", img.id)
            }
        }

        document.getElementById("twoTwo").onclick = function() {
            const img = document.createElement("img")
            img.id = "22"

            // Checking if tooth has been selected
            var el = document.getElementById(img.id) || " "
            console.log(el)
            if (el != " ") {

                frappe.msgprint({
                    title: __('Alert'),
                    indicator: 'orange',
                    message: __('This tooth has already been selected.')
                });

                // frappe.throw(__('This tooth has already been selected'))

            } else {

                // Create smiley image properties
                img.src = "/files/smiley.png"
                img.width = "18"
                img.style.position = "absolute"
                img.style.top = "12%"
                img.style.right = "25.5%"
                document.querySelector('[data-fieldname="dental_screen_gch"]').appendChild(img)

                // Scroll to Procedure table
                document.getElementById('scroll_to_procedure_table').scrollIntoView({ behavior: 'smooth'});

                // Add tooth selected row to procedure table
                let child = cur_frm.add_child("dental_procedure_table")
                frappe.model.set_value(child.doctype, child.name, "tooth_number", img.id)
            }
        }

        document.getElementById("twoThree").onclick = function() {
            const img = document.createElement("img")
            img.id = "23"

            // Checking if tooth has been selected
            var el = document.getElementById(img.id) || " "
            console.log(el)
            if (el != " ") {

                frappe.msgprint({
                    title: __('Alert'),
                    indicator: 'orange',
                    message: __('This tooth has already been selected.')
                });

                // frappe.throw(__('This tooth has already been selected'))

            } else {

                // Create smiley image properties
                img.src = "/files/smiley.png"
                img.width = "18"
                img.style.position = "absolute"
                img.style.top = "15.3%"
                img.style.right = "24%"
                document.querySelector('[data-fieldname="dental_screen_gch"]').appendChild(img)

                // Scroll to Procedure table
                document.getElementById('scroll_to_procedure_table').scrollIntoView({ behavior: 'smooth'});

                // Add tooth selected row to procedure table
                let child = cur_frm.add_child("dental_procedure_table")
                frappe.model.set_value(child.doctype, child.name, "tooth_number", img.id)
            }
        }

        document.getElementById("twoFour").onclick = function() {
            const img = document.createElement("img")
            img.id = "24"

            // Checking if tooth has been selected
            var el = document.getElementById(img.id) || " "
            console.log(el)
            if (el != " ") {

                frappe.msgprint({
                    title: __('Alert'),
                    indicator: 'orange',
                    message: __('This tooth has already been selected.')
                });

                // frappe.throw(__('This tooth has already been selected'))

            } else {

                // Create smiley image properties
                img.src = "/files/smiley.png"
                img.width = "18"
                img.style.position = "absolute"
                img.style.top = "19.7%"
                img.style.right = "23%"
                document.querySelector('[data-fieldname="dental_screen_gch"]').appendChild(img)

                // Scroll to Procedure table
                document.getElementById('scroll_to_procedure_table').scrollIntoView({ behavior: 'smooth'});

                // Add tooth selected row to procedure table
                let child = cur_frm.add_child("dental_procedure_table")
                frappe.model.set_value(child.doctype, child.name, "tooth_number", img.id)
            }
        }

        document.getElementById("twoFive").onclick = function() {
            const img = document.createElement("img")
            img.id = "25"

            // Checking if tooth has been selected
            var el = document.getElementById(img.id) || " "
            console.log(el)
            if (el != " ") {

                frappe.msgprint({
                    title: __('Alert'),
                    indicator: 'orange',
                    message: __('This tooth has already been selected.')
                });

                // frappe.throw(__('This tooth has already been selected'))

            } else {

                // Create smiley image properties
                img.src = "/files/smiley.png"
                img.width = "18"
                img.style.position = "absolute"
                img.style.top = "24.6%"
                img.style.right = "22%"
                document.querySelector('[data-fieldname="dental_screen_gch"]').appendChild(img)

                // Scroll to Procedure table
                document.getElementById('scroll_to_procedure_table').scrollIntoView({ behavior: 'smooth'});

                // Add tooth selected row to procedure table
                let child = cur_frm.add_child("dental_procedure_table")
                frappe.model.set_value(child.doctype, child.name, "tooth_number", img.id)
            }
        }

        document.getElementById("twoSix").onclick = function() {
            const img = document.createElement("img")
            img.id = "26"

            // Checking if tooth has been selected
            var el = document.getElementById(img.id) || " "
            console.log(el)
            if (el != " ") {

                frappe.msgprint({
                    title: __('Alert'),
                    indicator: 'orange',
                    message: __('This tooth has already been selected.')
                });

                // frappe.throw(__('This tooth has already been selected'))

            } else {

                // Create smiley image properties
                img.src = "/files/smiley.png"
                img.width = "18"
                img.style.position = "absolute"
                img.style.top = "30%"
                img.style.right = "21%"
                document.querySelector('[data-fieldname="dental_screen_gch"]').appendChild(img)

                // Scroll to Procedure table
                document.getElementById('scroll_to_procedure_table').scrollIntoView({ behavior: 'smooth'});

                // Add tooth selected row to procedure table
                let child = cur_frm.add_child("dental_procedure_table")
                frappe.model.set_value(child.doctype, child.name, "tooth_number", img.id)
            }
        }

        document.getElementById("twoSeven").onclick = function() {
            const img = document.createElement("img")
            img.id = "27"

            // Checking if tooth has been selected
            var el = document.getElementById(img.id) || " "
            console.log(el)
            if (el != " ") {

                frappe.msgprint({
                    title: __('Alert'),
                    indicator: 'orange',
                    message: __('This tooth has already been selected.')
                });

                // frappe.throw(__('This tooth has already been selected'))

            } else {

                // Create smiley image properties
                img.src = "/files/smiley.png"
                img.width = "18"
                img.style.position = "absolute"
                img.style.top = "35.6%"
                img.style.right = "20.5%"
                document.querySelector('[data-fieldname="dental_screen_gch"]').appendChild(img)

                // Scroll to Procedure table
                document.getElementById('scroll_to_procedure_table').scrollIntoView({ behavior: 'smooth'});

                // Add tooth selected row to procedure table
                let child = cur_frm.add_child("dental_procedure_table")
                frappe.model.set_value(child.doctype, child.name, "tooth_number", img.id)
            }
        }

        document.getElementById("twoEight").onclick = function() {
            const img = document.createElement("img")
            img.id = "28"

            // Checking if tooth has been selected
            var el = document.getElementById(img.id) || " "
            console.log(el)
            if (el != " ") {

                frappe.msgprint({
                    title: __('Alert'),
                    indicator: 'orange',
                    message: __('This tooth has already been selected.')
                });

                // frappe.throw(__('This tooth has already been selected'))

            } else {

                // Create smiley image properties
                img.src = "/files/smiley.png"
                img.width = "18"
                img.style.position = "absolute"
                img.style.top = "42%"
                img.style.right = "20.7%"
                document.querySelector('[data-fieldname="dental_screen_gch"]').appendChild(img)

                // Scroll to Procedure table
                document.getElementById('scroll_to_procedure_table').scrollIntoView({ behavior: 'smooth'});

                // Add tooth selected row to procedure table
                let child = cur_frm.add_child("dental_procedure_table")
                frappe.model.set_value(child.doctype, child.name, "tooth_number", img.id)
            }
        }



        document.getElementById("threeOne").onclick = function() {
            const img = document.createElement("img")
            img.id = "31"

            // Checking if tooth has been selected
            var el = document.getElementById(img.id) || " "
            console.log(el)
            if (el != " ") {

                frappe.msgprint({
                    title: __('Alert'),
                    indicator: 'orange',
                    message: __('This tooth has already been selected.')
                });

                // frappe.throw(__('This tooth has already been selected'))

            } else {

                // Create smiley image properties
                img.src = "/files/smiley.png"
                img.width = "18"
                img.style.position = "absolute"
                img.style.top = "82%"
                img.style.right = "28%"
                document.querySelector('[data-fieldname="dental_screen_gch"]').appendChild(img)

                // Scroll to Procedure table
                document.getElementById('scroll_to_procedure_table').scrollIntoView({ behavior: 'smooth'});

                // Add tooth selected row to procedure table
                let child = cur_frm.add_child("dental_procedure_table")
                frappe.model.set_value(child.doctype, child.name, "tooth_number", img.id)
            }
        }
        
        document.getElementById("threeTwo").onclick = function() {
            const img = document.createElement("img")
            img.id = "32"

            // Checking if tooth has been selected
            var el = document.getElementById(img.id) || " "
            console.log(el)
            if (el != " ") {

                frappe.msgprint({
                    title: __('Alert'),
                    indicator: 'orange',
                    message: __('This tooth has already been selected.')
                });

                // frappe.throw(__('This tooth has already been selected'))

            } else {

                // Create smiley image properties
                img.src = "/files/smiley.png"
                img.width = "18"
                img.style.position = "absolute"
                img.style.top = "80.5%"
                img.style.right = "26.5%"
                document.querySelector('[data-fieldname="dental_screen_gch"]').appendChild(img)

                // Scroll to Procedure table
                document.getElementById('scroll_to_procedure_table').scrollIntoView({ behavior: 'smooth'});

                // Add tooth selected row to procedure table
                let child = cur_frm.add_child("dental_procedure_table")
                frappe.model.set_value(child.doctype, child.name, "tooth_number", img.id)
            }
        }
        
        document.getElementById("threeThree").onclick = function() {
            const img = document.createElement("img")
            img.id = "33"

            // Checking if tooth has been selected
            var el = document.getElementById(img.id) || " "
            console.log(el)
            if (el != " ") {

                frappe.msgprint({
                    title: __('Alert'),
                    indicator: 'orange',
                    message: __('This tooth has already been selected.')
                });

                // frappe.throw(__('This tooth has already been selected'))

            } else {

                // Create smiley image properties
                img.src = "/files/smiley.png"
                img.width = "18"
                img.style.position = "absolute"
                img.style.top = "78%"
                img.style.right = "25%"
                document.querySelector('[data-fieldname="dental_screen_gch"]').appendChild(img)

                // Scroll to Procedure table
                document.getElementById('scroll_to_procedure_table').scrollIntoView({ behavior: 'smooth'});

                // Add tooth selected row to procedure table
                let child = cur_frm.add_child("dental_procedure_table")
                frappe.model.set_value(child.doctype, child.name, "tooth_number", img.id)
            }
        }
        
        document.getElementById("threeFour").onclick = function() {
            const img = document.createElement("img")
            img.id = "34"

            // Checking if tooth has been selected
            var el = document.getElementById(img.id) || " "
            console.log(el)
            if (el != " ") {

                frappe.msgprint({
                    title: __('Alert'),
                    indicator: 'orange',
                    message: __('This tooth has already been selected.')
                });

                // frappe.throw(__('This tooth has already been selected'))

            } else {

                // Create smiley image properties
                img.src = "/files/smiley.png"
                img.width = "18"
                img.style.position = "absolute"
                img.style.top = "73.7%"
                img.style.right = "23.6%"
                document.querySelector('[data-fieldname="dental_screen_gch"]').appendChild(img)

                // Scroll to Procedure table
                document.getElementById('scroll_to_procedure_table').scrollIntoView({ behavior: 'smooth'});

                // Add tooth selected row to procedure table
                let child = cur_frm.add_child("dental_procedure_table")
                frappe.model.set_value(child.doctype, child.name, "tooth_number", img.id)
            }
        }
        
        document.getElementById("threeFive").onclick = function() {
            const img = document.createElement("img")
            img.id = "35"

            // Checking if tooth has been selected
            var el = document.getElementById(img.id) || " "
            console.log(el)
            if (el != " ") {

                frappe.msgprint({
                    title: __('Alert'),
                    indicator: 'orange',
                    message: __('This tooth has already been selected.')
                });

                // frappe.throw(__('This tooth has already been selected'))

            } else {

                // Create smiley image properties
                img.src = "/files/smiley.png"
                img.width = "18"
                img.style.position = "absolute"
                img.style.top = "68.6%"
                img.style.right = "22%"
                document.querySelector('[data-fieldname="dental_screen_gch"]').appendChild(img)
                
                // Scroll to Procedure table
                document.getElementById('scroll_to_procedure_table').scrollIntoView({ behavior: 'smooth'});

                // Add tooth selected row to procedure table
                let child = cur_frm.add_child("dental_procedure_table")
                frappe.model.set_value(child.doctype, child.name, "tooth_number", img.id)

            }
        }
        
        document.getElementById("threeSix").onclick = function() {
            const img = document.createElement("img")
            img.id = "36"

            // Checking if tooth has been selected
            var el = document.getElementById(img.id) || " "
            console.log(el)
            if (el != " ") {

                frappe.msgprint({
                    title: __('Alert'),
                    indicator: 'orange',
                    message: __('This tooth has already been selected.')
                });

                // frappe.throw(__('This tooth has already been selected'))

            } else {

                // Create smiley image properties
                img.src = "/files/smiley.png"
                img.width = "18"
                img.style.position = "absolute"
                img.style.top = "63%"
                img.style.right = "21%"
                document.querySelector('[data-fieldname="dental_screen_gch"]').appendChild(img)
                
                // Scroll to Procedure table
                document.getElementById('scroll_to_procedure_table').scrollIntoView({ behavior: 'smooth'});

                // Add tooth selected row to procedure table
                let child = cur_frm.add_child("dental_procedure_table")
                frappe.model.set_value(child.doctype, child.name, "tooth_number", img.id)
            }
        }
        
        document.getElementById("threeSeven").onclick = function() {
            const img = document.createElement("img")
            img.id = "37"

            // Checking if tooth has been selected
            var el = document.getElementById(img.id) || " "
            console.log(el)
            if (el != " ") {

                frappe.msgprint({
                    title: __('Alert'),
                    indicator: 'orange',
                    message: __('This tooth has already been selected.')
                });

                // frappe.throw(__('This tooth has already been selected'))

            } else {

                // Create smiley image properties
                img.src = "/files/smiley.png"
                img.width = "18"
                img.style.position = "absolute"
                img.style.top = "55.6%"
                img.style.right = "20.5%"
                document.querySelector('[data-fieldname="dental_screen_gch"]').appendChild(img)
                
                // Scroll to Procedure table
                document.getElementById('scroll_to_procedure_table').scrollIntoView({ behavior: 'smooth'});

                // Add tooth selected row to procedure table
                let child = cur_frm.add_child("dental_procedure_table")
                frappe.model.set_value(child.doctype, child.name, "tooth_number", img.id)
            }
        }
        
        document.getElementById("threeEight").onclick = function() {
            const img = document.createElement("img")
            img.id = "38"

            // Checking if tooth has been selected
            var el = document.getElementById(img.id) || " "
            console.log(el)
            if (el != " ") {

                frappe.msgprint({
                    title: __('Alert'),
                    indicator: 'orange',
                    message: __('This tooth has already been selected.')
                });

                // frappe.throw(__('This tooth has already been selected'))

            } else {

                // Create smiley image properties
                img.src = "/files/smiley.png"
                img.width = "18"
                img.style.position = "absolute"
                img.style.top = "51%"
                img.style.right = "20.7%"
                document.querySelector('[data-fieldname="dental_screen_gch"]').appendChild(img)
                
                // Scroll to Procedure table
                document.getElementById('scroll_to_procedure_table').scrollIntoView({ behavior: 'smooth'});

                // Add tooth selected row to procedure table
                let child = cur_frm.add_child("dental_procedure_table")
                frappe.model.set_value(child.doctype, child.name, "tooth_number", img.id)
            }
        }



        document.getElementById("fourEight").onclick = function() {
            const img = document.createElement("img")
            img.id = "48"

            // Checking if tooth has been selected
            var el = document.getElementById(img.id) || " "
            console.log(el)
            if (el != " ") {

                frappe.msgprint({
                    title: __('Alert'),
                    indicator: 'orange',
                    message: __('This tooth has already been selected.')
                });

                // frappe.throw(__('This tooth has already been selected'))

            } else {

                // Create smiley image properties
                img.src = "/files/smiley.png"
                img.width = "18"
                img.style.position = "absolute"
                img.style.top = "51%"
                img.style.right = "38%"
                document.querySelector('[data-fieldname="dental_screen_gch"]').appendChild(img)
                
                // Scroll to Procedure table
                document.getElementById('scroll_to_procedure_table').scrollIntoView({ behavior: 'smooth'});

                // Add tooth selected row to procedure table
                let child = cur_frm.add_child("dental_procedure_table")
                frappe.model.set_value(child.doctype, child.name, "tooth_number", img.id)
            }
        }
        
        document.getElementById("fourSeven").onclick = function() {
            const img = document.createElement("img")
            img.id = "47"

            // Checking if tooth has been selected
            var el = document.getElementById(img.id) || " "
            console.log(el)
            if (el != " ") {

                frappe.msgprint({
                    title: __('Alert'),
                    indicator: 'orange',
                    message: __('This tooth has already been selected.')
                });

                // frappe.throw(__('This tooth has already been selected'))

            } else {

                // Create smiley image properties
                img.src = "/files/smiley.png"
                img.width = "18"
                img.style.position = "absolute"
                img.style.top = "57.6%"
                img.style.right = "38%"
                document.querySelector('[data-fieldname="dental_screen_gch"]').appendChild(img)
                
                // Scroll to Procedure table
                document.getElementById('scroll_to_procedure_table').scrollIntoView({ behavior: 'smooth'});

                // Add tooth selected row to procedure table
                let child = cur_frm.add_child("dental_procedure_table")
                frappe.model.set_value(child.doctype, child.name, "tooth_number", img.id)
            }
        }
        
        document.getElementById("fourSix").onclick = function() {
            const img = document.createElement("img")
            img.id = "46"

            // Checking if tooth has been selected
            var el = document.getElementById(img.id) || " "
            console.log(el)
            if (el != " ") {

                frappe.msgprint({
                    title: __('Alert'),
                    indicator: 'orange',
                    message: __('This tooth has already been selected.')
                });

                // frappe.throw(__('This tooth has already been selected'))

            } else {

                // Create smiley image properties
                img.src = "/files/smiley.png"
                img.width = "18"
                img.style.position = "absolute"
                img.style.top = "64%"
                img.style.right = "37.5%"
                document.querySelector('[data-fieldname="dental_screen_gch"]').appendChild(img)
                
                // Scroll to Procedure table
                document.getElementById('scroll_to_procedure_table').scrollIntoView({ behavior: 'smooth'});

                // Add tooth selected row to procedure table
                let child = cur_frm.add_child("dental_procedure_table")
                frappe.model.set_value(child.doctype, child.name, "tooth_number", img.id)
            }
        }
        
        document.getElementById("fourFive").onclick = function() {
            const img = document.createElement("img")
            img.id = "45"

            // Checking if tooth has been selected
            var el = document.getElementById(img.id) || " "
            console.log(el)
            if (el != " ") {

                frappe.msgprint({
                    title: __('Alert'),
                    indicator: 'orange',
                    message: __('This tooth has already been selected.')
                });

                // frappe.throw(__('This tooth has already been selected'))

            } else {

                // Create smiley image properties
                img.src = "/files/smiley.png"
                img.width = "18"
                img.style.position = "absolute"
                img.style.top = "69.6%"
                img.style.right = "36.1%"
                document.querySelector('[data-fieldname="dental_screen_gch"]').appendChild(img)
                
                // Scroll to Procedure table
                document.getElementById('scroll_to_procedure_table').scrollIntoView({ behavior: 'smooth'});

                // Add tooth selected row to procedure table
                let child = cur_frm.add_child("dental_procedure_table")
                frappe.model.set_value(child.doctype, child.name, "tooth_number", img.id)
            }
        }
        
        document.getElementById("fourFour").onclick = function() {
            const img = document.createElement("img")
            img.id = "44"

            // Checking if tooth has been selected
            var el = document.getElementById(img.id) || " "
            console.log(el)
            if (el != " ") {

                frappe.msgprint({
                    title: __('Alert'),
                    indicator: 'orange',
                    message: __('This tooth has already been selected.')
                });

                // frappe.throw(__('This tooth has already been selected'))

            } else {

                // Create smiley image properties
                img.src = "/files/smiley.png"
                img.width = "18"
                img.style.position = "absolute"
                img.style.top = "74.7%"
                img.style.right = "34.5%"
                document.querySelector('[data-fieldname="dental_screen_gch"]').appendChild(img)
                
                // Scroll to Procedure table
                document.getElementById('scroll_to_procedure_table').scrollIntoView({ behavior: 'smooth'});

                // Add tooth selected row to procedure table
                let child = cur_frm.add_child("dental_procedure_table")
                frappe.model.set_value(child.doctype, child.name, "tooth_number", img.id)
            }
        }
        
        document.getElementById("fourThree").onclick = function() {
            const img = document.createElement("img")
            img.id = "43"

            // Checking if tooth has been selected
            var el = document.getElementById(img.id) || " "
            console.log(el)
            if (el != " ") {

                frappe.msgprint({
                    title: __('Alert'),
                    indicator: 'orange',
                    message: __('This tooth has already been selected.')
                });

                // frappe.throw(__('This tooth has already been selected'))

            } else {

                // Create smiley image properties
                img.src = "/files/smiley.png"
                img.width = "18"
                img.style.position = "absolute"
                img.style.top = "78.3%"
                img.style.right = "33%"
                document.querySelector('[data-fieldname="dental_screen_gch"]').appendChild(img)
                
                // Scroll to Procedure table
                document.getElementById('scroll_to_procedure_table').scrollIntoView({ behavior: 'smooth'});

                // Add tooth selected row to procedure table
                let child = cur_frm.add_child("dental_procedure_table")
                frappe.model.set_value(child.doctype, child.name, "tooth_number", img.id)
            }
        }
        
        document.getElementById("fourTwo").onclick = function() {
            const img = document.createElement("img")
            img.id = "42"

            // Checking if tooth has been selected
            var el = document.getElementById(img.id) || " "
            console.log(el)
            if (el != " ") {

                frappe.msgprint({
                    title: __('Alert'),
                    indicator: 'orange',
                    message: __('This tooth has already been selected.')
                });

                // frappe.throw(__('This tooth has already been selected'))

            } else {

                // Create smiley image properties
                img.src = "/files/smiley.png"
                img.width = "18"
                img.style.position = "absolute"
                img.style.top = "81%"
                img.style.right = "31.5%"
                document.querySelector('[data-fieldname="dental_screen_gch"]').appendChild(img)
                
                // Scroll to Procedure table
                document.getElementById('scroll_to_procedure_table').scrollIntoView({ behavior: 'smooth'});

                // Add tooth selected row to procedure table
                let child = cur_frm.add_child("dental_procedure_table")
                frappe.model.set_value(child.doctype, child.name, "tooth_number", img.id)
            }
        }
        
        document.getElementById("fourOne").onclick = function() {
            const img = document.createElement("img")
            img.id = "41"

            // Checking if tooth has been selected
            var el = document.getElementById(img.id) || " "
            console.log(el)
            if (el != " ") {

                frappe.msgprint({
                    title: __('Alert'),
                    indicator: 'orange',
                    message: __('This tooth has already been selected.')
                });

                // frappe.throw(__('This tooth has already been selected'))

            } else {

                // Create smiley image properties
                img.src = "/files/smiley.png"
                img.width = "18"
                img.style.position = "absolute"
                img.style.top = "82%"
                img.style.right = "29.7%"
                document.querySelector('[data-fieldname="dental_screen_gch"]').appendChild(img)
                
                // Scroll to Procedure table
                document.getElementById('scroll_to_procedure_table').scrollIntoView({ behavior: 'smooth'});

                // Add tooth selected row to procedure table
                let child = cur_frm.add_child("dental_procedure_table")
                frappe.model.set_value(child.doctype, child.name, "tooth_number", img.id)
            }
        }
        
        

        // Flagging COMMUNICABLE medical codes
        // frm.fields_dict["diagnosis_table"].$wrapper.find('.grid-body .rows').find(".grid-row").each(function(i, item) {
        //     let d = locals[cur_frm.fields_dict["diagnosis_table"].grid.doctype][$(item).attr('data-name')];
        //     if(d["is_communicable"] == 1){
        //     $(item).find('.grid-static-col').css({'background-color': 'yellow'});
        //     }
        // });

    },

    before_submit: function(frm) {
        console.log("Submitting.......")

        let patient_encounter = cur_frm.doc.patient_encounter

        // Adding Physical Exam, History, Diagnosis, Plan of action, Laboratory, Radiology, and Service referrals to encounter

        frappe.call({
            method: "gch_custom.services.rest.add_dental_diagnosis_and_prescription_to_encounter",
            args: {
                patient_encounter: patient_encounter,
                physical_examination: cur_frm.doc.patient_physical_examination,
                patient_history : cur_frm.doc.patient_history,        
                medical_codes: cur_frm.doc.diagnosis_table,
                plan_of_action: cur_frm.doc.patient_plan_of_action_notes,
                doctor_prescriptions: cur_frm.doc.prescription_table,
                service_referrals : cur_frm.doc.service_referral,
                radiology_details: cur_frm.doc.radiology_details,
                lab_tests: cur_frm.doc.lab_tests
            },callback(r) {
                if(r.message) {
                    console.log(r.message)
                    
                    frappe.msgprint({
                        title: __('Notification'),
                        indicator: 'green',
                        message: __('Details have been updated to the encounter successfully!')
                    });

                } else {
                    frappe.throw(__("Somethings not right!!!\n", r.message))

                }
            }
        })

        // ADDING PROCEDURES TO INVOICE
        let dental_procedure_table = frm.doc.dental_procedure_table

        let procedure_list = []
        

        for (let r in frm.doc.dental_procedure_table) {

            // Checking the first mandatory procedure added and pushing it to overall dental procedure list
            procedure_list.push(dental_procedure_table[r].procedure)

            // Checking if second procedure was added and pushing it to list
            if (dental_procedure_table[r].add_another_procedure == 1) {
                procedure_list.push(dental_procedure_table[r].second_procedure)
            }

            // Checking if third procedure was added and pushing it to list
            if (dental_procedure_table[r].add_third_procedure == 1) {
                procedure_list.push(dental_procedure_table[r].third_procedure)
            }

            // Checking if fourth procedure was added and pushing it to list
            if (dental_procedure_table[r].add_fourth_procedure == 1) {
                procedure_list.push(dental_procedure_table[r].fourth_procedure)
            }

        }


        // Get count of each item in the list
        const procedure_count = {};

        for (const element of procedure_list) {
            if (procedure_count[element]) {
                procedure_count[element] += 1;
            } else {
                procedure_count[element] = 1;
            }
        }

        console.log(procedure_count)


        // Updating the invoice with proocedure items and their quantities
        frappe.call({
            method: "gch_custom.services.rest.adding_dental_procedures_to_invoice",
            args: {
                procedures : procedure_count,
                patient: cur_frm.doc.patient,
                encounter: cur_frm.doc.patient_encounter
            }, callback(r) {
                if(r.message == true) {
                            
                    frappe.msgprint({
                        title: __('Notification'),
                        indicator: 'green',
                        message: __('Invoice has been updated successfully')
                    })

                } else {
                    frappe.throw(__("Somethings not right with the procedure items", r.message))
                    console.log(r.message)
                }
            }
        })



    }
});

frappe.ui.form.on("Dental Procedures GCH", {

    // 
    before_dental_procedure_table_remove: function(frm, cdt, cdn) {
        var deleted_row = frappe.get_doc(cdt, cdn)
        
        // console.log(deleted_row)
        if (deleted_row.tooth_number != "") {
            document.getElementById(deleted_row.tooth_number).remove()
        }
        
    },

    tooth_number: function (frm, cdt, cdn) {
        let row = locals[cdt][cdn];
        let selected_tooth_number = row["tooth_number"];

        let incisors = [11, 12, 21, 22, 31, 32, 41, 42, 51, 52, 61, 62, 71, 72, 81, 82]
        let canines = [13, 23, 33, 43, 53, 63, 73, 83]
        let premolars = [14, 15, 24, 25, 34, 35, 44, 45]
        let molars = [16, 17, 26, 27, 36, 37, 46, 47, 54, 55, 64, 65, 74, 75, 84, 85]
        let wisdom_teeth = [18, 28, 38, 48]

        let upper_right = [11, 12, 13, 14, 15, 16, 17, 18, 51, 52, 53, 54, 55]
        let upper_left = [21, 22, 23, 24, 25, 26, 27, 28, 61, 62, 63, 64, 65]
        let lower_left = [31, 32, 33, 34, 35, 36, 37, 38, 71, 72, 73, 74, 75]
        let lower_right = [41, 42, 43, 44, 45, 46, 47, 48, 81, 82, 83, 84, 85]
        

        if (incisors.includes(parseInt(selected_tooth_number))) {
            row.tooth_name = "Incisor"
            frm.refresh_field("dental_procedure_table")
            // console.log(true)
        } else if (canines.includes(parseInt(selected_tooth_number))) {
            row.tooth_name = "Canine"
            frm.refresh_field("dental_procedure_table")
        } else if (premolars.includes(parseInt(selected_tooth_number))) {
            row.tooth_name = "Premolar"
            frm.refresh_field("dental_procedure_table")
        } else if (molars.includes(parseInt(selected_tooth_number))) {
            row.tooth_name = "Molar"
            frm.refresh_field("dental_procedure_table")
        } else if (wisdom_teeth.includes(parseInt(selected_tooth_number))) {
            row.tooth_name = "Wisdom Tooth"
            frm.refresh_field("dental_procedure_table")
        } else {
            row.tooth_name = ""
            frm.refresh_field("dental_procedure_table")
        }


        if(upper_right.includes(parseInt(selected_tooth_number))) {
            row.location = "Upper Right"
            frm.refresh_field("dental_procedure_table")
        } else if(upper_left.includes(parseInt(selected_tooth_number))) {
            row.location = "Upper Left"
            frm.refresh_field("dental_procedure_table")
        } else if(lower_left.includes(parseInt(selected_tooth_number))) {
            row.location = "Lower Left"
            frm.refresh_field("dental_procedure_table")
        } else if(lower_right.includes(parseInt(selected_tooth_number))) {
            row.location = "Lower Right"
            frm.refresh_field("dental_procedure_table")
        }

        // console.log(selected_tooth_number);

        
    
    },


    // tooth_number: (frm, cdn, cdt) => {
    //     let row = locals[cdt][cdn];
    //     let selected_tooth_number = row["tooth_number"];

    //     console.log(selected_tooth_number);
    
        
    //     // if (frm.doc.tooth_number == "11" || "12" || "21" || "22" || "31" || "32" || "41" || "42") {
    //     //     row.tooth_name = "Incisor"
    //     // }
    
    // }

});


//

frappe.ui.form.on("Dental Procedures GCH", {
    procedure: (frm, cdt, cdn) => {
        let row = locals[cdt][cdn];

        if(row.procedure) {
            // Fetch procedure price
            frappe.call({
                method: "gch_custom.gch_custom.doctype.dental_clinic_procedure.dental_clinic_procedure.fetch_procedure_price",
                args: {
                    "item_code": row.procedure
                },
                callback: (res) => {
                    console.log(res.message)

                    row.price = res.message

                    console.log(frm.doc)

                    frm.refresh_field("dental_procedure_table")

                }
            })
        }

    },
    second_procedure: (frm, cdt, cdn) => {
        let row = locals[cdt][cdn];

        if(row.procedure) {
            // Fetch procedure price
            frappe.call({
                method: "gch_custom.gch_custom.doctype.dental_clinic_procedure.dental_clinic_procedure.fetch_procedure_price",
                args: {
                    "item_code": row.second_procedure
                },
                callback: (res) => {
                    console.log(res.message)

                    row.second_procedure_price = res.message

                    console.log(frm.doc)

                    frm.refresh_field("dental_procedure_table")

                }
            })
        }

    },
    third_procedure: (frm, cdt, cdn) => {
        let row = locals[cdt][cdn];

        if(row.procedure) {
            // Fetch procedure price
            frappe.call({
                method: "gch_custom.gch_custom.doctype.dental_clinic_procedure.dental_clinic_procedure.fetch_procedure_price",
                args: {
                    "item_code": row.third_procedure
                },
                callback: (res) => {
                    console.log(res.message)

                    row.third_procedure_price = res.message

                    console.log(frm.doc)

                    frm.refresh_field("dental_procedure_table")

                }
            })
        }

    },
    fourth_procedure: (frm, cdt, cdn) => {
        let row = locals[cdt][cdn];

        if(row.procedure) {
            // Fetch procedure price
            frappe.call({
                method: "gch_custom.gch_custom.doctype.dental_clinic_procedure.dental_clinic_procedure.fetch_procedure_price",
                args: {
                    "item_code": row.fourth_procedure
                },
                callback: (res) => {
                    console.log(res.message)

                    row.forth_procedure_price = res.message

                    console.log(frm.doc)

                    frm.refresh_field("dental_procedure_table")

                }
            })
        }

    }
    
});


frappe.ui.form.on("Doctor Prescription Table", {
    form_render: (frm, cdt, cdn) => {
      // console.log(frm);
      // console.log(cdt, cdn);
      // console.log(locals[cdt][cdn]);

      console.log("rendered....")
  
      let row = locals[cdt][cdn];
  
      row.dob = frm.doc.date_of_birth;
      row.age = frm.doc.age;
      row.height_in_centimeters = frm.doc.height;
      row.weight_in_kilograms = frm.doc.weight_in_kilograms;
      row.bmi = frm.doc.bmi;
      cur_frm.refresh_field("prescription_table");
      console.log(cur_frm, "Cuurent Form");
  
      let selected_generic_drug = row["generic_drug"];
      if (selected_generic_drug != undefined) {
        let drug = frappe.db
          .get_doc("Generic Drug Name", selected_generic_drug)
          .then((r) => {
            let mapped_routes = [];
            let mapped_preps = [];
            let mapped_uoms = [];
  
            r.drug_uom.map((el) => mapped_uoms.push(el.uom));
            r.route.map((el) => mapped_routes.push(`${el.drug_route} \n`));
            r.preparation.map((el) => mapped_preps.push(el.generic_drug_formula));
  
            frm.fields_dict.prescription_table.grid.update_docfield_property(
              "preparation_type",
              "options",
              [""].concat(mapped_preps)
            );
            frm.fields_dict.prescription_table.grid.update_docfield_property(
              "route",
              "options",
              [""].concat(mapped_routes)
            );
            frm.fields_dict.prescription_table.grid.update_docfield_property(
              "dose_uom",
              "options",
              [""].concat(mapped_uoms)
            );
            frm.fields_dict.prescription_table.grid.update_docfield_property(
              "prescription_frequency",
              "options",
              FREQUENCY_OPTIONS
            );
            frm.fields_dict.prescription_table.grid.update_docfield_property(
              "pharmacy_frequency",
              "options",
              [""].concat([...range(1, 100)])
              // FREQUENCY_OPTIONS
            );
  
            frm.refresh_field("prescription_table");
          });
      }
  
      if (frappe.user_roles.includes("GCH-Doctor")) {
        console.log("Doctor here on render");
        frm.set_df_property("available_quantity", "read_only", true);
        frm.set_df_property("available_quantity", "hidden", true);
        frm.set_df_property("billed_quantity", "hidden", true);
        frm.set_df_property("selling_quantity", "hidden", true);
  
        frm.set_df_property("pharmacy_dose", "hidden", true);
        frm.set_df_property("pharmacy_frequency", "hidden", true);
        frm.set_df_property("pharmacy_duration", "hidden", true);
  
        frm.set_df_property("discount", "hidden", true);
        frm.set_df_property("total", "hidden", true);
  
        frm.set_df_property("unit_price", "hidden", true);
        frm.set_df_property("total", "hidden", true);
        frm.set_df_property("brand", "read_only", true);
        frm.set_df_property("medication", "hidden", 1);
        frm.refresh_field("prescription_table");
      }
    },
    refresh: (frm, cdt, cdn) => {

    // FLAGGING IF PATIENT IS ALLERGIC TO GENERIC NAME CHOSEN 
    // -------------------------------
    // if (row.generic_drug_name )
    // for (var allergy in cur_frm.doc.drug_allergy) {
    //     console.log(cur_frm.doc.drug_allergy[allergy])
    //     if (cur_frm.doc.drug_allergy[allergy].drug_allergy.toLowerCase() == row.generic_drug_name.toLowerCase()) {
    //         console.log("True.....")
    //         $('[data-fieldname="generic_drug"]').find("label")[0].innerHTML = "Generic Drug (Patient is allergic to generic)"
    //         $('[data-fieldname="generic_drug"]').find("label")[0].style.color = "red";
    //         $('[data-fieldname="generic_drug"]').find("label")[0].style.fontSize = "13px";
    //         $('[data-fieldname="generic_drug"]').find("label")[0].style.fontWeight = "800";
    //         $('[data-fieldname="generic_drug"]').find("input")[0].style.color = "red";
    //         $('[data-fieldname="generic_drug"]').find("input")[0].style.backgroundColor = "#ff000014";
            

    //     } else {
    //         console.log("False")
    //     }
    //   }

      console.log(`on refresh`);
      console.log("Here goes", cdt, cdn);
      cur_frm.toggle_display("refillable", frappe.user.has_role("GCH-Doctor"));
      if (frappe.user_roles.includes("GCH-Doctor")) {
        console.log("Doctor here on refresh");
        frm.set_df_property("available_quantity", "read_only", true);
        frm.set_df_property("available_quantity", "hidden", true);
        frm.set_df_property("billed_quantity", "hidden", true);
        frm.set_df_property("selling_quantity", "hidden", true);
  
        frm.set_df_property("pharmacy_dose", "hidden", true);
        frm.set_df_property("pharmacy_frequency", "hidden", true);
        frm.set_df_property("pharmacy_duration", "hidden", true);
  
        frm.set_df_property("discount", "hidden", true);
        frm.set_df_property("total", "hidden", true);
  
        frm.set_df_property("unit_price", "hidden", true);
        frm.set_df_property("total", "hidden", true);
        frm.set_df_property("brand", "read_only", true);
        frm.set_df_property("medication", "hidden", 1);
        frm.refresh_field("prescription_table");
      }
    },
  
    onload: (frm, cdt, cdn) => {
  
      console.log(`onload ${frm}`);
      if (frappe.user_roles.includes("GCH-Doctor")) {
        console.log("Doctor here");
        frm.set_df_property("available_quantity", "read_only", true);
        frm.set_df_property("available_quantity", "hidden", true);
        frm.set_df_property("billed_quantity", "hidden", true);
        frm.set_df_property("selling_quantity", "hidden", true);
  
        frm.set_df_property("pharmacy_dose", "hidden", true);
        frm.set_df_property("pharmacy_frequency", "hidden", true);
        frm.set_df_property("pharmacy_duration", "hidden", true);
  
        frm.set_df_property("discount", "hidden", true);
        frm.set_df_property("total", "hidden", true);
  
        frm.set_df_property("unit_price", "hidden", true);
        frm.set_df_property("total", "hidden", true);
        frm.set_df_property("brand", "read_only", true);
        frm.set_df_property("medication", "hidden", 1);
        frm.refresh_field("prescription_table");
      }
      
  
    },
    
  
    generic_drug: (frm, cdt, cdn) => {
      let row = locals[cdt][cdn];
      let selected_generic_drug = row["generic_drug"];
      let frequency_options = [];
      let drug = frappe.db
        .get_doc("Generic Drug Name", selected_generic_drug)
        .then((r) => {
          let mapped_routes = [];
          let mapped_preps = [];
          let mapped_uoms = [];
  
          r.drug_uom.map((el) => mapped_uoms.push(el.uom));
          r.route.map((el) => mapped_routes.push(`${el.drug_route} \n`));
          r.preparation.map((el) => mapped_preps.push(el.generic_drug_formula));
  
          frm.fields_dict.prescription_table.grid.update_docfield_property(
            "preparation_type",
            "options",
            [""].concat(mapped_preps)
          );
          frm.fields_dict.prescription_table.grid.update_docfield_property(
            "route",
            "options",
            [""].concat(mapped_routes)
          );
          frm.fields_dict.prescription_table.grid.update_docfield_property(
            "dose_uom",
            "options",
            [""].concat(mapped_uoms)
          );
          frm.fields_dict.prescription_table.grid.update_docfield_property(
            "prescription_frequency",
            "options",
            // [""].concat([...range(1, 100)])
            FREQUENCY_OPTIONS
          );
          frm.fields_dict.prescription_table.grid.update_docfield_property(
            "pharmacy_frequency",
            "options",
            [""].concat([...range(1, 100)])
          );
  
          frm.refresh_field("prescription_table");
        });

        // FLAGGING IF PATIENT IS ALLERGIC TO GENERIC NAME CHOSEN 
        // -------------------------------
        // if (row.generic_drug_name )
        // for (var allergy in cur_frm.doc.drug_allergy) {
        //     console.log(cur_frm.doc.drug_allergy[allergy])
        //     if (cur_frm.doc.drug_allergy[allergy].drug_allergy.toLowerCase() == row.generic_drug_name.toLowerCase()) {
        //         console.log("True.....")
        //         $('[data-fieldname="generic_drug"]').find("label")[0].innerHTML = "Generic Drug (Patient is allergic to generic)"
        //         $('[data-fieldname="generic_drug"]').find("label")[0].style.color = "red";
        //         $('[data-fieldname="generic_drug"]').find("label")[0].style.fontSize = "13px";
        //         $('[data-fieldname="generic_drug"]').find("label")[0].style.fontWeight = "800";
        //         $('[data-fieldname="generic_drug"]').find("input")[0].style.color = "red";
        //         $('[data-fieldname="generic_drug"]').find("input")[0].style.backgroundColor = "#ff000014";
                

        //     } else {
        //         console.log("False")
        //     }
        // }

    },
    medication: async (frm, cdt, cdn) => {
      let row = locals[cdt][cdn];
      let selected_medication = row["medication"];
      console.log(selected_medication);
      let item_data = await frappe.db.get_doc("Item", selected_medication);
      let item_price_data = await frappe.db.get_doc("Item Price", null, {
        item_code: selected_medication,
      });
      console.log("Item Data", item_data);
      console.log("Item Price Data", item_price_data);
      row.unit_of_measure = item_data.stock_uom;
      row.discount = item_data.max_discount;
      row.available_quantity = item_data.opening_stock;
      row.unit_price = item_price_data.price_list_rate;
      let total = row.unit_price * row.selling_quantity;
      row.total = total;
      // let item = frappe.db.get_doc("Item", selected_medication).then((r) => {
      //   console.log(r)
      //   row.unit_of_measure = r.stock_uom;
      //   row.discount = r.max_discount;
      //   row.available_quantity = r.opening_stock;
      //   frm.refresh_field("prescription_table");
      // })
      // let item_price = frappe.db.get_doc("Item Price",null, {item_code:selected_medication}).then((r) => {
      //   console.log(r)
      //   row.unit_price = r.price_list_rate;
      //   frm.refresh_field("prescription_table");
      // })
      console.log("Refreshing table");
      frm.refresh_field("prescription_table");
    },
});



