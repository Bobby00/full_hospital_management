const booking_patients_to_theatre = async(cur_frm) => {

    let theatre_overview = ""
    theatre_overview = cur_frm.doc.theatre_overview

    if(theatre_overview){
        cur_frm.add_custom_button(__('Theatre Overview'),
            ()=> {
                let url = `/app/theatre-overview/${theatre_overview}`;
                window.location.href = url;
            }
        )
    }else {
        cur_frm.add_custom_button(__('Schedule Emergency Surgery'),
        () => {
            console.log("test test");
            let urgency = "Emergency";
            let patient = cur_frm.doc.patient;
            let record = cur_frm.doc.name;
            
            localStorage.setItem('inpatient_record', record);
            localStorage.setItem('urgency', urgency);
            localStorage.setItem('patient', patient);
            let url = `/app/theatre-booking-time`;
            window.location.href = url;
        },
        __("Schedule surgery")
    )

    cur_frm.add_custom_button(__('Schedule Surgery'),
        () => {
            console.log("Book normal surgery");
            let urgency = "Urgent";
            let patient = cur_frm.doc.patient;
            let record = cur_frm.doc.name;
            
            localStorage.setItem('inpatient_record', record);
            localStorage.setItem('urgency', urgency);
            localStorage.setItem('patient', patient);            
            let url = `/app/theatre-booking-time`;
            window.location.href = url;
        },
        __("Schedule surgery")
    )
    }

    
}