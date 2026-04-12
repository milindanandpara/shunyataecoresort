document.addEventListener("DOMContentLoaded", () => {
    // Sidebar toggle for mobile
    const menuToggle = document.getElementById("menuToggle");
    const sidebar = document.getElementById("sidebar");

    menuToggle.addEventListener("click", () => {
        sidebar.classList.toggle("active");
    });

    // Example data fetching
    const orders = 125;
    const users = 56;
    const products = 78;

    // Update UI dynamically
    document.getElementById("total-orders").textContent = orders;
    document.getElementById("total-users").textContent = users;
    document.getElementById("total-products").textContent = products;
});