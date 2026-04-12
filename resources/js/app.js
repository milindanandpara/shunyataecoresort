import axios from 'axios'
import Noty from 'noty'
import { initAdmin } from './admin'
import moment from 'moment'
import { initStripe } from './stripe'
let addToCartBtns = document.querySelectorAll('.add-to-cart');
let cartCounter = document.querySelector('#cartCounter');

// Add room to prebooking
function updateCart(room, button) {
    if (button.classList.contains("clicked")) return;
    button.classList.add("clicked");

    console.log("Adding room to prebooking:", room);

    axios.post('/prebooking/add/', room)
        .then(res => {
            console.log("Server response:", res.data);
            cartCounter.innerText = res.data.totalQty;

            new Noty({
                type: 'success',
                timeout: 1000,
                text: 'Room added to prebooking',
                progressBar: false,
            }).show();

            setTimeout(() => button.classList.remove("clicked"), 500);
        })
        .catch(err => {
            console.error(err);
            new Noty({
                type: 'error',
                timeout: 1000,
                text: 'Something went wrong',
                progressBar: false,
            }).show();
            button.classList.remove("clicked");
        });
}

// Attach click
addToCartBtns.forEach(btn => {
    btn.addEventListener("click", function () {
        let room = JSON.parse(this.dataset.room);
        updateCart(room, this);
    });
});

// Delete room
function deleteItem(itemId) {
    console.log(`Deleting room from prebooking: ${itemId}`);
    axios.post('/booking-cart/delete-item', { itemId })
        .then(res => {
            if (res.data.success) {
                cartCounter.innerText = res.data.totalQty;
                new Noty({
                    type: 'success',
                    timeout: 1000,
                    text: 'Room removed from prebooking',
                    progressBar: false,
                }).show();
                setTimeout(() => location.reload(), 1000);
            } else {
                new Noty({
                    type: 'error',
                    timeout: 1000,
                    text: res.data.message || 'Cannot remove room',
                    progressBar: false,
                }).show();
            }
        })
        .catch(err => {
            console.error(err);
            new Noty({
                type: 'error',
                timeout: 1000,
                text: 'Something went wrong',
                progressBar: false,
            }).show();
        });
}

// Quantity update
document.querySelectorAll('.increase-btn, .decrease-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const itemId = btn.dataset.itemId;
        const action = btn.dataset.action;
        updateQuantity(itemId, action);
    });
});

function updateQuantity(itemId, action) {
    axios.post('/booking-cart/update-item', { itemId, action })
        .then(res => {
            if (res.data.success) {
                new Noty({
                    type: 'success',
                    timeout: 1000,
                    text: 'Prebooking updated',
                    progressBar: false,
                }).show();
                setTimeout(() => location.reload(), 1000);
            } else {
                new Noty({
                    type: 'error',
                    timeout: 1000,
                    text: res.data.message || 'Cannot update quantity',
                    progressBar: false,
                }).show();
            }
        })
        .catch(err => {
            console.error(err);
            new Noty({
                type: 'error',
                timeout: 1000,
                text: 'Something went wrong',
                progressBar: false,
            }).show();
        });
}

// Attach delete
document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        let itemId = btn.dataset.itemId;
        deleteItem(itemId);
    });
});
// Edit User
document.querySelectorAll('.edit-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
        const userId = btn.getAttribute('data-user-id');
        const userName = btn.getAttribute('data-user-name');
        const userEmail = btn.getAttribute('data-user-email');
        const userRole = btn.getAttribute('data-user-role');

        const newName = prompt("Enter new name:", userName);
        const newEmail = prompt("Enter new email:", userEmail);
        const newRole = prompt("Enter new role:", userRole);

        if (newName && newEmail && newRole) {
            axios.post('/edit-user', {
                userId,
                name: newName,
                email: newEmail,
                role: newRole
            })
            .then((res) => {
                console.log("Edit Response:", res.data);
                new Noty({
                    type: 'success',
                    timeout: 1000,
                    text: res.data.message,
                    progressBar: false,
                }).show();
                setTimeout(() => location.reload(), 1000); // Reload the page
            })
            .catch((err) => {
                console.error("Error editing user:", err);
                new Noty({
                    type: 'error',
                    timeout: 1000,
                    text: 'Impossibile modificare l utente',
                    progressBar: false,
                }).show();
            });
        }
    });
});
document.querySelectorAll('.block-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
        const userId = btn.getAttribute('data-user-id'); // Ensure userId is correct
        if (userId) {
            axios.post('/block-user', { userId }) // Send the request
                .then((res) => {
                    if (res.data.success) {
                        new Noty({
                            type: 'success',
                            timeout: 1000,
                            text: res.data.message,
                            progressBar: false,
                        }).show();
                        setTimeout(() => location.reload(), 1000); // Reload the page
                    } else {
                        new Noty({
                            type: 'error',
                            timeout: 1000,
                            text: res.data.message || 'Failed to update block status',
                            progressBar: false,
                        }).show();
                    }
                })
                .catch((err) => {
                    console.error("Error:", err);
                    new Noty({
                        type: 'error',
                        timeout: 1000,
                        text: 'Something went wrong while updating block status',
                        progressBar: false,
                    }).show();
                });
        }
    });
});

// Delete User
document.querySelectorAll('.delete-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
        const userId = btn.getAttribute('data-user-id');
        if (confirm('Sei sicuro di voler eliminare questo utente?')) {
            axios.post('/delete-user', { userId })
                .then((res) => {
                    console.log("Delete Response:", res.data);
                    new Noty({
                        type: 'success',
                        timeout: 1000,
                        text: res.data.message,
                        progressBar: false,
                    }).show();
                    setTimeout(() => location.reload(), 1000); // Reload the page
                })
                .catch((err) => {
                    console.error("Error deleting user:", err);
                    new Noty({
                        type: 'error',
                        timeout: 1000,
                        text: 'Failed to delete user',
                        progressBar: false,
                    }).show();
                });
        }
    });
});
document.querySelectorAll('.edit-product-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
        // Get product data attributes
        const productId = btn.getAttribute('data-product-id');
        const productName = btn.getAttribute('data-product-name');
        const productSize = btn.getAttribute('data-product-size');
        const productPrice = btn.getAttribute('data-product-price');
        let productImages = JSON.parse(btn.getAttribute('data-product-images') || '[]');

        if (Array.isArray(productImages[0])) {
            productImages = productImages[0]; // Extract inner array if nested
        }

        // Show the product modal
        const modal = document.querySelector('#editProductModal');
        modal.classList.remove('hidden');

        // Populate modal fields
        document.querySelector('#editProductId').value = productId;
        document.querySelector('#editName').value = productName;
        document.querySelector('#editSize').value = productSize;
        document.querySelector('#editPrice').value = productPrice;

        // Display current images
        const previewContainer = document.querySelector('#editImagePreviewContainer');
        previewContainer.innerHTML = ''; // Clear previous images
        productImages.forEach((image) => {
            const img = document.createElement('img');
            img.src = image;
            img.className = 'w-20 h-20 object-cover rounded-lg';
            previewContainer.appendChild(img);
        });

        // Handle modal form submission
        const form = document.querySelector('#editProductForm');
        form.onsubmit = (event) => {
            event.preventDefault();

            const formData = new FormData();
            formData.append('productId', productId);
            formData.append('name', document.querySelector('#editName').value);
            formData.append('size', document.querySelector('#editSize').value);
            formData.append('price', document.querySelector('#editPrice').value);

            const imageFiles = document.querySelector('#editImages').files;
            Array.from(imageFiles).forEach(file => {
                formData.append('images', file);
            });

            // Send update request
            axios.post('/admin/edit-product', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            })
            .then((res) => {
                new Noty({
                    type: 'success',
                    timeout: 1000,
                    text: res.data.message,
                    progressBar: false,
                }).show();
                setTimeout(() => location.reload(), 1000);
            })
            .catch((err) => {
                console.error("Error editing product:", err);
                new Noty({
                    type: 'error',
                    timeout: 1000,
                    text: 'Failed to edit product',
                    progressBar: false,
                }).show();
            });
        };

        // Close modal on cancel
        document.querySelector('#cancelEdit').addEventListener('click', () => {
            modal.classList.add('hidden');
        });
    });
});
// Delete Product
document.querySelectorAll('.delete-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
        const productId = btn.getAttribute('data-product-id');
        if (confirm('Are you sure you want to delete this product?')) {
            // Send Ajax request to delete product
            axios.post('/admin/delete-product', { productId })
                .then((res) => {
                    console.log("Delete Response:", res.data);
                    new Noty({
                        type: 'success',
                        timeout: 1000,
                        text: res.data.message,
                        progressBar: false,
                    }).show();
                    setTimeout(() => location.reload(), 1000); // Reload the page to update the list
                })
                .catch((err) => {
                    console.error("Error deleting product:", err);
                    new Noty({
                        type: 'error',
                        timeout: 1000,
                        text: 'Failed to delete product',
                        progressBar: false,
                    }).show();
                });
        }
    });
});



document.addEventListener('DOMContentLoaded', () => {
    // Open "Add New Product" modal
    document.getElementById('addNewProduct').addEventListener('click', () => {
        const modal = document.getElementById('newProductModal');
        modal.classList.remove('hidden'); // Show modal
    });

    // Close "Add New Product" modal
    document.getElementById('cancelAdd').addEventListener('click', () => {
        const modal = document.getElementById('newProductModal');
        modal.classList.add('hidden'); // Hide modal
    });

    // Handle "Add New Product" form submission
    document.getElementById('newProductForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const form = e.target;
        const formData = new FormData(form);

        axios.post('/admin/add-product', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        })
        .then((res) => {
            console.log('Product Added:', res.data);
            new Noty({
                type: 'success',
                timeout: 1000,
                text: res.data.message,
                progressBar: false,
            }).show();
            setTimeout(() => location.reload(), 1000); // Reload page
        })
        .catch((err) => {
            console.error('Error adding product:', err);
            new Noty({
                type: 'error',
                timeout: 1000,
                text: 'Failed to add product',
                progressBar: false,
            }).show();
        });
    });
});


// Remove alert message after X seconds
const alertMsg = document.querySelector('#success-alert')
if(alertMsg) {
    setTimeout(() => {
        alertMsg.remove()
    }, 2000)
}

// Change order status
let statuses = document.querySelectorAll('.status_line')
let hiddenInput = document.querySelector('#hiddenInput')
let order = hiddenInput ? hiddenInput.value : null
order = JSON.parse(order)
let time = document.createElement('small')

function updateStatus(order) {
    statuses.forEach((status) => {
        status.classList.remove('step-completed')
        status.classList.remove('current')
    })
    let stepCompleted = true;
    statuses.forEach((status) => {
       let dataProp = status.dataset.status
       if(stepCompleted) {
            status.classList.add('step-completed')
       }
       if(dataProp === order.status) {
            stepCompleted = false
            time.innerText = moment(order.updatedAt).format('DD-MM-YYYY hh:mm A')
            status.appendChild(time)
           if(status.nextElementSibling) {
            status.nextElementSibling.classList.add('current')
           }
       }
    })

}

updateStatus(order);

initStripe()

// Socket
let socket = io()

// Join the room for specific order
if (order) {
    socket.emit('join', `order_${order.id}`)
}

let adminAreaPath = window.location.pathname
if (adminAreaPath.includes('admin')) {
    initAdmin(socket)
    socket.emit('join', 'adminRoom')
}

// Listen for order updates from the server
socket.on('orderUpdated', (data) => {
    const updatedOrder = { ...order }
    updatedOrder.updatedAt = moment().format()
    updatedOrder.status = data.status
    updateStatus(updatedOrder)

    // Create a custom notification for order update
    const notification = document.createElement('div')
    notification.classList.add('notification', 'bg-green-500', 'text-white', 'p-4', 'rounded', 'm-4', 'shadow-lg', 'transition-all')

    // Set the notification text
    notification.innerHTML = `
        <strong>Order Updated!</strong><br>
        Status: ${data.status}<br>
        <small>Updated at ${updatedOrder.updatedAt}</small>
               <strong>From ASK Elisir.com</strong><br>
    `

    // Append the notification to the real-time notification container
    document.getElementById('realtime-notifications').appendChild(notification)

    // Optionally, remove the notification after a few seconds
    setTimeout(() => {
        notification.classList.add('opacity-0', 'transition-opacity')
        setTimeout(() => {
            notification.remove()
        }, 500) // Wait for fade-out transition to complete
    }, 5000) // Notification duration (5 seconds)
})