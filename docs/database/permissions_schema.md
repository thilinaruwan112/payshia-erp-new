# Sample Database Schema for Roles & Permissions

This document outlines a sample SQL schema for implementing a flexible role-based access control (RBAC) system.

## Table Structure

### 1. `roles`

This table stores the definitions of the roles available in the system.

```sql
CREATE TABLE roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

**Example Data:**
```sql
INSERT INTO roles (name, description) VALUES
('Super Admin', 'Has full, unrestricted access to all features.'),
('Sales Agent', 'Can manage customers and sales orders.'),
('Inventory Manager', 'Can manage products, stock, and purchasing.');
```

---

### 2. `permissions`

This table defines every individual action that can be controlled. We use a format like `page:action` (e.g., `products:read`, `invoices:process`).

```sql
CREATE TABLE permissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT
);
```

**Example Data (Full List):**
This script will populate the table with all the permissions needed for the application.

```sql
INSERT INTO permissions (name, description) VALUES
-- Sales
('sales-dashboard:read', 'Can view the Sales Dashboard page'),
('sales-dashboard:process', 'Can perform actions on the Sales Dashboard page'),
('orders:read', 'Can view the Orders page'),
('orders:process', 'Can process orders'),
('invoices:read', 'Can view the Invoices page'),
('invoices:process', 'Can create, edit, and delete invoices'),
('receipts:read', 'Can view the Receipts page'),
('receipts:process', 'Can create, edit, and delete receipts'),

-- CRM
('crm-customers:read', 'Can view the Customers page'),
('crm-customers:process', 'Can create, edit, and delete customers'),

-- Inventory & Products
('inventory-dashboard:read', 'Can view the Inventory Dashboard page'),
('inventory-dashboard:process', 'Can perform actions on the Inventory Dashboard page'),
('products:read', 'Can view the All Products page'),
('products:process', 'Can create, edit, and delete products'),
('product-categories:read', 'Can view the Product Categories page'),
('product-categories:process', 'Can create, edit, and delete product categories'),
('product-collections:read', 'Can view the Product Collections page'),
('product-collections:process', 'Can create, edit, and delete product collections'),
('product-brands:read', 'Can view the Product Brands page'),
('product-brands:process', 'Can create, edit, and delete product brands'),
('stock-transfers:read', 'Can view the Stock Transfers page'),
('stock-transfers:process', 'Can create, edit, and delete stock transfers'),
('opening-stock:read', 'Can view the Opening Stock page'),
('opening-stock:process', 'Can set opening stock levels'),

-- Purchasing
('purchase-orders:read', 'Can view the Purchase Orders page'),
('purchase-orders:process', 'Can create, edit, and approve purchase orders'),
('grn:read', 'Can view the Goods Received Notes page'),
('grn:process', 'Can create and process Goods Received Notes'),

-- Accounting
('accounting-dashboard:read', 'Can view the Accounting Dashboard page'),
('accounting-dashboard:process', 'Can perform actions on the Accounting Dashboard page'),
('chart-of-accounts:read', 'Can view the Chart of Accounts'),
('chart-of-accounts:process', 'Can create, edit, and delete accounts'),
('journal-entries:read', 'Can view Journal Entries'),
('journal-entries:process', 'Can create and post Journal Entries'),
('expenses:read', 'Can view Expenses'),
('expenses:process', 'Can record and manage Expenses'),

-- Settings
('settings-company:read', 'Can view the Company Profile'),
('settings-company:process', 'Can edit the Company Profile'),
('settings-users:read', 'Can view Users and Roles'),
('settings-users:process', 'Can invite users and manage roles'),
('settings-locations:read', 'Can view Locations'),
('settings-locations:process', 'Can create, edit, and delete Locations'),

-- Admin
('admin-all:process', 'Grants full access to all pages and actions');
```

---

### 3. `role_permissions` (Junction Table)

This table links roles to their assigned permissions, creating a many-to-many relationship.

```sql
CREATE TABLE role_permissions (
    role_id INT NOT NULL,
    permission_id INT NOT NULL,
    PRIMARY KEY (role_id, permission_id),
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
);
```

**Example Data:**
```sql
-- Give Sales Agent read and process permissions for sales
-- Assuming role 'Sales Agent' has ID=2 and permissions 'invoices:read' and 'invoices:process' have IDs 5 and 6
INSERT INTO role_permissions (role_id, permission_id) VALUES
(2, 5), -- Sales Agent -> invoices:read
(2, 6); -- Sales Agent -> invoices:process
```

---

### 4. `user_roles` (Junction Table)

This table assigns one or more roles to each user.

```sql
CREATE TABLE user_roles (
    user_id INT NOT NULL,
    role_id INT NOT NULL,
    PRIMARY KEY (user_id, role_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
);
```

**Example Data:**
```sql
-- Assign the 'Sales Agent' role to a user with ID 101
INSERT INTO user_roles (user_id, role_id) VALUES
(101, 2);
```

## How It Works

1.  **Check Permissions**: When a user tries to access a page or perform an action, your backend should:
    1.  Get the user's ID from their session.
    2.  Find all `role_id`s for that user from the `user_roles` table.
    3.  Find all `permission_id`s associated with those roles from the `role_permissions` table.
    4.  Find the names of those permissions from the `permissions` table.
2.  **Enforce Access**: Your application code then checks if the required permission (e.g., `'inventory:process'`) exists in the list of permissions granted to the user. If `admin:all:process` is present, all checks pass automatically.
