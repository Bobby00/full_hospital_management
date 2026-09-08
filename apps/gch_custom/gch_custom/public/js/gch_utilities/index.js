// Function to toggle any field in a frm to true or false
// Field: str, state: boolean
const toggle_permission = (frm, field, state) => {
  frm.set_df_property(field, "hidden", state);
  frm.refresh_field(field);
};
