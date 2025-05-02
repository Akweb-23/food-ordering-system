CREATE DATABASE restaurant;

USE restaurant;

CREATE TABLE orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100),
    mobile VARCHAR(15),
    table_number VARCHAR(10),
    items TEXT, 
    total DECIMAL(10, 2),
    gst DECIMAL(10, 2),
    order_time DATETIME
);
