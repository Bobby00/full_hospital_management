$(document).ready(() => {
  const body = document.getElementsByTagName("body")[0];
  const user_info_box = document.getElementById("user_info_box");
  if (user_info_box) {
    user_info_box.remove();
  }
  const element = `<div id="user_info_box" style="
          position: fixed;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 10000;
          background-color: #2490ef;
          padding: 10px 10px 0 10px;
          display: flex;
          justify-content: center;
          color: white;
          align-items: center;
      ">
              <h5 style="
          color: white;
      ">xxLogged in as: ${frappe.session?.user_fullname} - ( ${frappe.session.user_email} )</h5>
          </div>`;
  body.insertAdjacentHTML("afterbegin", element);
});
