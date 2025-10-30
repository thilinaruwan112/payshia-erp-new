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

**Example Data:**
```sql
INSERT INTO permissions (name, description) VALUES
('sales:read', 'Can view sales dashboards, orders, and invoices.'),
('sales:process', 'Can create, edit, and delete sales orders and invoices.'),
('inventory:read', 'Can view products, stock levels, and transfers.'),
('inventory:process', 'Can create, edit, and delete products and manage stock.'),
('admin:all', 'Grants access to all permissions unconditionally.');
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
INSERT INTO role_permissions (role_id, permission_id) VALUES
(2, 1), -- Sales Agent -> sales:read
(2, 2); -- Sales Agent -> sales:process
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
2.  **Enforce Access**: Your application code then checks if the required permission (e.g., `'inventory:process'`) exists in the list of permissions granted to the user. If `admin:all` is present, all checks pass automatically.
