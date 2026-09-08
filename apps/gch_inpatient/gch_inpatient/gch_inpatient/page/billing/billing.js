frappe.pages['billing'].on_page_load = function(wrapper) {
	new BillingWindow(wrapper)
}

const back_to_previous_page =  function (){
	console.log("here Got");
	
	window.history.back();
}

const calculate_age = function (birth) {
	let ageMS = Date.parse(Date()) - Date.parse(birth);
	let gch_patient_age = new Date();
	gch_patient_age.setTime(ageMS);
	let years = gch_patient_age.getFullYear() - 1970;
  
	return `${years} ${__("Year(s)")} ${gch_patient_age.getMonth()} ${__(
	  "Month(s)"
	)} ${gch_patient_age.getDate()} ${__("Day(s)")}`;
};

BillingWindow = Class.extend({
	init: function(wrapper) {
		this.make(wrapper);
	},

	make: async function (wrapper) {
		this.page = frappe.ui.make_app_page({
			parent: wrapper,
			title: 'Billing',
			single_column: true
		});

		var params = frappe.get_route();
		var invoice = params[1];
		this.invoice = invoice

		let patient = {}
		await frappe.call({
			method: "gch_inpatient.services.get_patient_in_invoice",
			args: {
				"sales_invoice": invoice
			},
			callback: (res)=> {
				if(res.message){
					patient = res.message
					this.patient = res.message
					let age = calculate_age(patient.dob)
					this.age = age
				}
			}
		})

		this.page.patient = patient

		this.page.main.html(
			frappe.render_template(
				frappe.templates.billing,
				this
			)
		).html();

		this.fetch_item_groups();
		this.fetch_doctors();

		$('#service-category').on('change', (event)=> {
			let item_group = event.target.value;
			if(item_group){
				this.load_items_by_category(item_group);
			}
			else {
				$('#service-list').html('<option value="">Select category</option>');
			}
		});

		$('#service-list').on('dblclick', 'option', (event) => {
			let itemName = $(event.target).text();
			let item_code = $(event.target).val()
			this.create_table_if_not_exists(itemName, item_code);
		});

		const today = new Date().toISOString().split('T')[0];
		$('#date').val(today);

		$('#item-search').on('input', (event) => {
			let searchTerm = event.target.value.trim().toLowerCase();
			if (searchTerm.length > 0) {
				this.search_items(searchTerm);
			} else {
				$('#service-list').html('<option value="">Type to search...</option>');
			}
		});
	},

	fetch_item_groups: async function () {
		frappe.call({
			method: "gch_inpatient.services.fetch_item_groups",
			args: {},
			callback: (res) => {
				if(res.message){
					let options = '';
                    res.message.forEach(function(category) {
                        options += `<option value="${category.name}">${category.name}</option>`;
                    });
                    $('#service-category').html(options);
				}else {
					$('#service-category').html('<option value="">No categories found</option>');
				}
			}
		})
	},

	fetch_doctors: async function () {
		frappe.call({
			method: "gch_inpatient.services.fetch_doctors",
			args: {},
			callback: (res) => {
				if(res.message){
					let options = '<option>Select Doctor</option>';
                    res.message.forEach(function(doctor) {
                        options += `<option value="${doctor.name}">${doctor.practitioner_name}</option>`;
                    });
                    $('#doctor').html(options);
				}else {
					$('#doctor').html('<option value="">No doctors found</option>');
				}
			}
		})
	},

	load_items_by_category: function(category_name) {
		let key = category_name.replace(/\s+/g, '');
        const cacheKey = `items_cache_${key}`;
        const cacheTimeout = 24 * 60 * 60 * 1000; // 24 hours

        let cachedItems = localStorage.getItem(cacheKey);
        if (cachedItems) {
            cachedItems = JSON.parse(cachedItems);
            if (Date.now() - cachedItems.timestamp < cacheTimeout) {
                this.populate_items(cachedItems.items);
                return;
            } else {
                localStorage.removeItem(cacheKey);
            }
        }

        frappe.call({
            method: 'gch_inpatient.services.fetch_item_by_groups',
            args: { item_group: category_name },
            callback: (r) => {
                if (r.message.length > 0) {
                    localStorage.setItem(cacheKey, JSON.stringify({
                        timestamp: Date.now(),
                        items: r.message
                    }));
                    this.populate_items(r.message);
                } else {
                    $('#service-list').html('<option value="">No items found</option>');
                }
            }
        });
    },

	search_items: function(searchTerm) {
		const cacheKey = `items_search_${searchTerm}`;
		const cacheTimeout = 24 * 60 * 60 * 1000; // 24 hours

		let cachedItems = localStorage.getItem(cacheKey);
		if (cachedItems) {
			cachedItems = JSON.parse(cachedItems);
			if (Date.now() - cachedItems.timestamp < cacheTimeout) {
				this.populate_items(cachedItems.items);
				return;
			} else {
				localStorage.removeItem(cacheKey);
			}
		}

		frappe.call({
			method: 'gch_inpatient.services.search_items',
			args: { search_term: searchTerm },
			callback: (r) => {
				if (r.message.length > 0) {
					localStorage.setItem(cacheKey, JSON.stringify({
						timestamp: Date.now(),
						items: r.message
					}));
					this.populate_items(r.message);
				} else {
					$('#service-list').html('<option value="">No items found</option>');
				}
			}
		});
	},

    populate_items: function(items) {
        let options = '';
        items.forEach((item) => {
            options += `<option value="${item.name}">${item.item_name}</option>`;
        });
        $('#service-list').html(options);
    },

	create_table_if_not_exists: function(itemName, item_code) {
		// Capture values from frequency, duration, and date fields
		// let frequency = $('#frequency').val();
		// let duration = $('#duration').val();
		let date = $('#date').val();
		let units = $('#units').val();

		if (!$('#selected-items-table').length) {
			let table = `<table id="selected-items-table" class="table table-bordered">
				<thead>
					<tr>
						<th style="width: 40%;">Item Name</th>
                        <th style="width: 10%;">Quantity</th>
                        <th style="width: 10%;">Price</th>
                        <th style="width: 10%;">Date</th>
                        <th style="width: 10%;">Total</th>
                        <th style="width: 10%;">Action</th>
					</tr>
				</thead>
				<tbody></tbody>
			</table>`;

			let submitButton = `<button id="submit-billing" class="btn btn-primary mt-3">Submit</button>`;

			this.page.main.append(table + submitButton);
		}

		this.add_to_table(itemName, units, date, item_code);

		this.attach_submit_handler();
	},
	

	add_to_table: async function(itemName, units, date, item_code) {
		let item_price = '';
		let item_group = ''
		await frappe.call({
			method: "gch_inpatient.services.get_item_details",
			args: {
				"item_code": item_code
			},
			callback: (res)=> {
				if(res.message){
					item_price = res.message.price
					item_group = res.message.item_group
				}
			}
		})
		const price = item_price;
		const tableBody = $('#selected-items-table tbody');

		let newRow = `<tr>
			<td>
				<input type="text" class="form-control-plaintext" value="${itemName}" readonly>
				<input type="hidden" class="item-code" value="${item_code}">
				<input type="hidden" class="item-group" value="${item_group}">
			</td>
			<td><input type="number" class="form-control" value="${units}" min="0" oninput="updateTotal(this, ${price})"></td>
			<td><input type="text" class="form-control-plaintext" value="${price}" readonly></td>
			<td><input type="date" class="form-control-plaintext" value="${date}" ></td>
			<td><input type="text" class="form-control-plaintext total" value="${price}" readonly></td>
			<td><button type="button" class="btn btn-danger" onclick="deleteRow(this)">Delete</button></td>
		</tr>`;

		tableBody.append(newRow);
	},

	attach_submit_handler: function() {
		var params = frappe.get_route();
		var invoice = params[1];
		$('#submit-billing').off('click').on('click', () => {
			let tableData = [];
			$('#selected-items-table tbody tr').each((index, row) => {
				let itemCode = $(row).find('td:eq(0) .item-code').val(); // Getting the hidden item_code
				let itemGroup = $(row).find('td:eq(0) .item-group').val(); // Getting the hidden item_group
				let itemName = $(row).find('td:eq(0) input[type="text"]').val(); // Getting the visible itemName
				let quantity = $(row).find('td:eq(1) input').val();
				let price = $(row).find('td:eq(2) input').val();
				let date = $(row).find('td:eq(3) input').val();
				let total = $(row).find('td:eq(4) input').val();
				tableData.push({ itemCode, itemName, itemGroup, quantity, price,  date, total });
			});

			console.log('Submitted Data:', tableData);

			// Send tableData to the server here

			frappe.call({
				method: "gch_inpatient.services.add_to_bill",
				args: {
					item_list: tableData,
					sales_invoice: invoice
				},
				callback: (res) => {
					if(res.message){
						console.log(res.message)
						frappe.msgprint("Items added successfully");
					}
				}
			})

			$('#selected-items-table').remove();
			$('#submit-billing').remove();
		});
	}
});

function updateTotal(quantityInput, price) {
	const row = $(quantityInput).closest('tr');
	const quantity = parseInt(quantityInput.value);
	const totalCell = row.find('.total');
	if (quantity >= 1) {
		const total = quantity * price;
		totalCell.val(total);
	} else {
		quantityInput.value = 1;
		totalCell.val(price);
	}
}

function deleteRow(button) {
	const row = $(button).closest('tr');
	row.remove();
}
