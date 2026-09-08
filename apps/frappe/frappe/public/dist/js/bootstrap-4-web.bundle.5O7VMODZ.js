(()=>{$(".dropdown-menu a.dropdown-toggle").on("click",function(s){s.preventDefault(),s.stopImmediatePropagation(),$(this).next().hasClass("show")||$(this).parents(".dropdown-menu").first().find(".show").removeClass("show");var o=$(this).next(".dropdown-menu");return o.toggleClass("show"),$(this).parents("li.nav-item.dropdown.show").on("hidden.bs.dropdown",function(){$(".dropdown-submenu .show").removeClass("show")}),!1});frappe.get_modal=function(s,o){return $(`<div class="modal" tabindex="-1" role="dialog">
			<div class="modal-dialog modal-dialog-scrollable" role="document">
				<div class="modal-content">
					<div class="modal-header">
						<h5 class="modal-title">${s}</h5>
						<button type="button" class="close" data-dismiss="modal" aria-label="Close">
						${frappe.utils.icon("close-alt","sm","close-alt")}
						</button>
					</div>
					<div class="modal-body">
						${o}
					</div>
					<div class="modal-footer hidden">
						<button type="button" class="btn btn-default btn-sm btn-modal-close" data-dismiss="modal">
							<i class="octicon octicon-x visible-xs" style="padding: 1px 0px;"></i>
							<span class="hidden-xs">${__("Close")}</span>
						</button>
						<button type="button" class="btn btn-sm btn-primary hidden"></button>
					</div>
				</div>
			</div>
		</div>`)};frappe.ui.Dialog=class extends frappe.ui.Dialog{get_primary_btn(){return this.$wrapper.find(".modal-footer .btn-primary")}set_primary_action(o,a){return this.$wrapper.find(".modal-footer").removeClass("hidden"),super.set_primary_action(o,a).removeClass("hidden")}make(){super.make(),this.fields&&this.$wrapper.find(".section-body").addClass("w-100")}};})();
//# sourceMappingURL=bootstrap-4-web.bundle.5O7VMODZ.js.map
