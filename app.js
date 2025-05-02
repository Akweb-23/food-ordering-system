// Mock menu data (usually comes from backend or localStorage)
const menuItems = {
    Pizza: [
        { name: 'Margherita pizza', price: 120, image: 'margherita-pizza.jpg', isUnavailable: false },
        { name: 'Pepperoni pizza', price: 150, image: 'Pepperoni-Pizza.jpg', isUnavailable: false },
        { name: 'Paneer Cheese pizza', price: 150, image: 'paneer-cheese-pizza.jpg', isUnavailable: false },
        { name: 'Corn cheese pizza', price: 120, image: 'corn-cheese-pizza.jpg', isUnavailable: false },
        { name: 'Veg cheese pizza', price: 100, image: 'veg-cheese-pizza.webp', isUnavailable: false }
    ],
    burger: [
        { name: 'veg burger', price: 70, image: 'veg-burger.jpg', isUnavailable: false },
        { name: 'Chicken Burger', price: 100, image: 'burger.jpg', isUnavailable: false },
        { name: 'Cheese burger', price: 90, image: 'cheese-burger.jpg', isUnavailable: false },
        { name: 'Paneer burger', price: 80, image: 'paneer-burger.jpg', isUnavailable: false },
        { name: 'Tandoori cheese burger', price: 100, image: 'tandoori-cheese-burger.jpg', isUnavailable: false }
    ],
    fries: [
        { name: 'Plain fries', price: 70, image: 'plain-fries.jpg', isUnavailable: false },
        { name: 'French fries', price: 90, image: 'french-fries.jpg', isUnavailable: false },
        { name: 'Peri peri fries', price: 100, image: 'peri-peri-fries.jpg', isUnavailable: false },
        { name: 'Masala cheese fries', price: 120, image: 'masala-cheese-fries.jpg', isUnavailable: false }
    ],
    drink: [
        { name: 'Hot Coffee', price: 60, image: 'hot-coffee.jpg', isUnavailable: false },
        { name: 'Chocolate Hot Coffee', price: 80, image: 'chocolate-hot-coffee.jpg', isUnavailable: false },
        { name: 'Hazelnut Hot Coffee', price: 90, image: 'hazelnut-hot-coffee.jpg', isUnavailable: false },
        { name: 'Cappuccino Hot Coffee', price: 100, image: 'cappuccino-hot-coffee.avif', isUnavailable: false },
        { name: 'Cold Coffee', price: 70, image: 'cold-coffee.jpg', isUnavailable: false },
        { name: 'Cold Coffee with Ice Cream', price: 90, image: 'cold-coffee-ice-cream.jpg', isUnavailable: false },
        { name: 'Cold Coffee Crush', price: 100, image: 'cold-coffee-crush.jpg', isUnavailable: false },
        { name: 'Mocha Cold Coffee', price: 110, image: 'mocha-cold.jpg', isUnavailable: false }
    ],
    sandwich: [
        { name: 'Veg Sandwich', price: 80, image: 'veg-sandwich.jpg', isUnavailable: false },
        { name: 'Cheese Sandwich', price: 90, image: 'sandwich.jpg', isUnavailable: false },
        { name: 'Aloo Masala Sandwich', price: 70, image: 'aloo-masala-sandwich.jpg', isUnavailable: false },
        { name: 'Chocolate Sandwich', price: 100, image: 'chocolate-sandwich.jpg', isUnavailable: false }
    ],
    Momos: [
        { name: 'Steam Momos', price: 60, image: 'steam-momos.jpg', isUnavailable: false },
        { name: 'Veg Fried Momos', price: 80, image: 'veg-fried-momos.jpg', isUnavailable: false },
        { name: 'Paneer Momos', price: 90, image: 'paneer-momos.webp', isUnavailable: false },
        { name: 'Chicken Momos', price: 100, image: 'chicken-momos.jpg', isUnavailable: false }
    ]
};

// Initialize Firebase with menu items if not already present
document.addEventListener('DOMContentLoaded', function() {
    // Check if menuItems exists in Firebase
    menuItemsRef.once('value')
        .then((snapshot) => {
            if (!snapshot.exists()) {
                // If menuItems doesn't exist, initialize with default data
                menuItemsRef.set(menuItems)
                    .then(() => {
                        console.log('Menu items initialized in Firebase');
                    })
                    .catch((error) => {
                        console.error('Error initializing menu items:', error);
                    });
            } else {
                console.log('Menu items already exist in Firebase');
            }
        })
        .catch((error) => {
            console.error('Error checking for menu items:', error);
        });
});

// The cart and its related data
let cart = [];
let totalPrice = 0;
let currentOrderId = null;

// Load menu category items into the UI
function loadCategory(category) {
    const itemsList = document.getElementById('items-list');
    itemsList.innerHTML = ''; // Clear previous items
    
    // Get latest menu items from Firebase
    menuItemsRef.child(category).once('value')
        .then((snapshot) => {
            if (snapshot.exists()) {
                snapshot.forEach((itemSnapshot) => {
                    const item = itemSnapshot.val();
                    
                    const itemElement = document.createElement('div');
                    itemElement.classList.add('item');
                    
                    // Add unavailable class if item is marked as unavailable
                    if (item.isUnavailable) {
                        itemElement.classList.add('unavailable');
                    }
                    
                    const quantityId = `quantity-${item.name.replace(/\s+/g, '-')}`;
                    
                    itemElement.innerHTML = `
                        <img src="${item.image}" alt="${item.name}">
                        <h3>${item.name}</h3>
                        <p>RS.${item.price}</p>
                        <div class="quantity-controls">
                            <button onclick="adjustQuantity('${item.name}', 'decrease')" ${item.isUnavailable ? 'disabled' : ''}>-</button>
                            <span id="${quantityId}">0</span>
                            <button onclick="adjustQuantity('${item.name}', 'increase')" ${item.isUnavailable ? 'disabled' : ''}>+</button>
                        </div>
                        ${item.isUnavailable ? '<div class="unavailable-label">Currently Unavailable</div>' : ''}
                    `;
                    itemsList.appendChild(itemElement);
                });
            } else {
                itemsList.innerHTML = '<p>No items found in this category.</p>';
            }
        })
        .catch((error) => {
            console.error('Error loading menu items:', error);
            itemsList.innerHTML = '<p>Error loading menu items. Please try again.</p>';
        });
}

// Adjust quantity logic
function adjustQuantity(name, action) {
    const quantitySpan = document.getElementById(`quantity-${name.replace(/\s+/g, '-')}`);
    let quantity = parseInt(quantitySpan.innerText);

    if (action === 'increase') {
        quantity++;
        addToCart(name, quantity);
    } else if (action === 'decrease' && quantity > 0) {
        quantity--;
        removeFromCart(name, quantity);
    }

    quantitySpan.innerText = quantity;
}

// Add item to cart with food unavailability check
function addToCart(name, quantity) {
    // Check all categories in Firebase for the item
    let foundItem = null;
    let promises = [];
    
    // Get menu items from Firebase
    menuItemsRef.once('value')
        .then((snapshot) => {
            if (snapshot.exists()) {
                // Flatten the menu items to search for the item
                snapshot.forEach((categorySnapshot) => {
                    categorySnapshot.forEach((itemSnapshot) => {
                        const item = itemSnapshot.val();
                        if (item.name === name) {
                            foundItem = item;
                            
                            // Check if the item is unavailable
                            if (item.isUnavailable) {
                                alert(`${item.name} is currently unavailable.`);
                                return;
                            }
                            
                            const existingItem = cart.find(i => i.name === name);
                            
                            if (existingItem) {
                                existingItem.quantity = quantity;
                                existingItem.total = item.price * quantity;
                            } else {
                                cart.push({
                                    name,
                                    price: item.price,
                                    quantity,
                                    total: item.price * quantity
                                });
                            }
                            
                            updateCart();
                        }
                    });
                });
                
                if (!foundItem) {
                    console.error('Item not found:', name);
                }
            }
        })
        .catch((error) => {
            console.error('Error retrieving menu items:', error);
        });
}

// Remove item from cart or update quantity
function removeFromCart(name, quantity = 0) {
    const index = cart.findIndex(i => i.name === name);

    if (index !== -1) {
        if (quantity === 0) {
            cart.splice(index, 1);
        } else {
            cart[index].quantity = quantity;
            cart[index].total = cart[index].price * quantity;
        }
    }

    updateCart();
}

// Update cart view and price
function updateCart() {
    const cartItems = document.getElementById('cart-table');
    const totalPriceElement = document.getElementById('cart-icon-price');
    
    // Create header row
    let tableHTML = `
        <tr>
            <th>Item Name</th>
            <th>Quantity</th>
            <th>Price</th>
            <th>Action</th>
        </tr>
    `;
    
    // Add item rows
    cart.forEach(item => {
        tableHTML += `
            <tr>
                <td>${item.name}</td>
                <td>${item.quantity}</td>
                <td>RS.${item.total}</td>
                <td><button onclick="removeFromCart('${item.name}', 0)">Remove</button></td>
            </tr>
        `;
    });
    
    cartItems.innerHTML = tableHTML;

    totalPrice = cart.reduce((sum, item) => sum + item.total, 0);
    totalPriceElement.innerText = `RS. ${totalPrice.toFixed(2)}`;
    
    // Update or hide confirm order button based on cart status
    const confirmOrderBtn = document.getElementById('confirm-order');
    if (confirmOrderBtn) {
        confirmOrderBtn.style.display = cart.length > 0 ? 'inline-block' : 'none';
    }
}

// Function to open the cart modal
function openCart() {
    const cartModal = document.getElementById('cart-modal');
    cartModal.style.display = 'block';
    updateCart();
}

// Function to close the cart modal
function closeCart() {
    const cartModal = document.getElementById('cart-modal');
    cartModal.style.display = 'none';
}

// Function to show the order form
function showOrderForm() {
    if (cart.length === 0) {
        alert('Your cart is empty. Please add items to place an order.');
        return;
    }
    
    const orderFormModal = document.getElementById('order-form-modal');
    orderFormModal.style.display = 'block';
}

// Function to calculate order preparation time based on items and quantities
function calculatePreparationTime(items) {
    // Base preparation time
    let baseTime = 10;
    
    // Additional time based on number of items and their quantities
    const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
    const itemTypeCount = items.length;
    
    // Add 2 minutes per item type and 1 minute per additional quantity
    const additionalTime = (itemTypeCount * 2) + (totalQuantity - itemTypeCount);
    
    // Return estimated preparation time (capped at reasonable maximum)
    return Math.min(baseTime + additionalTime, 40);
}

// Function to generate an order ID
function generateOrderId() {
    return Math.floor(100000 + Math.random() * 900000);
}

// Function to submit the order
function submitOrder() {
    const name = document.getElementById('name').value;
    const mobile = document.getElementById('mobile').value;
    const table = document.getElementById('table').value;
    
    // Validate inputs
    if (!name || !mobile || !table) {
        alert('Please fill in all fields');
        return;
    }
    
    if (cart.length === 0) {
        alert('Your cart is empty. Please add items to place an order.');
        return;
    }
    
    // Calculate totals
    const baseTotal = cart.reduce((sum, item) => sum + item.total, 0);
    const gst = baseTotal * 0.05; // 5% GST
    const total = baseTotal + gst;
    
    // Calculate preparation time
    const estimatedPreparationTime = calculatePreparationTime(cart);
    
    // Check if we're editing an existing order
    const editingOrderId = sessionStorage.getItem('editingOrderId');
    
    if (editingOrderId && editingOrderId !== 'null') {
        // We're updating an existing order
        const orderRef = ordersRef.child(editingOrderId);
        
        orderRef.once('value')
            .then((snapshot) => {
                if (snapshot.exists()) {
                    // Update the order
                    return orderRef.update({
                        name: name,
                        mobile: mobile,
                        table: table,
                        items: cart,
                        baseTotal: baseTotal,
                        gst: gst,
                        total: total,
                        estimatedPreparationTime: estimatedPreparationTime,
                        lastUpdated: new Date().toLocaleString()
                    });
                } else {
                    throw new Error('Order not found');
                }
            })
            .then(() => {
                // Clear the editing flag
                sessionStorage.removeItem('editingOrderId');
                
                // Clear the cart and close modals
                cart = [];
                updateCart();
                closeOrderForm();
                closeCart();
                
                // Show confirmation and redirect to tracking
                alert('Your order has been updated successfully!');
                redirectToTrackOrder();
            })
            .catch((error) => {
                console.error('Error updating order:', error);
                alert('Error updating your order. Please try again.');
            });
    } else {
        // Create a new order
        const orderId = generateOrderId().toString();
        const order = {
            orderId: orderId,
            name,
            mobile,
            table,
            items: cart,
            baseTotal,
            gst,
            total,
            estimatedPreparationTime,
            orderConfirmationDate: new Date().toLocaleString(),
            status: 'pending' // Initial status
        };
        
        // Save the order to Firebase
        ordersRef.child(orderId).set(order)
            .then(() => {
                // Save the current order ID for tracking
                currentOrderId = orderId;
                sessionStorage.setItem('currentOrderId', currentOrderId);
                
                // Clear the cart and close modals
                cart = [];
                updateCart();
                closeOrderForm();
                closeCart();
                
                // Show order confirmation and redirect to tracking
                showOrderConfirmation(order);
            })
            .catch((error) => {
                console.error('Error saving order:', error);
                alert('Error placing your order. Please try again.');
            });
    }
}

// Function to close the order form
function closeOrderForm() {
    const orderFormModal = document.getElementById('order-form-modal');
    orderFormModal.style.display = 'none';
}

// Function to show order confirmation
function showOrderConfirmation(order) {
    // Create a confirmation modal
    const confirmationDiv = document.createElement('div');
    confirmationDiv.classList.add('confirmation-modal');
    
    confirmationDiv.innerHTML = `
        <div class="confirmation-content">
            <h2>Order Confirmed!</h2>
            <p>Your order #${order.orderId} has been successfully placed.</p>
            <p>Estimated preparation time: ${order.estimatedPreparationTime} minutes</p>
            <button onclick="redirectToTrackOrder()">Track Your Order</button>
            <button onclick="closeConfirmation()">Continue Shopping</button>
        </div>
    `;
    
    document.body.appendChild(confirmationDiv);
}

// Function to close the confirmation
function closeConfirmation() {
    const confirmationModal = document.querySelector('.confirmation-modal');
    if (confirmationModal) {
        confirmationModal.remove();
    }
}

// Function to redirect to the order tracking page
function redirectToTrackOrder() {
    window.location.href = 'track-order.html';
}

// Function to cancel individual items from the order
function cancelItem(orderId, itemIndex) {
    const orderRef = ordersRef.child(orderId);
    
    orderRef.once('value')
        .then((snapshot) => {
            if (!snapshot.exists()) {
                alert("Order not found.");
                return;
            }
            
            const currentOrder = snapshot.val();
            const itemToCancel = currentOrder.items[itemIndex];
            
            if (!itemToCancel) {
                alert("Item not found.");
                return;
            }
            
            const orderTime = new Date(currentOrder.orderConfirmationDate);
            const currentTime = new Date();
            const timeDifference = (currentTime - orderTime) / (1000 * 60);
            
            if (timeDifference <= 5) {
                const confirmation = confirm(`Are you sure you want to cancel ${itemToCancel.name}?`);
                if (confirmation) {
                    // Update order totals
                    currentOrder.baseTotal -= itemToCancel.total;
                    currentOrder.gst = currentOrder.baseTotal * 0.05;
                    currentOrder.total = currentOrder.baseTotal + currentOrder.gst;
                    
                    // Remove the item
                    currentOrder.items.splice(itemIndex, 1);
                    
                    // If no items left, cancel the entire order
                    if (currentOrder.items.length === 0) {
                        // Move to cancelled orders
                        currentOrder.cancellationTime = new Date().toLocaleString();
                        currentOrder.cancellationReason = "All items cancelled by customer";
                        cancelledOrdersRef.child(orderId).set(currentOrder)
                            .then(() => {
                                // Remove from active orders
                                return orderRef.remove();
                            })
                            .then(() => {
                                alert('Order cancelled as all items were removed.');
                                sessionStorage.removeItem('currentOrderId');
                                window.location.href = 'index.html';
                            })
                            .catch((error) => {
                                console.error('Error cancelling order:', error);
                                alert('Error cancelling order. Please try again.');
                            });
                    } else {
                        // Recalculate preparation time
                        currentOrder.estimatedPreparationTime = calculatePreparationTime(currentOrder.items);
                        
                        // Update order in Firebase
                        orderRef.update({
                            items: currentOrder.items,
                            baseTotal: currentOrder.baseTotal,
                            gst: currentOrder.gst,
                            total: currentOrder.total,
                            estimatedPreparationTime: currentOrder.estimatedPreparationTime,
                            lastUpdated: new Date().toLocaleString()
                        })
                        .then(() => {
                            alert(`${itemToCancel.name} has been cancelled.`);
                            
                            // Reload the page to reflect changes
                            if (window.location.href.includes('track-order.html')) {
                                loadTrackingInfo();
                            }
                        })
                        .catch((error) => {
                            console.error('Error updating order:', error);
                            alert('Error cancelling item. Please try again.');
                        });
                    }
                }
            } else {
                alert('Item cancellation is only allowed within 5 minutes of order placement.');
            }
        })
        .catch((error) => {
            console.error('Error accessing order:', error);
            alert('Error accessing order. Please try again.');
        });
}

// Function to edit an order (add or remove items)
function editOrder(orderId) {
    const orderRef = ordersRef.child(orderId);
    
    orderRef.once('value')
        .then((snapshot) => {
            if (!snapshot.exists()) {
                alert("Order not found.");
                return;
            }
            
            const currentOrder = snapshot.val();
            const orderTime = new Date(currentOrder.orderConfirmationDate);
            const currentTime = new Date();
            const timeDifference = (currentTime - orderTime) / (1000 * 60);
            
            if (timeDifference <= 5) {
                // Load the current order items back into the cart
                cart = JSON.parse(JSON.stringify(currentOrder.items)); // Deep clone
                updateCart();
                
                // Open the cart for editing
                openCart();
                
                // Set a flag that we're editing an existing order
                sessionStorage.setItem('editingOrderId', orderId);
                
                // Add a note to the cart modal that we're editing
                const cartModalContent = document.querySelector('.cart-modal-content');
                if (cartModalContent) {
                    const editingNote = document.createElement('div');
                    editingNote.classList.add('editing-note');
                    editingNote.innerHTML = `<p>You are editing order #${orderId}</p>`;
                    cartModalContent.prepend(editingNote);
                    
                    // Change the confirm button text
                    const confirmButton = document.getElementById('confirm-order');
                    if (confirmButton) {
                        confirmButton.innerText = 'Update Order';
                    }
                }
            } else {
                alert('Order editing is only allowed within 5 minutes of order placement.');
            }
        })
        .catch((error) => {
            console.error('Error accessing order:', error);
            alert('Error accessing order. Please try again.');
        });
}

// Load active orders for the customer
function loadActiveOrders() {
    const ordersList = document.getElementById('orders-list');
    if (!ordersList) return; // No orders list on this page
    
    // Get active orders from Firebase
    ordersRef.once('value')
        .then((snapshot) => {
            ordersList.innerHTML = '';
            
            if (!snapshot.exists()) {
                ordersList.innerHTML = '<p>No active orders.</p>';
                return;
            }
            
            snapshot.forEach((orderSnapshot) => {
                const order = orderSnapshot.val();
                
                const orderElement = document.createElement('div');
                orderElement.classList.add('order');
                orderElement.innerHTML = `
                    <h3>Order #${order.orderId}</h3>
                    <p><strong>Name:</strong> ${order.name}</p>
                    <p><strong>Mobile:</strong> ${order.mobile}</p>
                    <p><strong>Table no.:</strong> ${order.table}</p>
                    <h4>Items:</h4>
                    <ul>
                        ${order.items.map((item, itemIndex) => `
                            <li>
                                ${item.name} - RS.${item.price} × ${item.quantity}
                                <button onclick="cancelItem('${order.orderId}', ${itemIndex})">Cancel Item</button>
                            </li>
                        `).join('')}
                    </ul>
                    <p><strong>Subtotal:</strong> RS.${parseFloat(order.baseTotal).toFixed(2)}</p>
                    <p><strong>GST (5%):</strong> RS.${parseFloat(order.gst).toFixed(2)}</p>
                    <p><strong>Total:</strong> RS.${parseFloat(order.total).toFixed(2)}</p>
                    <p><strong>Order Confirmation Time:</strong> ${order.orderConfirmationDate}</p>
                    <p><strong>Estimated Preparation Time:</strong> ${order.estimatedPreparationTime} minutes</p>
                    <button onclick="editOrder('${order.orderId}')">Edit Order</button>
                `;
                ordersList.appendChild(orderElement);
            });
        })
        .catch((error) => {
            console.error('Error loading active orders:', error);
            ordersList.innerHTML = '<p>Error loading orders. Please try again.</p>';
        });
}

// Initialize page based on what page we're on
window.onload = function() {
    // Check what page we're on based on URL
    const currentUrl = window.location.href;
    
    if (currentUrl.includes('track-order.html')) {
        // Load tracking info if on tracking page
        loadTrackingInfo();
    } else if (currentUrl.includes('manager.html')) {
        // Nothing to do here as manager.js handles this
    } else {
        // Default page - load a category and any active orders
        loadCategory('Pizza'); // Default to showing pizza
        loadActiveOrders();
    }
};

// Function to load tracking info
function loadTrackingInfo() {
    const trackingContainer = document.getElementById('tracking-container');
    if (!trackingContainer) return;
    
    const currentOrderId = sessionStorage.getItem('currentOrderId');
    if (!currentOrderId || currentOrderId === 'null') {
        trackingContainer.innerHTML = '<p>No active order to track. Please place an order first.</p>';
        return;
    }
    
    // Get the order from Firebase
    ordersRef.child(currentOrderId).once('value')
        .then((snapshot) => {
            if (!snapshot.exists()) {
                // Try completed orders
                completedOrdersRef.child(currentOrderId).once('value')
                    .then((completedSnapshot) => {
                        if (completedSnapshot.exists()) {
                            const order = completedSnapshot.val();
                            trackingContainer.innerHTML = `
                                <div class="tracking-info">
                                    <h2>Order #${order.orderId} Completed</h2>
                                    <div class="status-container">
                                        <span class="status status-ready">Status: Completed</span>
                                    </div>
                                    
                                    <div class="progress-container">
                                        <div class="progress-bar" style="width: 100%"></div>
                                    </div>
                                    
                                    <div class="order-details">
                                        <h3>Order Details</h3>
                                        <p><strong>Name:</strong> ${order.name}</p>
                                        <p><strong>Table no.:</strong> ${order.table}</p>
                                        <p><strong>Order Time:</strong> ${order.orderConfirmationDate}</p>
                                        <p><strong>Completion Time:</strong> ${order.completionTime || 'N/A'}</p>
                                        
                                        <h4>Items:</h4>
                                        <ul>
                                            ${order.items.map((item) => `
                                                <li>${item.name} - RS.${item.price} × ${item.quantity} = RS.${item.total}</li>
                                            `).join('')}
                                        </ul>
                                        
                                        <p><strong>Subtotal:</strong> RS.${parseFloat(order.baseTotal).toFixed(2)}</p>
                                        <p><strong>GST (5%):</strong> RS.${parseFloat(order.gst).toFixed(2)}</p>
                                        <p><strong>Total:</strong> RS.${parseFloat(order.total).toFixed(2)}</p>
                                        
                                        <button onclick="window.location.href='index.html'">Back to Menu</button>
                                    </div>
                                </div>
                            `;
                        } else {
                            // Try cancelled orders
                            cancelledOrdersRef.child(currentOrderId).once('value')
                                .then((cancelledSnapshot) => {
                                    if (cancelledSnapshot.exists()) {
                                        const order = cancelledSnapshot.val();
                                        trackingContainer.innerHTML = `
                                            <div class="tracking-info">
                                                <h2>Order #${order.orderId} Cancelled</h2>
                                                <div class="status-container">
                                                    <span class="status" style="background-color: #e74c3c;">Status: Cancelled</span>
                                                </div>
                                                
                                                <div class="order-details">
                                                    <h3>Order Details</h3>
                                                    <p><strong>Name:</strong> ${order.name}</p>
                                                    <p><strong>Table no.:</strong> ${order.table}</p>
                                                    <p><strong>Order Time:</strong> ${order.orderConfirmationDate}</p>
                                                    <p><strong>Cancellation Time:</strong> ${order.cancellationTime || 'N/A'}</p>
                                                    <p><strong>Cancellation Reason:</strong> ${order.cancellationReason || 'N/A'}</p>
                                                    
                                                    <button onclick="window.location.href='index.html'">Back to Menu</button>
                                                </div>
                                            </div>
                                        `;
                                    } else {
                                        trackingContainer.innerHTML = '<p>Order not found. It may have been cancelled.</p>';
                                    }
                                })
                                .catch((error) => {
                                    console.error('Error accessing cancelled orders:', error);
                                    trackingContainer.innerHTML = '<p>Error tracking order. Please try again.</p>';
                                });
                        }
                    })
                    .catch((error) => {
                        console.error('Error accessing completed orders:', error);
                        trackingContainer.innerHTML = '<p>Error tracking order. Please try again.</p>';
                    });
                return;
            }
            
            const order = snapshot.val();
            
            // Calculate time passed since order was placed
            const orderTime = new Date(order.orderConfirmationDate);
            const currentTime = new Date();
            const minutesPassed = Math.floor((currentTime - orderTime) / (1000 * 60));
            const remainingTime = Math.max(0, order.estimatedPreparationTime - minutesPassed);
            
            // Determine order status
            let status = 'Preparing';
            let statusClass = 'status-preparing';
            
            if (order.status === 'in-progress') {
                status = 'In Progress';
                statusClass = 'status-almost';
            } else if (minutesPassed >= order.estimatedPreparationTime) {
                status = 'Ready for pickup';
                statusClass = 'status-ready';
            } else if (minutesPassed >= (order.estimatedPreparationTime * 0.7)) {
                status = 'Almost ready';
                statusClass = 'status-almost';
            }
            
            // Calculate progress percentage
            const progressPercentage = Math.min(100, (minutesPassed / order.estimatedPreparationTime) * 100);
            
            trackingContainer.innerHTML = `
                <div class="tracking-info">
                    <h2>Tracking Order #${order.orderId}</h2>
                    <div class="status-container">
                        <span class="status ${statusClass}">Status: ${status}</span>
                    </div>
                    
                    <div class="progress-container">
                        <div class="progress-bar" style="width: ${progressPercentage}%"></div>
                    </div>
                    
                    <div class="time-info">
                        <p>Estimated preparation time: ${order.estimatedPreparationTime} minutes</p>
                        <p>Time remaining: ${remainingTime} minutes</p>
                    </div>
                    
                    <div class="order-details">
                        <h3>Order Details</h3>
                        <p><strong>Name:</strong> ${order.name}</p>
                        <p><strong>Table no.:</strong> ${order.table}</p>
                        <p><strong>Order Time:</strong> ${order.orderConfirmationDate}</p>
                        
                        <h4>Items:</h4>
                        <ul>
                            ${order.items.map((item, itemIndex) => `
                                <li>
                                    ${item.name} - RS.${item.price} × ${item.quantity} = RS.${item.total}
                                    ${minutesPassed <= 5 ? `<button onclick="cancelItem('${order.orderId}', ${itemIndex})">Cancel Item</button>` : ''}
                                </li>
                            `).join('')}
                        </ul>
                        
                        <p><strong>Subtotal:</strong> RS.${parseFloat(order.baseTotal).toFixed(2)}</p>
                        <p><strong>GST (5%):</strong> RS.${parseFloat(order.gst).toFixed(2)}</p>
                        <p><strong>Total:</strong> RS.${parseFloat(order.total).toFixed(2)}</p>
                        
                        ${minutesPassed <= 5 ? `<button onclick="editOrder('${order.orderId}')">Edit Order</button>` : ''}
                        <button onclick="window.location.href='index.html'">Back to Menu</button>
                    </div>
                </div>
            `;
            
            // Auto-refresh tracking info every 30 seconds
            setTimeout(loadTrackingInfo, 30000);
        })
        .catch((error) => {
            console.error('Error accessing order:', error);
            trackingContainer.innerHTML = '<p>Error tracking order. Please try again.</p>';
        });
}
