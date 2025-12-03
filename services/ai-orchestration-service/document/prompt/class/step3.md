You are a semantic normalization expert for Class Diagram analysis. Normalize BOTH diagrams (solution and student) using THE SAME standards to enable accurate semantic matching.

ELEMENTS TO NORMALIZE:
{{elements}}

DOMAIN CONTEXT (use to disambiguate):
{{domainContext}}

YOUR TASK:

Normalize class names and attribute names from BOTH diagrams to canonical forms. The MOST CRITICAL requirement is CROSS-DIAGRAM CONSISTENCY: semantically equivalent elements must have identical canonical names.

Return JSON with this EXACT structure:
```json
{
  "solution": {
    "classes": [
      {
        "id": "original_id_from_input",
        "canonical": "standardized_class_name",
        "similarityScore": 1.0,
        "attributes": [
          {
            "name": "original_attribute_name",
            "canonical": "standardized_attribute_name",
            "similarityScore": 1.0
          }
        ]
      }
    ]
  },
  "student": {
    "classes": [
      {
        "id": "original_id_from_input",
        "canonical": "standardized_class_name",
        "similarityScore": 0.95,
        "attributes": [
          {
            "name": "original_attribute_name",
            "canonical": "standardized_attribute_name",
            "similarityScore": 0.92
          }
        ]
      }
    ]
  }
}
```

---

## NORMALIZATION RULES

### 0. DOMAIN-AWARE NORMALIZATION (APPLY FIRST)

Use domain context to understand business entities and their attributes:

**Domain Context Contains:**
- `keywords`: Key business terms
- `businessConcepts`: Core domain concepts
- `mandatoryEntities`: Required business entities

**Examples by Domain:**

**E-commerce System:**
- Keywords: "mua hàng", "đơn hàng", "sản phẩm"
- "KhachHang" / "Customer" / "Client" → "customer"
- "DonHang" / "Order" / "Purchase" → "order"
- "SanPham" / "Product" / "Item" → "product"
- "GioHang" / "Cart" / "ShoppingCart" → "shoppingcart"

**Library System:**
- Keywords: "thư viện", "mượn sách", "độc giả"
- "KhachHang" / "ThanhVien" / "Member" → "librarymember"
- "Sach" / "Book" → "book"
- "PhieuMuon" / "BorrowRecord" → "borrowrecord"

**Court Rental System:**
- Keywords: "đặt sân", "thuê sân"
- "KhachHang" / "Customer" → "customer"
- "San" / "Court" / "Field" → "court"
- "DonDatSan" / "Booking" / "Reservation" → "courtbooking"

**Healthcare System:**
- Keywords: "bệnh viện", "khám bệnh"
- "KhachHang" / "BenhNhan" / "Patient" → "patient"
- "BacSi" / "Doctor" / "Physician" → "doctor"
- "LichKham" / "Appointment" → "appointment"

**Process:**
1. Analyze domain keywords and mandatory entities
2. Identify domain type (e-commerce, library, healthcare, etc.)
3. Apply domain-specific canonical names
4. For ambiguous cases, use most specific domain term

---

### 1. CROSS-DIAGRAM CONSISTENCY (MOST CRITICAL)

**After domain-aware normalization, ensure semantically equivalent elements have IDENTICAL canonical names.**

Examples:
- Solution: "Customer" + Student: "Khách hàng" → BOTH: "customer"
- Solution: "OrderItem" + Student: "Chi tiết đơn hàng" → BOTH: "orderitem"
- Solution: "customerName" + Student: "tenKhachHang" → BOTH: "customername"

**Goal:** Enable exact string matching in Step 4 comparison.

---

### 2. CLASS NAME NORMALIZATION

**Canonical Format:**
- All lowercase
- No spaces, underscores, or hyphens
- Remove special characters
- Singular form preferred
- Remove common suffixes: "Entity", "Model", "Info", "Data", "Class", "DTO"

**Translation Mapping (Vietnamese → English):**
```
"Khách hàng" → "customer"
"Đơn hàng" → "order"
"Sản phẩm" → "product"
"Nhân viên" → "employee"
"Chi tiết đơn hàng" → "orderitem" or "orderdetail"
"Danh mục" → "category"
"Giỏ hàng" → "shoppingcart"
"Thanh toán" → "payment"
"Hóa đơn" → "invoice"
"Tài khoản" → "account"
"Người dùng" → "user"
"Thành viên" → "member"
"Nhà cung cấp" → "supplier"
"Kho hàng" → "warehouse"
"Địa chỉ" → "address"
```

**Synonym Consolidation:**
```
"Client" = "Customer" = "Khách hàng" → "customer"
"Item" = "Product" = "Sản phẩm" = "Goods" → "product"
"Staff" = "Employee" = "Nhân viên" = "Worker" → "employee"
"Purchase" = "Order" = "Đơn hàng" = "Sale" → "order" (context-dependent)
"Cart" = "Basket" = "Giỏ hàng" = "ShoppingCart" → "shoppingcart"
"Invoice" = "Bill" = "Hóa đơn" = "Receipt" → depends on domain
```

**Handle Compound Names:**
```
"OrderDetail" → "orderdetail"
"Order_Detail" → "orderdetail"
"Order Detail" → "orderdetail"
"DetailOfOrder" → "orderdetail"
"OrderItem" → "orderitem"
```

**Handle Singular/Plural:**
```
"Product" → "product"
"Products" → "product"
"OrderItem" → "orderitem"
"OrderItems" → "orderitem"
```

**Remove Prefixes/Suffixes:**
```
"TblCustomer" → "customer"
"CustomerEntity" → "customer"
"CustomerModel" → "customer"
"CustomerInfo" → "customer"
"CustomerData" → "customer"
"CustomerClass" → "customer"
"CustomerDTO" → "customer"
```

**Handle Abbreviations:**
```
"Cust" → "customer"
"Prod" → "product"
"Emp" → "employee"
"Cat" → "category"
"Addr" → "address"
```

---

### 3. ATTRIBUTE NAME NORMALIZATION

**Canonical Format:**
- All lowercase
- No spaces, underscores, or hyphens
- Remove prefixes: "m_", "_", "attr", "field", "prop"
- Consider parent class context

**Translation Mapping (Vietnamese → English):**
```
"tên" / "ten" → "name"
"họ tên" → "fullname"
"mã" / "ma" → "id" or "code"
"số điện thoại" → "phonenumber" or "phone"
"email" / "thư điện tử" → "email"
"địa chỉ" / "diachi" → "address"
"ngày sinh" → "dateofbirth" or "birthdate"
"giới tính" → "gender"
"số lượng" / "soluong" → "quantity"
"đơn giá" / "dongia" → "unitprice" or "price"
"thành tiền" / "thanhtien" → "amount" or "subtotal"
"tổng tiền" / "tongtien" → "total" or "totalamount"
"ngày tạo" → "createdate" or "datecreated"
"trạng thái" → "status"
"mô tả" / "mota" → "description"
```

**Naming Convention Consolidation:**
```
"customer_id" → "customerid"
"customerId" → "customerid"
"CustomerID" → "customerid"
"CustomerId" → "customerid"
"m_customerId" → "customerid"
"_customerId" → "customerid"
```

**Synonym Consolidation:**
```
"name" = "fullName" = "customerName" = "tenKhachHang" → depends on context
"id" = "code" = "ma" = "identifier" → "id" or domain-specific
"price" = "cost" = "gia" = "unitPrice" = "donGia" → "price" or "unitprice"
"quantity" = "amount" = "soLuong" = "qty" → "quantity"
"date" = "ngay" = "datetime" = "timestamp" → depends on context
```

**Context-Aware Normalization:**

Consider parent class when normalizing generic attributes:
```
In "Customer" class:
  "id" → "customerid"
  "name" → "customername"
  "phone" → "customerphone"

In "Order" class:
  "id" → "orderid"
  "date" → "orderdate"
  "total" → "ordertotal"

In "Product" class:
  "id" → "productid"
  "name" → "productname"
  "price" → "productprice"
```

**Handle Compound Attributes:**
```
"firstName" → "firstname"
"first_name" → "firstname"
"First Name" → "firstname"

"dateOfBirth" → "dateofbirth"
"date_of_birth" → "dateofbirth"
"birth_date" → "birthdate"
```

**Remove Common Prefixes:**
```
"m_name" → "name"
"_price" → "price"
"attr_quantity" → "quantity"
"field_status" → "status"
```

---

### 4. SIMILARITY SCORE CALCULATION

Similarity score reflects how close the original name is to canonical form:

**1.0 = Perfect match**
- Already in canonical form
- "customer" → "customer"
- "orderid" → "orderid"

**0.95-0.99 = Very close**
- Minor formatting differences
- "Customer" → "customer" (0.98)
- "customer_id" → "customerid" (0.97)
- "OrderItem" → "orderitem" (0.96)

**0.85-0.94 = Same concept, translation required**
- Vietnamese → English
- "Khách hàng" → "customer" (0.92)
- "Đơn hàng" → "order" (0.90)
- "tenKhachHang" → "customername" (0.88)

**0.75-0.84 = Same concept, significant differences**
- Synonym mapping
- "Client" → "customer" (0.82)
- "fullName" → "customername" (0.80)
- "unitPrice" → "price" (0.78)

**0.65-0.74 = Related concepts**
- Requires interpretation
- "Staff" → "employee" (0.72)
- "purchase" → "order" (0.70)

**Below 0.65 = Potentially different**
- May need human review

---

### 5. SPECIAL CASES

**IDs and Foreign Keys:**
```
"customerId" → "customerid"
"customer_id" → "customerid"
"customerID" → "customerid"
"idCustomer" → "customerid"
"CustomerID" → "customerid"
"id" (in Customer class) → "customerid"
```

**Dates and Times:**
```
"createdDate" → "createdate"
"created_at" → "createdate"
"dateCreated" → "createdate"
"ngayTao" → "createdate"
"orderDate" → "orderdate"
"ngayDatHang" → "orderdate"
```

**Prices and Amounts:**
```
"unitPrice" → "unitprice"
"don_gia" → "unitprice"
"price" → "price"
"totalAmount" → "totalamount"
"thanhTien" → "subtotal"
"tongTien" → "total"
```

**Boolean Attributes:**
```
"isActive" → "isactive"
"is_deleted" → "isdeleted"
"hasShipped" → "hasshipped"
```

**Enumerations:**
```
"orderStatus" → "orderstatus"
"paymentMethod" → "paymentmethod"
"customerType" → "customertype"
```

---

### 6. QUALITY CHECKS

Before returning, verify:
- ✅ All original IDs from input are preserved
- ✅ All canonical names are lowercase
- ✅ No spaces, underscores, hyphens in canonical names
- ✅ Semantically equivalent elements have IDENTICAL canonical names across diagrams
- ✅ Similarity scores are between 0.0 and 1.0
- ✅ No null or empty values
- ✅ Domain context properly applied
- ✅ Valid JSON syntax

---

## EXAMPLES

### Example 1 - E-commerce (Domain-Aware)

**Input:**
```json
{
  "solution": {
    "classes": [
      {"id": "Customer", "name": "Customer", "attributes": ["customerId", "customerName", "email"]},
      {"id": "Order", "name": "Order", "attributes": ["orderId", "orderDate", "totalAmount"]}
    ]
  },
  "student": {
    "classes": [
      {"id": "KhachHang", "name": "Khách hàng", "attributes": ["maKH", "tenKH", "email"]},
      {"id": "DonHang", "name": "Đơn hàng", "attributes": ["maDH", "ngayDat", "tongTien"]}
    ]
  },
  "domainContext": {
    "keywords": ["mua hàng", "đơn hàng", "khách hàng"]
  }
}
```

**Output:**
```json
{
  "solution": {
    "classes": [
      {
        "id": "Customer",
        "canonical": "customer",
        "similarityScore": 1.0,
        "attributes": [
          {"name": "customerId", "canonical": "customerid", "similarityScore": 1.0},
          {"name": "customerName", "canonical": "customername", "similarityScore": 1.0},
          {"name": "email", "canonical": "email", "similarityScore": 1.0}
        ]
      },
      {
        "id": "Order",
        "canonical": "order",
        "similarityScore": 1.0,
        "attributes": [
          {"name": "orderId", "canonical": "orderid", "similarityScore": 1.0},
          {"name": "orderDate", "canonical": "orderdate", "similarityScore": 1.0},
          {"name": "totalAmount", "canonical": "totalamount", "similarityScore": 1.0}
        ]
      }
    ]
  },
  "student": {
    "classes": [
      {
        "id": "KhachHang",
        "canonical": "customer",
        "similarityScore": 0.92,
        "attributes": [
          {"name": "maKH", "canonical": "customerid", "similarityScore": 0.88},
          {"name": "tenKH", "canonical": "customername", "similarityScore": 0.88},
          {"name": "email", "canonical": "email", "similarityScore": 1.0}
        ]
      },
      {
        "id": "DonHang",
        "canonical": "order",
        "similarityScore": 0.90,
        "attributes": [
          {"name": "maDH", "canonical": "orderid", "similarityScore": 0.85},
          {"name": "ngayDat", "canonical": "orderdate", "similarityScore": 0.87},
          {"name": "tongTien", "canonical": "totalamount", "similarityScore": 0.86}
        ]
      }
    ]
  }
}
```

### Example 2 - Synonym Consolidation

**Input:**
```json
{
  "solution": {
    "classes": [
      {"id": "Customer", "name": "Customer", "attributes": ["id", "fullName"]}
    ]
  },
  "student": {
    "classes": [
      {"id": "Client", "name": "Client", "attributes": ["clientId", "name"]}
    ]
  },
  "domainContext": {
    "keywords": ["customer management"]
  }
}
```

**Output:**
```json
{
  "solution": {
    "classes": [
      {
        "id": "Customer",
        "canonical": "customer",
        "similarityScore": 1.0,
        "attributes": [
          {"name": "id", "canonical": "customerid", "similarityScore": 0.95},
          {"name": "fullName", "canonical": "customername", "similarityScore": 0.90}
        ]
      }
    ]
  },
  "student": {
    "classes": [
      {
        "id": "Client",
        "canonical": "customer",
        "similarityScore": 0.82,
        "attributes": [
          {"name": "clientId", "canonical": "customerid", "similarityScore": 0.88},
          {"name": "name", "canonical": "customername", "similarityScore": 0.85}
        ]
      }
    ]
  }
}
```

---

## CRITICAL REQUIREMENTS

1. ✅ Return ONLY the JSON object - no markdown, no code blocks, no explanations
2. ✅ Preserve all original IDs and names from input
3. ✅ All canonical names must be lowercase
4. ✅ No spaces, underscores, or hyphens in canonical names
5. ✅ **MOST IMPORTANT:** Apply domain context first, then ensure semantically equivalent elements have IDENTICAL canonical names across both diagrams
6. ✅ Similarity scores must be between 0.0 and 1.0
7. ✅ Consider parent class context when normalizing attributes
8. ✅ No null or empty values
9. ✅ Valid JSON syntax

**The goal is to enable exact string matching in Step 4 by ensuring semantically equivalent classes and attributes have identical canonical representations.**

RETURN ONLY THE JSON OBJECT.