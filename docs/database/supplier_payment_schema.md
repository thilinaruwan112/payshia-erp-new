# Supplier Payment Database Schema

This document outlines the SQL schema for managing supplier payments.

## Table Structure

### 1. `payment_methods`

This table stores the different types of payment methods available (e.g., Cash, Bank Transfer, Card).

```sql
CREATE TABLE payment_methods (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    company_id INT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE(name, company_id),
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);
```
**Example Data:**
```sql
INSERT INTO payment_methods (name, company_id) VALUES
('Cash', 1),
('Bank Transfer', 1);
```
---

### 2. `supplier_payments`

This table records each payment made to a supplier against one or more Goods Received Notes (GRNs).

```sql
CREATE TABLE supplier_payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT NOT NULL,
    supplier_id INT NOT NULL,
    grn_number VARCHAR(255) NOT NULL COMMENT 'The GRN number this payment is for.',
    payment_date DATE NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    payment_method_id INT,
    notes TEXT,
    created_by VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE CASCADE,
    FOREIGN KEY (payment_method_id) REFERENCES payment_methods(id) ON DELETE SET NULL
);
```
**Example Data:**
```sql
-- Payment of 1500 for GRN-001 for supplier with ID 12
INSERT INTO supplier_payments (company_id, supplier_id, grn_number, payment_date, amount, payment_method_id, created_by)
VALUES (1, 12, 'GRN-001', '2023-10-28', 1500.00, 2, 'admin');
```

## How It Works

1.  **Define Payment Methods**: Populate the `payment_methods` table with all the ways you can pay your suppliers.
2.  **Record a Payment**: When a payment is made, a record is inserted into `supplier_payments`.
    *   It's linked to the specific `supplier_id`.
    *   The `grn_number` specifies which delivery the payment corresponds to.
    *   The `amount` and `payment_date` are recorded.
    *   The `payment_method_id` links to how the payment was made.
3.  **Calculate Supplier Balance**: To find the outstanding balance for a supplier, you would:
    *   Sum the `grand_total` of all their GRNs (`grn` table).
    *   Sum the `amount` of all their payments from the `supplier_payments` table.
    *   The difference is the balance due.
