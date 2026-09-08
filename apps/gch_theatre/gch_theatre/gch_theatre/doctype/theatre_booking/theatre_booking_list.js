frappe.listview_settings['Theatre Booking'] = {
    onload: function (listview) {
        // Add custom button to the list view toolbar
        listview.page.add_menu_item(__('Export All Records'), function () {
           
            var filters = frappe.route_options
           
            exportToCSV(filters)
        });
    }
};



function exportToCSV(filters) {
    // const filters = frappe.route_options;
    console.log(filters)
    frappe.call({
        method: 'gch_theatre.services.export_theatre_bookings',
        args: {
            filters: JSON.stringify(filters)
        },
        callback: function(response) {
            const data = response.message;
            const csv = convertToCSV(data);
            downloadCSV(csv, 'Theatre Bookings.csv');
        }
    });
}

function convertToCSV(data) {
    const csv = [
        ['Name', 'Patient', 'Doctor', 'Start Time', 'End Time']
    ];

    data.forEach(item => {
        csv.push([
            item.name,
            item.patient,
            item.surgeon_or_doctor,
            item.surgery_start_time,
            item.surgery_end_time
        ]);
    });

    return csv.map(row => row.join(',')).join('\n');
}

function downloadCSV(csv, filename) {
    const csvData = new Blob([csv], { type: 'text/csv;charset=utf-8,' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(csvData);
    a.download = filename;
    a.click();
}

