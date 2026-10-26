(function () {
  if (location.pathname === "/") return;

  if (document.getElementById("nut-ve-trang-chu")) return;

  const nut = document.createElement("a");
  nut.id = "nut-ve-trang-chu";
  nut.href = "/";
  nut.textContent = "🏠 Về trang chủ";

  Object.assign(nut.style, {
    position: "fixed",
    right: "16px",
    bottom: "20px",
    background: "#177b69",
    color: "white",
    padding: "12px 18px",
    borderRadius: "30px",
    textDecoration: "none",
    fontSize: "16px",
    fontWeight: "bold",
    zIndex: "99999",
    boxShadow: "0 3px 12px #0003"
  });

  document.body.appendChild(nut);
})();
