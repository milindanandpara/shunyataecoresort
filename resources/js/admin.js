import axios from 'axios';
import moment from 'moment';
import Noty from 'noty';
export function initAdmin(socket) {
    const orderTableBody = document.querySelector('#orderTableBody');
    const totalOrdersElement = document.querySelector('#totalOrders');
    const orderStatusCountsElement = document.querySelector('#orderStatusCounts'); // Add this element in your HTML to display counts
    const filterButtonsContainer = document.querySelector('#filterButtons');
    let orders = [];
    let markup;

    // Function to fetch orders
    function fetchOrders() {
        axios.get('/admin/orders', {
            headers: {
                "X-Requested-With": "XMLHttpRequest"
            }
        }).then(res => {
            orders = res.data;
            console.log('Fetched orders:', orders); // Debug log
            markup = generateMarkup(orders);
            orderTableBody.innerHTML = markup;
            updateTotalOrders(orders.length);
            updateOrderStatusCounts(); // Update counts
        }).catch(err => {
            console.error('Error fetching orders:', err);
        });
    }

    // Initial fetch
    fetchOrders();

    // Set interval to reload orders every 5 seconds
    setInterval(fetchOrders, 5000); // 5000 ms = 5 seconds


    function generateMarkup(filteredOrders) {
        if (!filteredOrders.length) {
            return `<tr><td colspan="6" class="text-center">No orders found</td></tr>`;
        }

        return filteredOrders.map(order => {
            return `
                <tr>
                    <td class="border px-4 py-2 text-green-900">
                        <p>${order.id}</p>
                     
                    </td>
                    <td class="border px-4 py-2">${order.name}</td>
                    <td class="border px-4 py-2">${order.address}</td>
                    <td class="border px-4 py-2">
                        <div class="inline-block relative w-64">
                            <form action="/admin/order/status" method="POST">
                                <input type="hidden" name="orderId" value="${order.id}">
                                <select name="status" onchange="this.form.submit()"
                                    class="block appearance-none w-full bg-white border border-gray-400 hover:border-gray-500 px-4 py-2 pr-8 rounded shadow leading-tight focus:outline-none focus:shadow-outline">
                                    <option value="order_placed" ${order.status === 'order_placed' ? 'selected' : ''}>Placed</option>
                                    <option value="confirmed" ${order.status === 'confirmed' ? 'selected' : ''}>Confirmed</option>
                                    <option value="packed" ${order.status === 'packed' ? 'selected' : ''}>Packed</option>
                                    <option value="delivered" ${order.status === 'delivered' ? 'selected' : ''}>Delivered</option>
                                    <option value="completed" ${order.status === 'completed' ? 'selected' : ''}>Completed</option>
                                </select>
                            </form>
                        </div>
                    </td>
                    <td class="border px-8 py-4 text-gray-600">
                        ${moment(order.createdAt).format('DD-MM-YYYY hh:mm A')}
                    </td>
                    <td class="border px-4 py-2">
                        <span class="text-green-500" style="${order.paymentStatus ? '' : 'display: none;'}">
                            + ${order.totalPrice} Paid
                        </span>
                        <span class="text-red-500" style="${order.paymentStatus ? 'display: none;' : ''}">
                            + ${order.totalPrice} Not Paid
                        </span>
                    </td>
                </tr>
            `;
        }).join('');
    }

    function updateTotalOrders(count) {
        totalOrdersElement.innerHTML = `Total Orders: ${count}`;
    }

    function updateOrderStatusCounts() {
        const statusCounts = {
            placed: 0,
            confirmed: 0,
            packed: 0,
            delivered: 0,
            completed: 0,
        };

        // Count orders by status
        orders.forEach(order => {
            if (statusCounts[order.status] !== undefined) {
                statusCounts[order.status]++;
            }
        });

        // Display the counts (update this as per your UI structure)
        orderStatusCountsElement.innerHTML = `
            <p>Placed: ${statusCounts.placed}</p>
            <p>Confirmed: ${statusCounts.confirmed}</p>
            <p>Packed: ${statusCounts.packed}</p>
            <p>Delivered: ${statusCounts.delivered}</p>
            <p>Completed: ${statusCounts.completed}</p>
        `;
    }

    function filterOrders(status) {
        let filteredOrders;
        if (status === 'all') {
            filteredOrders = orders;
        } else {
            filteredOrders = orders.filter(order => order.status === status);
        }
        console.log('Filtered orders:', filteredOrders); // Debug log
        orderTableBody.innerHTML = generateMarkup(filteredOrders);
    }

    filterButtonsContainer.addEventListener('click', (e) => {
        const status = e.target.getAttribute('data-status');
        console.log('Filter button clicked. Status:', status); // Debug log
        if (status) {
            filterOrders(status);
        }
    });

    socket.on('orderPlaced', (order) => {
        new Noty({
            type: 'success',
            timeout: 1000,
            text: 'New order!',
            progressBar: false,
        }).show();
        orders.unshift(order);
        orderTableBody.innerHTML = '';
        orderTableBody.innerHTML = generateMarkup(orders);
        updateTotalOrders(orders.length);
        updateOrderStatusCounts(); // Update counts when a new order is placed
    });
}