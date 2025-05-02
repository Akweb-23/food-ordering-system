// Initialize Firebase references
const dbRef = firebase.database().ref();
const ordersRef = dbRef.child('orders');
const completedOrdersRef = dbRef.child('completedOrders');
const cancelledOrdersRef = dbRef.child('cancelledOrders');
const menuItemsRef = dbRef.child('menuItems');

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    // Show active orders by default
    toggleOrdersView('active');
    
    // Load orders from Firebase
    loadActiveOrders();
    loadCompletedOrders();
    
    // Set up real-time listeners for orders
    ordersRef.on('value', () => {
        loadActiveOrders();
    });
    
    completedOrdersRef.on('value', () => {
        loadCompletedOrders();
    });
    
    // Add listener for view toggle buttons
    document.getElementById('view-active').addEventListener('click', () => toggleOrdersView('active'));
    document.getElementById('view-completed').addEventListener('click', () => toggleOrdersView('completed'));
    
    // Add listener for clear completed orders button
    document.getElementById('clear-completed').addEventListener('click', clearCompletedOrders);
});

// Function to toggle between active and completed orders views
function toggleOrdersView(view) {
    const activeSection = document.getElementById('active-orders-section');
    const completedSection = document.getElementById('completed-orders-section');
    const activeButton = document.getElementById('view-active');
    const completedButton = document.getElementById('view-completed');
    
    if (view === 'active') {
        activeSection.style.display = 'block';
        completedSection.style.display = 'none';
        activeButton.classList.add('active');
        completedButton.classList.remove('active');
    } else {
        activeSection.style.display = 'none';
        completedSection.style.display = 'block';
        activeButton.classList.remove('active');
        completedButton.classList.add('active');
    }
}

// Function to add a new menu item
function addMenuItem() {
    const name = document.getElementById('new-item-name').value.trim();
    const category = document.getElementById('new-item-category').value.trim();
    const price = parseFloat(document.getElementById('new-item-price').value);
    const imageUrl = document.getElementById('new-item-image').value.trim();
    
    if (!name || !category || isNaN(price) || price <= 0) {
        alert('Please enter valid item details.');
        return;
    }
    
    // Create a new menu item object
    const newItem = {
        name,
        category,
        price,
        imageUrl: imageUrl || 'default-food-image.jpg',
        available: true
    };
    
    // Add to Firebase
    menuItemsRef.orderByChild('name').equalTo(name).once('value')
        .then((snapshot) => {
            if (snapshot.exists()) {
                alert('An item with this name already exists. Please use a different name.');
                return;
            }
            
            // Add new item to Firebase
            menuItemsRef.push(newItem)
                .then(() => {
                    alert('Menu item added successfully!');
                    // Clear form
                    document.getElementById('new-item-name').value = '';
                    document.getElementById('new-item-category').value = '';
                    document.getElementById('new-item-price').value = '';
                    document.getElementById('new-item-image').value = '';
                })
                .catch((error) => {
                    console.error('Error adding menu item:', error);
                    alert('Error adding menu item. Please try again.');
                });
        })
        .catch((error) => {
            console.error('Error checking existing items:', error);
            alert('Error checking existing items. Please try again.');
        });
}

// Function to toggle item availability
function toggleItemAvailability(itemKey, currentStatus) {
    // Update availability in Firebase
    menuItemsRef.child(itemKey).update({
        available: !currentStatus
    })
    .then(() => {
        loadMenuItems(); // Refresh the menu items list
    })
    .catch((error) => {
        console.error('Error updating item availability:', error);
        alert('Error updating item availability. Please try again.');
    });
}

// Function to load menu items
function loadMenuItems() {
    const menuItemsList = document.getElementById('menu-items-list');
    
    // Clear previous list
    menuItemsList.innerHTML = '';
    
    // Get menu items from Firebase
    menuItemsRef.once('value')
        .then((snapshot) => {
            if (!snapshot.exists()) {
                menuItemsList.innerHTML = '<p>No menu items found.</p>';
                return;
            }
            
            snapshot.forEach((childSnapshot) => {
                const itemKey = childSnapshot.key;
                const item = childSnapshot.val();
                
                const itemElement = document.createElement('div');
                itemElement.classList.add('menu-item');
                if (!item.available) {
                    itemElement.classList.add('unavailable');
                }
                
                itemElement.innerHTML = 
                    `<div class="menu-item-details">
                        <h3>${item.name}</h3>
                        <p><strong>Category:</strong> ${item.category}</p>
                        <p><strong>Price:</strong> RS.${parseFloat(item.price).toFixed(2)}</p>
                        <p><strong>Status:</strong> ${item.available ? 'Available' : 'Unavailable'}</p>
                    </div>
                    <div class="menu-item-actions">
                        <button onclick="toggleItemAvailability('${itemKey}', ${item.available})">
                            ${item.available ? 'Mark Unavailable' : 'Mark Available'}
                        </button>
                        <button class="delete-btn" onclick="deleteMenuItem('${itemKey}')">Delete</button>
                    </div>`;
                menuItemsList.appendChild(itemElement);
            });
        })
        .catch((error) => {
            console.error('Error loading menu items:', error);
            menuItemsList.innerHTML = '<p>Error loading menu items. Please try again.</p>';
        });
}

// Function to delete a menu item
function deleteMenuItem(itemKey) {
    if (confirm('Are you sure you want to delete this menu item? This cannot be undone.')) {
        // Delete from Firebase
        menuItemsRef.child(itemKey).remove()
            .then(() => {
                alert('Menu item deleted successfully.');
                loadMenuItems(); // Refresh the menu items list
            })
            .catch((error) => {
                console.error('Error deleting menu item:', error);
                alert('Error deleting menu item. Please try again.');
            });
    }
}

// Add event listener for the menu management tab
document.getElementById('manage-menu-tab').addEventListener('click', function() {
    document.getElementById('orders-management').style.display = 'none';
    document.getElementById('menu-management').style.display = 'block';
    document.getElementById('manage-orders-tab').classList.remove('active');
    document.getElementById('manage-menu-tab').classList.add('active');
    loadMenuItems();
});

// Add event listener for the orders management tab
document.getElementById('manage-orders-tab').addEventListener('click', function() {
    document.getElementById('menu-management').style.display = 'none';
    document.getElementById('orders-management').style.display = 'block';
    document.getElementById('manage-menu-tab').classList.add('active');
    document.getElementById('manage-orders-tab').classList.remove('active');
    loadActiveOrders();
    loadCompletedOrders();
});

// Add event listener for the add menu item form
document.getElementById('add-menu-item-form').addEventListener('submit', function(e) {
    e.preventDefault();
    addMenuItem();
});

// Function to cancel an active order within 5 minutes
function cancelOrder(orderId) {
    const orderRef = ordersRef.child(orderId);
    
    orderRef.once('value')
        .then((snapshot) => {
            if (!snapshot.exists()) {
                alert("Order not found.");
                return;
            }
            
            const order = snapshot.val();
            const orderTime = new Date(order.orderConfirmationDate).getTime();
            const currentTime = new Date().getTime();
            const timeDifference = (currentTime - orderTime) / (1000 * 60); // Time difference in minutes

            if (timeDifference > 5) {
                alert('You can only cancel orders within 5 minutes of placing them.');
            } else {
                const confirmation = confirm(`Are you sure you want to cancel order #${order.orderId}?`);
                if (confirmation) {
                    // Add cancellation info
                    order.cancellationTime = new Date().toLocaleString();
                    order.cancellationReason = "Cancelled by manager";
                    
                    // Save to cancelled orders in Firebase
                    cancelledOrdersRef.child(orderId).set(order)
                        .then(() => {
                            // Remove from active orders
                            return orderRef.remove();
                        })
                        .then(() => {
                            alert('Order has been canceled successfully!');
                            loadActiveOrders(); // Reload active orders after cancellation
                        })
                        .catch((error) => {
                            console.error('Error cancelling order:', error);
                            alert('Error cancelling order. Please try again.');
                        });
                }
            }
        })
        .catch((error) => {
            console.error('Error accessing order:', error);
            alert('Error accessing order. Please try again.');
        });
}

// Function to mark an order as in-progress
function markOrderAsInProgress(orderId) {
    const orderRef = ordersRef.child(orderId);
    
    orderRef.once('value')
        .then((snapshot) => {
            if (!snapshot.exists()) {
                alert("Order not found.");
                return;
            }
            
            // Update the order status
            orderRef.update({
                status: 'in-progress',
                startedPreparationTime: new Date().toLocaleString()
            })
            .then(() => {
                loadActiveOrders();
            })
            .catch((error) => {
                console.error('Error updating order status:', error);
                alert('Error updating order status. Please try again.');
            });
        })
        .catch((error) => {
            console.error('Error accessing order:', error);
            alert('Error accessing order. Please try again.');
        });
}

// Function to mark an order as done
function markOrderAsDone(orderId) {
    const orderRef = ordersRef.child(orderId);
    
    orderRef.once('value')
        .then((snapshot) => {
            if (!snapshot.exists()) {
                alert("Order not found.");
                return;
            }
            
            const order = snapshot.val();
            // Add completion info
            order.completionTime = new Date().toLocaleString();
            order.status = 'completed';
            
            // Move to completed orders in Firebase
            completedOrdersRef.child(orderId).set(order)
                .then(() => {
                    // Remove from active orders
                    return orderRef.remove();
                })
                .then(() => {
                    // Reload both active and completed orders
                    loadActiveOrders();
                    loadCompletedOrders();
                })
                .catch((error) => {
                    console.error('Error completing order:', error);
                    alert('Error completing order. Please try again.');
                });
        })
        .catch((error) => {
            console.error('Error accessing order:', error);
            alert('Error accessing order. Please try again.');
        });
}

// Function to update preparation time
function updatePreparationTime(orderId) {
    const orderRef = ordersRef.child(orderId);
    
    orderRef.once('value')
        .then((snapshot) => {
            if (!snapshot.exists()) {
                alert("Order not found.");
                return;
            }
            
            const order = snapshot.val();
            const newTime = prompt('Enter new preparation time (in minutes):', order.estimatedPreparationTime);
            
            if (newTime !== null && !isNaN(newTime) && parseInt(newTime) > 0) {
                // Update preparation time in Firebase
                orderRef.update({
                    estimatedPreparationTime: parseInt(newTime),
                    lastUpdated: new Date().toLocaleString()
                })
                .then(() => {
                    alert(`Preparation time updated to ${newTime} minutes.`);
                    loadActiveOrders();
                })
                .catch((error) => {
                    console.error('Error updating preparation time:', error);
                    alert('Error updating preparation time. Please try again.');
                });
            }
        })
        .catch((error) => {
            console.error('Error accessing order:', error);
            alert('Error accessing order. Please try again.');
        });
}

// Function to load active orders
function loadActiveOrders() {
    const ordersList = document.getElementById('orders-list');
    const orders = JSON.parse(localStorage.getItem('orders')) || [];
    ordersList.innerHTML = ''; // Clear previous list

    if (orders.length === 0) {
        ordersList.innerHTML = '<p>No active orders.</p>';
    } else {
        // Sort orders by status (pending first) and then by time
        const sortedOrders = [...orders].sort((a, b) => {
            // First sort by status: pending comes before in-progress
            if ((a.status === 'pending' && b.status !== 'pending') || 
                (a.status === 'in-progress' && b.status === 'completed')) {
                return -1;
            }
            if ((a.status !== 'pending' && b.status === 'pending') || 
                (a.status === 'completed' && b.status === 'in-progress')) {
                return 1;
            }
            // Then sort by time (oldest first)
            return new Date(a.orderConfirmationDate) - new Date(b.orderConfirmationDate);
        });
        
        sortedOrders.forEach((order) => {
            const orderElement = document.createElement('div');
            orderElement.classList.add('order');
            
            // Add status-specific class
            if (order.status === 'in-progress') {
                orderElement.classList.add('order-in-progress');
            } else {
                orderElement.classList.add('order-pending');
            }
            
            // Calculate time elapsed since order placement
            const orderTime = new Date(order.orderConfirmationDate);
            const currentTime = new Date();
            const minutesElapsed = Math.floor((currentTime - orderTime) / (1000 * 60));
            
            orderElement.innerHTML = 
                `<div class="order-header">
                    <h3>Order #${order.orderId}</h3>
                    <span class="order-status">${order.status || 'pending'}</span>
                </div>
                <p><strong>Name:</strong> ${order.name}</p>
                <p><strong>Mobile:</strong> ${order.mobile}</p>
                <p><strong>Table no.:</strong> ${order.table}</p>
                <h4>Items:</h4>
                <ul>
                    ${order.items.map(item => `<li>${item.name} - RS.${item.price} × ${item.quantity} = RS.${item.total}</li>`).join('')}
                </ul>
                <p><strong>Estimated Preparation Time:</strong> ${order.estimatedPreparationTime} minutes</p>
                <p><strong>Time Elapsed:</strong> ${minutesElapsed} minutes</p>
                <p><strong>Subtotal:</strong> RS.${parseFloat(order.baseTotal).toFixed(2)}</p>
                <p><strong>GST (5%):</strong> RS.${parseFloat(order.gst).toFixed(2)}</p>
                <p><strong>Total:</strong> RS.${parseFloat(order.total).toFixed(2)}</p>
                <p><strong>Order Time:</strong> ${order.orderConfirmationDate}</p>
                <div class="order-actions">
                    ${order.status !== 'in-progress' ? 
                        `<button onclick="markOrderAsInProgress(${order.orderId})">Start Preparation</button>` : 
                        `<button onclick="markOrderAsDone(${order.orderId})">Mark as Done</button>`
                    }
                    <button onclick="updatePreparationTime(${order.orderId})">Update Prep Time</button>
                    ${minutesElapsed <= 5 ? 
                        `<button class="cancel-btn" onclick="cancelOrder(${order.orderId})">Cancel Order</button>` : 
                        ''
                    }
                </div>`;
            ordersList.appendChild(orderElement);
        });
    }
}

// Function to load completed orders
function loadCompletedOrders() {
    const completedOrdersList = document.getElementById('completed-orders-list');
    const completedOrders = JSON.parse(localStorage.getItem('completedOrders')) || [];

    completedOrdersList.innerHTML = ''; // Clear previous list

    if (completedOrders.length === 0) {
        completedOrdersList.innerHTML = '<p>No completed orders.</p>';
    } else {
        // Sort completed orders by completion time (newest first)
        const sortedCompletedOrders = [...completedOrders].sort((a, b) => 
            new Date(b.completionTime || b.orderConfirmationDate) - 
            new Date(a.completionTime || a.orderConfirmationDate)
        );
        
        sortedCompletedOrders.forEach((order, index) => {
            const orderElement = document.createElement('div');
            orderElement.classList.add('completed-order');
            
            // Calculate preparation duration
            let preparationDuration = "N/A";
            if (order.completionTime && order.orderConfirmationDate) {
                const startTime = new Date(order.orderConfirmationDate);
                const endTime = new Date(order.completionTime);
                const durationMinutes = Math.floor((endTime - startTime) / (1000 * 60));
                preparationDuration = `${durationMinutes} minutes`;
            }
            
            orderElement.innerHTML = 
                `<h3>Completed Order #${order.orderId}</h3>
                <p><strong>Name:</strong> ${order.name}</p>
                <p><strong>Mobile:</strong> ${order.mobile}</p>
                <p><strong>Table no.:</strong> ${order.table}</p>
                <h4>Items:</h4>
                <ul>
                    ${order.items.map(item => `<li>${item.name} - RS.${item.price} × ${item.quantity} = RS.${item.total}</li>`).join('')}
                </ul>
                <p><strong>Subtotal:</strong> RS.${parseFloat(order.baseTotal).toFixed(2)}</p>
                <p><strong>GST (5%):</strong> RS.${parseFloat(order.gst).toFixed(2)}</p>
                <p><strong>Total:</strong> RS.${parseFloat(order.total).toFixed(2)}</p>
                <p><strong>Order Time:</strong> ${order.orderConfirmationDate}</p>
                <p><strong>Completion Time:</strong> ${order.completionTime || 'N/A'}</p>
                <p><strong>Preparation Duration:</strong> ${preparationDuration}</p>`;
            completedOrdersList.appendChild(orderElement);
        });
    }
}

// Function to clear completed orders
function clearCompletedOrders() {
    if (confirm('Are you sure you want to clear all completed orders? This cannot be undone.')) {
        // Remove all completed orders from Firebase
        completedOrdersRef.remove()
            .then(() => {
                alert('Completed orders cleared successfully.');
                loadCompletedOrders();
            })
            .catch((error) => {
                console.error('Error clearing completed orders:', error);
                alert('Error clearing completed orders. Please try again.');
            });
    }
}

// Function to show order history for a specific date
function showOrderHistoryForDate(date) {
    const historyContainer = document.getElementById('order-history-by-date');
    
    // Get data from Firebase
    Promise.all([
        completedOrdersRef.once('value'),
        cancelledOrdersRef.once('value')
    ])
    .then(([completedSnapshot, cancelledSnapshot]) => {
        // Convert to arrays
        const completedOrders = [];
        completedSnapshot.forEach(childSnapshot => {
            completedOrders.push(childSnapshot.val());
        });
        
        const cancelledOrders = [];
        cancelledSnapshot.forEach(childSnapshot => {
            cancelledOrders.push(childSnapshot.val());
        });
        
        // Combine and sort all historical orders by date (newest first)
        const allHistoricalOrders = [...completedOrders, ...cancelledOrders].sort((a, b) => {
            const dateA = new Date(a.completionTime || a.cancellationTime || a.orderConfirmationDate);
            const dateB = new Date(b.completionTime || b.cancellationTime || b.orderConfirmationDate);
            return dateB - dateA;
        });
        
        if (allHistoricalOrders.length === 0) {
            historyContainer.innerHTML = '<p>No order history available.</p>';
            return;
        }
        
        // Group orders by date
        const ordersByDate = {};
        allHistoricalOrders.forEach(order => {
            const orderDate = new Date(order.completionTime || order.cancellationTime || order.orderConfirmationDate)
                .toLocaleDateString();
            
            if (!ordersByDate[orderDate]) {
                ordersByDate[orderDate] = [];
            }
            
            ordersByDate[orderDate].push(order);
        });
        
        // Create HTML for order history
        let historyHTML = '';
        
        Object.keys(ordersByDate).forEach(orderDate => {
            historyHTML += `<div class="history-date"><h3>${orderDate}</h3></div>`;
            
            ordersByDate[orderDate].forEach(order => {
                const status = order.completionTime ? 'Completed' : (order.cancellationTime ? 'Cancelled' : 'Unknown');
                const statusClass = status.toLowerCase();
                
                historyHTML += `
                    <div class="history-order ${statusClass}">
                        <div class="history-order-header">
                            <h4>Order #${order.orderId}</h4>
                            <span class="history-status ${statusClass}">${status}</span>
                        </div>
                        <p><strong>Customer:</strong> ${order.name}</p>
                        <p><strong>Mobile:</strong> ${order.mobile}</p>
                        <p><strong>Table:</strong> ${order.table}</p>
                        <h5>Items:</h5>
                        <ul>
                            ${order.items.map(item => `<li>${item.name} × ${item.quantity} = RS.${item.total}</li>`).join('')}
                        </ul>
                        <p><strong>Total:</strong> RS.${parseFloat(order.total).toFixed(2)}</p>
                        <p><strong>Order Time:</strong> ${order.orderConfirmationDate}</p>
                        ${order.completionTime ? `<p><strong>Completion Time:</strong> ${order.completionTime}</p>` : ''}
                        ${order.cancellationTime ? `<p><strong>Cancellation Time:</strong> ${order.cancellationTime}</p>` : ''}
                        ${order.cancellationReason ? `<p><strong>Cancellation Reason:</strong> ${order.cancellationReason}</p>` : ''}
                    </div>
                `;
            });
        });
        
        historyContainer.innerHTML = historyHTML;
    })
    .catch(error => {
        console.error("Error loading order history:", error);
        historyContainer.innerHTML = '<p>Error loading order history. Please try again.</p>';
    });
}

// Function to load sales data for a specific date range
function loadSalesData(days = 7) {
    const salesDataContainer = document.getElementById('sales-data-container');
    
    // Get data from Firebase
    completedOrdersRef.once('value')
        .then((snapshot) => {
            const completedOrders = [];
            snapshot.forEach(childSnapshot => {
                completedOrders.push(childSnapshot.val());
            });
            
            // Calculate date range
            const endDate = new Date();
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - days);
            
            // Filter orders in the date range
            const ordersInRange = completedOrders.filter(order => {
                const orderDate = new Date(order.completionTime || order.orderConfirmationDate);
                return orderDate >= startDate && orderDate <= endDate;
            });
            
            if (ordersInRange.length === 0) {
                salesDataContainer.innerHTML = `<p>No sales data available for the last ${days} days.</p>`;
                return;
            }
            
            // Calculate total sales
            const totalSales = ordersInRange.reduce((sum, order) => sum + parseFloat(order.total), 0);
            
            // Group sales by day
            const salesByDay = {};
            ordersInRange.forEach(order => {
                const day = new Date(order.completionTime || order.orderConfirmationDate).toLocaleDateString();
                if (!salesByDay[day]) {
                    salesByDay[day] = 0;
                }
                salesByDay[day] += parseFloat(order.total);
            });
            
            // Calculate popular menu items
            const itemSales = {};
            ordersInRange.forEach(order => {
                order.items.forEach(item => {
                    if (!itemSales[item.name]) {
                        itemSales[item.name] = {
                            quantity: 0,
                            revenue: 0
                        };
                    }
                    itemSales[item.name].quantity += item.quantity;
                    itemSales[item.name].revenue += parseFloat(item.total);
                });
            });
            
            // Sort items by quantity sold
            const popularItems = Object.entries(itemSales)
                .sort((a, b) => b[1].quantity - a[1].quantity)
                .slice(0, 5); // Top 5 items
            
            // Create HTML for sales data
            let salesHTML = `
                <div class="sales-summary">
                    <h3>Sales Summary (Last ${days} Days)</h3>
                    <p><strong>Total Sales:</strong> RS.${totalSales.toFixed(2)}</p>
                    <p><strong>Orders Completed:</strong> ${ordersInRange.length}</p>
                    <p><strong>Average Order Value:</strong> RS.${(totalSales / ordersInRange.length).toFixed(2)}</p>
                </div>
                
                <div class="popular-items">
                    <h3>Popular Items</h3>
                    <ul>
                        ${popularItems.map(([name, data]) => 
                            `<li>${name} - ${data.quantity} sold - RS.${data.revenue.toFixed(2)}</li>`
                        ).join('')}
                    </ul>
                </div>
                
                <div class="daily-sales">
                    <h3>Daily Sales</h3>
                    <ul>
                        ${Object.entries(salesByDay).map(([day, sales]) => 
                            `<li>${day} - RS.${sales.toFixed(2)}</li>`
                        ).join('')}
                    </ul>
                </div>
            `;
            
            salesDataContainer.innerHTML = salesHTML;
        })
        .catch((error) => {
            console.error('Error loading sales data:', error);
            salesDataContainer.innerHTML = '<p>Error loading sales data. Please try again.</p>';
        });
}

// Function to switch between different manager views
function switchManagerView(view) {
    // Hide all content sections
    document.querySelectorAll('.manager-content').forEach(section => {
        section.style.display = 'none';
    });
    
    // Show selected section
    document.getElementById(`${view}-content`).style.display = 'block';
    
    // Update active tab
    document.querySelectorAll('.tab-button').forEach(button => {
        button.classList.remove('active');
    });
    document.querySelector(`.tab-button[data-view="${view}"]`).classList.add('active');
    
    // Load content for the selected view
    if (view === 'orders') {
        loadActiveOrders();
        loadCompletedOrders();
    } else if (view === 'menu') {
        loadMenuItems();
    } else if (view === 'history') {
        loadOrderHistory();
    }
}

// Load content when the page is loaded
window.onload = function() {
    // Set up tab buttons
    document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', () => {
            switchManagerView(button.getAttribute('data-view'));
        });
    });
    
    // Start with orders view
    switchManagerView('orders');
    
    // Set up auto-refresh for active orders (every 30 seconds)
    setInterval(() => {
        if (document.getElementById('orders-content').style.display !== 'none') {
            loadActiveOrders();
        }
    }, 30000);
};
