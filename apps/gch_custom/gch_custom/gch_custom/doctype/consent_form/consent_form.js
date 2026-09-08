// Copyright (c) 2023, Karani and contributors
// For license information, please see license.txt

frappe.ui.form.on('Consent Form', {
	refresh: function(frm) {
        // console.log("Oyaaaaaa!!!!!!")

        console.log(cur_frm.doc.doctor_name)

        // Setting Filter to only show procedures that require a consent form
        frm.set_query("procedure_name", function () {
            return {
              filters: [["requires_consent", "in", ["1"]]],
            };
        });

	},

    before_submit: () => {

        // Making some anaesthesia checkboxes mandatory
        if(cur_frm.doc.general_anaesthesia && 
            !cur_frm.doc.i_consent_and_authorize_performance_anesthesia && 
            !cur_frm.doc.i_refuse_to_consent_performance_anesthesia) {
            frappe.throw(__("Please consent or revoke performance of general anaesthesia"))
        }

        if(cur_frm.doc.local_anaesthesia && 
            !cur_frm.doc.i_consent_and_authorize_performance_anesthesia && 
            !cur_frm.doc.i_refuse_to_consent_performance_anesthesia) {
            frappe.throw(__("Please consent or revoke performance of local anaesthesia"))
        }

    },

    consent_template: () => {
        console.log("Oyaaaaaa!!!!!!")
        console.log(cur_frm.doc.doctor_name)
        console.log(cur_frm.doc.practitioner_code)

        if(cur_frm.doc.consent_template == "Procedure Consent Form" && cur_frm.doc.doctor_name != undefined) {


            // checking if selected doctor has signature available
            frappe.call({
                method: "gch_custom.services.rest.fetch_practitoner_signature",
                args: { practitioner_code : cur_frm.doc.practitioner_code },
                callback : (r) => {
                    if (r.message.practitioner_signature) {
                        console.log(r)

                        let doc_sign_canvas = $('div[data-fieldname="doctor_signature"]').find("canvas").get(0).getContext('2d')

                        console.log(doc_sign_canvas)

                        let base_image = new Image();
                        base_image.src = r.message.practitioner_signature;

                        base_image.onload = function () {
                            doc_sign_canvas.drawImage(base_image, 90, 30, 170, 120);

                            const base64_code = $('div[data-fieldname="doctor_signature"]').find("canvas").get(0).toDataURL()
                            cur_frm.set_value('doctor_signature', base64_code)

                        };
                    } else {
                        cur_frm.set_value('doctor_signature', "")
                        cur_frm.refresh_field("doctor_signature")
                    }
                    

                }
            })

            
            // base_image.onload = function(){
            //     doc_sign_canvas.drawImage(base_image, 0, 1);
                
            // }

        }

        if(cur_frm.doc.consent_template == "Consent for Post Mortem" && cur_frm.doc.doctor_name_post_mortem != undefined) {

            // checking if selected doctor has signature available
            frappe.call({
                method: "gch_custom.services.rest.fetch_practitoner_signature",
                args: { practitioner_code : cur_frm.doc.doctor_code_post_mortem },
                callback : (r) => {
                    if (r.message.practitioner_signature) {
                        console.log(r)

                        let doc_sign_canvas = $('div[data-fieldname="doctor_signature_post_mortem"]').find("canvas").get(0).getContext('2d')

                        console.log(doc_sign_canvas)

                        let base_image = new Image();
                        base_image.src = r.message.practitioner_signature;

                        base_image.onload = function () {
                            doc_sign_canvas.drawImage(base_image, 90, 30, 170, 120);

                            const base64_code = $('div[data-fieldname="doctor_signature_post_mortem"]').find("canvas").get(0).toDataURL()
                            cur_frm.set_value('doctor_signature_post_mortem', base64_code)

                        };

                        console.log(base_image)
                    } else {
                        cur_frm.set_value('doctor_signature_post_mortem', "")
                        cur_frm.refresh_field("doctor_signature_post_mortem")
                    }

                }
            })

            
            // base_image.onload = function(){
            //     doc_sign_canvas.drawImage(base_image, 0, 1);
                
            // }

        }
        

    },

    anesthetist_name: () => {
        if (cur_frm.doc.anesthetist_name != " " &&  cur_frm.doc.anesthetist_name) {
            // Fetch the practitoner's code to get signature
            frappe.call({
                method: "gch_custom.services.rest.fetch_practitoner_signature",
                args: { practitioner_code: cur_frm.doc.anesthetist_name },
                callback : (r) => {
                    if (r.message.practitioner_signature) {
                        console.log(r)


                        let anesthetist_sign_canvas = $('div[data-fieldname="anesthetist_signature"]').find("canvas").get(0).getContext('2d')

                        console.log(anesthetist_sign_canvas)

                        let base_image = new Image();
                        base_image.src = r.message.practitioner_signature;

                        base_image.onload = function () {
                            anesthetist_sign_canvas.drawImage(base_image, 90, 30, 170, 120);

                            const base64_code = $('div[data-fieldname="anesthetist_signature"]').find("canvas").get(0).toDataURL()
                            cur_frm.set_value('anesthetist_signature', base64_code)

                        };

                        console.log(base_image)
                    } else {
                        cur_frm.set_value('anesthetist_signature', "")
                        cur_frm.refresh_field("anesthetist_signature")
                    }

                }
            })
        }
    },

    witness_name: () => {
        if (cur_frm.doc.witness_name != " " && cur_frm.doc.witness_name) {
            // Fetch the practitoner's code to get signature
            frappe.call({
                method: "gch_custom.services.rest.fetch_practitoner_signature",
                args: { practitioner_code: cur_frm.doc.witness_name },
                callback : (r) => {
                    if (r.message.practitioner_signature) {
                        console.log(r)


                        let anesthetist_sign_canvas = $('div[data-fieldname="witness_signature"]').find("canvas").get(0).getContext('2d')

                        console.log(anesthetist_sign_canvas)

                        let base_image = new Image();
                        base_image.src = r.message.practitioner_signature;

                        base_image.onload = function () {
                            anesthetist_sign_canvas.drawImage(base_image, 90, 30, 170, 120);

                            const base64_code = $('div[data-fieldname="witness_signature"]').find("canvas").get(0).toDataURL()
                            cur_frm.set_value('witness_signature', base64_code)

                        };

                        console.log(base_image)

                    } else {
                        cur_frm.set_value('witness_signature', "")
                        cur_frm.refresh_field("witness_signature")
                    }
                }
            })
        }
    },

    interpreter_name: () => {
        if (cur_frm.doc.interpreter_name != " " && cur_frm.doc.interpreter_name) {
            // Fetch the practitoner's code to get signature
            frappe.call({
                method: "gch_custom.services.rest.fetch_practitoner_signature",
                args: { practitioner_code: cur_frm.doc.interpreter_name },
                callback : (r) => {
                    if (r.message.practitioner_signature) {
                        console.log(r)


                        let anesthetist_sign_canvas = $('div[data-fieldname="interpreter_signature"]').find("canvas").get(0).getContext('2d')

                        console.log(anesthetist_sign_canvas)

                        let base_image = new Image();
                        base_image.src = r.message.practitioner_signature;

                        base_image.onload = function () {
                            anesthetist_sign_canvas.drawImage(base_image, 90, 30, 170, 120);

                            const base64_code = $('div[data-fieldname="interpreter_signature"]').find("canvas").get(0).toDataURL()
                            cur_frm.set_value('interpreter_signature', base64_code)

                        };

                        console.log(base_image)


                    } else {
                        cur_frm.set_value('interpreter_signature', "")
                        cur_frm.refresh_field("interpreter_signature")
                    }
                }
            })
        }
    },

    revoked_by: () => {
        if (cur_frm.doc.revoked_by != " ") {
            // Fetch the practitoner's code to get signature
            frappe.call({
                method: "gch_custom.services.rest.fetch_practitoner_signature",
                args: { practitioner_code: cur_frm.doc.revoked_by },
                callback : (r) => {
                    if(r.message.practitioner_signature) {
                        console.log(r)


                        let anesthetist_sign_canvas = $('div[data-fieldname="revoker_signature"]').find("canvas").get(0).getContext('2d')

                        console.log(anesthetist_sign_canvas)

                        let base_image = new Image();
                        base_image.src = r.message.practitioner_signature;

                        base_image.onload = function () {
                            anesthetist_sign_canvas.drawImage(base_image, 90, 30, 170, 120);

                            const base64_code = $('div[data-fieldname="revoker_signature"]').find("canvas").get(0).toDataURL()
                            cur_frm.set_value('revoker_signature', base64_code)

                        };

                        console.log(base_image)


                    } else {
                        cur_frm.set_value('revoker_signature', "")
                        cur_frm.refresh_field("revoker_signature")
                    }
                }
            })
        }
    },



    witness_name_post_mortem: () => {
        if (cur_frm.doc.revoked_by != " " && cur_frm.doc.witness_name_post_mortem) {
            // Fetch the practitoner's code to get signature
            frappe.call({
                method: "gch_custom.services.rest.fetch_practitoner_signature",
                args: { practitioner_code: cur_frm.doc.witness_name_post_mortem },
                callback : (r) => {
                    if (r.message.practitioner_signature) {
                        console.log(r)


                        let anesthetist_sign_canvas = $('div[data-fieldname="witness_signature_post_mortem"]').find("canvas").get(0).getContext('2d')

                        console.log(anesthetist_sign_canvas)

                        let base_image = new Image();
                        base_image.src = r.message.practitioner_signature;

                        base_image.onload = function () {
                            anesthetist_sign_canvas.drawImage(base_image, 90, 30, 170, 120);

                            const base64_code = $('div[data-fieldname="witness_signature_post_mortem"]').find("canvas").get(0).toDataURL()
                            cur_frm.set_value('witness_signature_post_mortem', base64_code)

                        };

                        console.log(base_image)


                    } else {
                        cur_frm.set_value('witness_signature_post_mortem', "")
                        cur_frm.refresh_field("witness_signature_post_mortem")
                    }
                }
            })
        }
    }





});
