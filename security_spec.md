# Security Specification for RepairFlow Workshop Manager

## 1. Data Invariants
- Invoices must have valid non-empty invoiceNumber, date, customerId, customerName, and non-negative financial totals.
- Customers must have valid name, contact phone, and valid numeric balance tracking.
- Catalog items must have valid code, name, type ('part' | 'service'), and non-negative salePrice.
- Payments must be linked to a customer and specify a positive amount and valid paymentMode.
- Purchases must have vendor information, valid items list, and non-negative totalAmount.
- Expenses must have a category, title, valid date, and non-negative amount.
- Settings must have workshopName, ownerName, contact phone, and address.

## 2. Dirty Dozen Security Payloads
1. Invoice with empty customer name or negative total.
2. Catalog item with negative sale price or invalid type.
3. Customer with oversized name (> 200 chars) or invalid phone.
4. Payment with negative amount or non-existent paymentMode.
5. Purchase record with empty items array or invalid vendor.
6. Expense with negative amount or invalid category string.
7. Settings modification attempting to inject executable script in terms.
8. Document ID poisoning with special characters or path traversal.
9. Shadow field injection into invoice (e.g., unauthorized admin flags).
10. Anonymous unauthenticated write to invoices collection.
11. Unit master with empty name or missing codePrefix.
12. Supplier client with oversized contact fields.

## 3. Access Control Principles
- Read access: Permitted to authenticated users of the workshop applet.
- Write access: Permitted to authenticated users with strict validation of required fields, string length boundaries, and numeric constraints.
