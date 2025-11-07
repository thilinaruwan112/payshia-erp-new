# Sample Database Schema for Roles & Permissions

This document outlines a sample SQL schema for implementing a flexible role-based access control (RBAC) system. This revised schema uses a dedicated `pages` table.

## Table Structure

### 1. `pages`

This table stores the definitions of the modules or pages available in the system.

```sql
CREATE TABLE pages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    display_name VARCHAR(255) NOT NULL,
    description TEXT
);
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
---

### 7. `page_user_permissions` (Junction Table)

This table assigns page-specific permissions directly to a user, overriding their role-based permissions.

```sql
CREATE TABLE page_user_permissions (
    user_id INT NOT NULL,
    page_id INT NOT NULL,
    company_id INT NOT NULL,
    right_access BOOLEAN DEFAULT FALSE,
    process_access BOOLEAN DEFAULT FALSE,
    PRIMARY KEY (user_id, page_id, company_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);
```

## How It Works

1.  **Define Pages & Actions**: First, populate the `pages` table with all the distinct sections of your application and the `actions` table with the types of permissions (e.g., read, process).
2.  **Generate Permissions**: Create all possible combinations of pages and actions in the `permissions` table.
3.  **Assign to Roles**: Link permissions to roles in the `role_permissions` table.
4.  **Check Access**: When a user tries to access a page, your backend would check if their assigned role(s) have the necessary permission (e.g., access to 'products' page with 'read' action).


