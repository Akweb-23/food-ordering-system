<?php
header('Content-Type: application/json');

// Database connection
$host = 'localhost';
$db   = 'cafe';
$user = 'root';
$pass = '';
$conn = new mysqli($host, $user, $pass, $db);
if ($conn->connect_error) {
    die(json_encode(['success' => false, 'message' => 'DB connection failed']));
}

// Helper: fetch JSON input
function getInputData() {
    return json_decode(file_get_contents("php://input"), true);
}

// Helper: fetch order items
function getOrderItems($conn, $orderId, $table) {
    $isCompleted = isset($_GET['completed']) && $_GET['completed'] === '1';
    $itemsTable = $isCompleted ? 'completed_order_items' : 'order_items';
    $items = [];
    $res = $conn->query("SELECT item_name, price, quantity, total FROM $itemsTable WHERE order_id = $orderId");
    while ($row = $res->fetch_assoc()) {
        $items[] = $row;
    }
    return $items;
}

// Action handler
$action = $_GET['action'] ?? '';

switch ($action) {
    // Save new order
    case 'submit':
        $data = getInputData();
        $name = $data['name'];
        $mobile = $data['mobile'];
        $table = $data['table'];
        $items = $data['items'];
        $total = $data['total'];
        $gst = $data['gst'];
        $order_time = date('Y-m-d H:i:s');

        $stmt = $conn->prepare("INSERT INTO orders (customer_name, mobile, table_number, total, gst, order_time) VALUES (?, ?, ?, ?, ?, ?)");
        $stmt->bind_param("sssdds", $name, $mobile, $table, $total, $gst, $order_time);
        $stmt->execute();
        $order_id = $stmt->insert_id;

        foreach ($items as $item) {
            $stmt = $conn->prepare("INSERT INTO order_items (order_id, item_name, price, quantity, total) VALUES (?, ?, ?, ?, ?)");
            $stmt->bind_param("isdid", $order_id, $item['name'], $item['price'], $item['quantity'], $item['total']);
            $stmt->execute();
        }

        echo json_encode(['success' => true, 'message' => 'Order placed']);
        break;

    // Complete order
    case 'complete':
        $table = $_GET['table'] ?? '';
        if (!$table) {
            echo json_encode(['success' => false, 'message' => 'No table provided']);
            exit;
        }

        $result = $conn->query("SELECT * FROM orders WHERE table_number = '$table'");
        if ($order = $result->fetch_assoc()) {
            $orderId = $order['id'];

            // Insert to completed_orders
            $stmt = $conn->prepare("INSERT INTO completed_orders (customer_name, mobile, table_number, total, gst, order_time) VALUES (?, ?, ?, ?, ?, NOW())");
            $stmt->bind_param("sssdd", $order['customer_name'], $order['mobile'], $order['table_number'], $order['total'], $order['gst']);
            $stmt->execute();
            $newOrderId = $stmt->insert_id;

            // Copy items
            $itemsRes = $conn->query("SELECT * FROM order_items WHERE order_id = $orderId");
            while ($item = $itemsRes->fetch_assoc()) {
                $stmt = $conn->prepare("INSERT INTO completed_order_items (order_id, item_name, price, quantity, total) VALUES (?, ?, ?, ?, ?)");
                $stmt->bind_param("isdid", $newOrderId, $item['item_name'], $item['price'], $item['quantity'], $item['total']);
                $stmt->execute();
            }

            // Delete original
            $conn->query("DELETE FROM orders WHERE id = $orderId");
            $conn->query("DELETE FROM order_items WHERE order_id = $orderId");

            echo json_encode(['success' => true, 'message' => 'Order completed']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Order not found']);
        }
        break;

    // Get active orders
    case 'get_active':
        $orders = [];
        $result = $conn->query("SELECT * FROM orders");
        while ($row = $result->fetch_assoc()) {
            $orders[] = [
                'id' => $row['id'],
                'name' => $row['customer_name'],
                'mobile' => $row['mobile'],
                'table' => $row['table_number'],
                'total' => floatval($row['total']),
                'gst' => floatval($row['gst']),
                'orderConfirmationDate' => $row['order_time'],
                'items' => getOrderItems($conn, $row['id'], $row['table_number'])
            ];
        }
        echo json_encode(['orders' => $orders]);
        break;

    // Get completed orders
    case 'get_completed':
        $orders = [];
        $result = $conn->query("SELECT * FROM completed_orders");
        while ($row = $result->fetch_assoc()) {
            $orders[] = [
                'id' => $row['id'],
                'name' => $row['customer_name'],
                'mobile' => $row['mobile'],
                'table' => $row['table_number'],
                'total' => floatval($row['total']),
                'gst' => floatval($row['gst']),
                'orderConfirmationDate' => $row['order_time'],
                'paymentCompletedTime' => $row['order_time'],
                'items' => getOrderItems($conn, $row['id'], $row['table_number'])
            ];
        }
        echo json_encode(['completedOrders' => $orders]);
        break;

    default:
        echo json_encode(['success' => false, 'message' => 'Invalid action']);
        break;
}
?>
