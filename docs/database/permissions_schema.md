# Sample Database Schema for Roles & Permissions

This document outlines a sample SQL schema for implementing a flexible role-based access control (RBAC) system. This revised schema uses a normalized structure with a dedicated `pages` table.

## Table Structure

### 1. `pages`

This table stores the definitions of the modules or pages available in the system.

```sql
CREATE TABLE pages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT
);
```

**Example Data:**
```sql
INSERT INTO pages (name, description) VALUES
('dashboard', 'The main application dashboard.'),
('sales-dashboard', 'Dashboard for the sales module.'),
('orders', 'Page for managing customer sales orders.'),
('invoices', 'Page for managing sales invoices.'),
('receipts', 'Page for managing payment receipts.'),
('service-center-dashboard', 'Dashboard for the service center.'),
('service-jobs', 'Page for managing service and repair jobs.'),
('warranty-management', 'Page for managing product warranties.'),
('crm-dashboard', 'Dashboard for Customer Relationship Management.'),
('customers', 'Page for managing customer profiles.'),
('inventory-dashboard', 'Dashboard for inventory management.'),
('products', 'Page for managing all products and variants.'),
('product-categories', 'Page for managing product categories.'),
('product-collections', 'Page for managing product collections.'),
('product-brands', 'Page for managing product brands.'),
('product-models', 'Page for managing product models.'),
('product-colors', 'Page for managing product colors.'),
('product-sizes', 'Page for managing product sizes.'),
('product-custom-fields', 'Page for managing custom product fields.'),
('stock-transfers', 'Page for managing stock movements between locations.'),
('stock-adjustment', 'Page for manual stock adjustments.'),
('opening-stock', 'Page for setting initial stock levels.'),
('ai-inventory-forecast', 'AI tool for forecasting inventory needs.'),
('production-bom', 'Page for managing Bill of Materials (recipes).'),
('production-notes', 'Page for recording production runs.'),
('suppliers-dashboard', 'Dashboard for supplier management.'),
('suppliers', 'Page for managing all suppliers.'),
('supplier-payments', 'Page for recording payments to suppliers.'),
('supplier-returns', 'Page for managing returns to suppliers.'),
('purchase-orders', 'Page for managing purchase orders.'),
('grn', 'Page for managing Goods Received Notes.'),
('accounting-dashboard', 'Dashboard for the accounting module.'),
('chart-of-accounts', 'Page for managing the chart of accounts.'),
('journal-entries', 'Page for manual accounting entries.'),
('expenses', 'Page for managing business expenses.'),
('fixed-assets', 'Page for managing fixed assets.'),
('transaction-setup', 'Page for configuring automated accounting entries.'),
('reports-center', 'Hub for all business reports.'),
('settings-profile', 'Page for managing user profile settings.'),
('settings-users', 'Page for managing users in the company.'),
('settings-roles', 'Page for managing user roles and permissions.'),
('settings-locations', 'Page for managing business locations.'),
('settings-tables', 'Page for managing dine-in tables for POS.'),
('settings-payment-methods', 'Page for managing payment methods.'),
('settings-integrations', 'Page for managing third-party integrations.'),
('settings-billing', 'Page for managing subscription and billing.');
```
---

### 2. `actions`

This table stores the types of actions a user can perform (e.g., read, process).

```sql
CREATE TABLE actions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE
);
```

**Example Data:**
```sql
INSERT INTO actions (name) VALUES
('read'),
('process');
```
---

### 3. `permissions` (Junction Table)

This table links pages to actions, creating a comprehensive list of all possible permissions in the system.

```sql
CREATE TABLE permissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    page_id INT NOT NULL,
    action_id INT NOT NULL,
    UNIQUE(page_id, action_id),
    FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE,
    FOREIGN KEY (action_id) REFERENCES actions(id) ON DELETE CASCADE
);
```

**Example Data:**
```sql
-- Assuming 'products' page has ID=12 and actions 'read' and 'process' have IDs 1 and 2
INSERT INTO permissions (page_id, action_id) VALUES
(12, 1), -- products:read
(12, 2); -- products:process
```
---

### 4. `roles`

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

---

### 5. `role_permissions` (Junction Table)

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

---

### 6. `user_roles` (Junction Table)

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

## How It Works

1.  **Define Pages & Actions**: First, populate the `pages` table with all the distinct sections of your application and the `actions` table with the types of permissions (e.g., read, process).
2.  **Generate Permissions**: Create all possible combinations of pages and actions in the `permissions` table.
3.  **Assign to Roles**: Link permissions to roles in the `role_permissions` table.
4.  **Check Access**: When a user tries to access a page, your backend would check if their assigned role(s) have the necessary permission (e.g., access to 'products' page with 'read' action).
```
