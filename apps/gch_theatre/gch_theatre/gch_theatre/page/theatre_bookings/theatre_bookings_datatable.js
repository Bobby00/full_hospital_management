// import DataTable from 'frappe-datatable';


frappe.pages['theatre-bookings'].on_page_load = function(wrapper) {
    new TheatreBookings(wrapper);
}

TheatreBookings = Class.extend({
    init: function(wrapper) {
        this.page = frappe.ui.make_app_page({
            parent: wrapper,
            title: 'Theatre Bookings',
            single_column: true
        });
        this.make();
    }
    ,
    make: async function() {
        // Add date filter control
        let date_filter = this.page.add_field({
            fieldname: 'date_filter',
            label: __('Date Filter'),
            fieldtype: 'Select',
            options: [
                { 'value': 'today', 'label': __('Today') },
                { 'value': 'tomorrow', 'label': __('Tomorrow') },
                { 'value': 'week', 'label': __('This Week') },
                { 'value': 'month', 'label': __('This Month') },
                { 'value': 'year', 'label': __('This Year') },
                { 'value': 'all', 'label': __('All') }
            ],
            default: 'today',
            input_css: { 'z-index': 3 },
            change: function() {
                // me.get_data();
            }
        });
        // Add surgeon filter control
        let surgeon_filter = this.page.add_field({
            fieldname: 'surgeon_filter',
            label: __('Surgeon Filter'),
            fieldtype: 'Link',
            options: 'Healthcare Practitioner',
            input_css: { 'z-index': 3 },
            change: function() {
                // me.get_data();
            }
        });
        surgeon_filter.set_value(frappe.get_route()[1]);
        // Add refresh button
        this.page.set_primary_action(__('Refresh'), function() {
            // me.get_data();
        }
        );
        // Add table. Table should be added after controls so that controls are on top of table


        this.page.main.html(frappe.render_template('theatre_bookings', this));

        // this.make_table();


    },
    make_table: function() {  // Datatable is not defined
        let me = this;
        let columns = [
            { 'label': 'Patient', 'fieldname': 'patient', 'fieldtype': 'Link', 'options': 'Patient' },
            { 'label': 'Surgeon', 'fieldname': 'surgeon', 'fieldtype': 'Link', 'options': 'Healthcare Practitioner' },
            { 'label': 'Procedure', 'fieldname': 'procedure', 'fieldtype': 'Link', 'options': 'Clinical Procedure' },
            { 'label': 'Start Time', 'fieldname': 'start_time', 'fieldtype': 'Datetime' },
            { 'label': 'End Time', 'fieldname': 'end_time', 'fieldtype': 'Datetime' },
            { 'label': 'Status', 'fieldname': 'status', 'fieldtype': 'Data' },
            { 'label': 'Notes', 'fieldname': 'notes', 'fieldtype': 'Data' },
        ];

        // Dummy data
        let data = [

        ]

        let table = new frappe.DataTable('#theatre-bookings-table', {
            columns: columns,
            data: data,
            // layout: 'fluid',
            no_data_message: __('No Results'),
            inline_filters: true,
            get_data: function() {
                // return me.get_data();
            }
        });
    },
    
    get_data: function() {
        let me = this;
        let filters = {
            'date_filter': me.page.fields_dict.date_filter.get_value(),
            'surgeon_filter': me.page.fields_dict.surgeon_filter.get_value()
        };
        return frappe.call({
            method: 'gch_theatre.gch_theatre.page.theatre_bookings.theatre_bookings.get_data',
            args: {
                'filters': filters
            },
            callback: function(r) {
                if (r.message) {
                    return r.message;
                }
            }
        });
    }


    

});