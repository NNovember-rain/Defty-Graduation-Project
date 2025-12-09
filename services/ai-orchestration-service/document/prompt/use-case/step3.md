You are a semantic analysis expert. Normalize BOTH diagram elements (solution and student) to canonical forms using THE SAME normalization standards for accurate comparison.

ELEMENTS TO NORMALIZE:
{{elements}}

DOMAIN CONTEXT (use this to disambiguate):
{{domainContext}}

YOUR TASK:

For each actor and use case name in BOTH diagrams, produce canonical (standardized) forms that enable accurate matching. The MOST CRITICAL requirement is CROSS-DIAGRAM CONSISTENCY: semantically equivalent elements must have identical canonical names.

Return JSON with this EXACT structure:

{
"solution": {
"actors": [
{
"id": "original_id_from_input",
"canonical": "standardized_actor_name",
"similarityScore": 1.0
}
],
"usecases": [
{
"id": "original_id_from_input",
"canonical": "standardized_usecase_name",
"similarityScore": 1.0
}
]
},
"student": {
"actors": [
{
"id": "original_id_from_input",
"canonical": "standardized_actor_name",
"similarityScore": 0.95
}
],
"usecases": [
{
"id": "original_id_from_input",
"canonical": "standardized_usecase_name",
"similarityScore": 0.95
}
]
}
}

NORMALIZATION RULES (apply consistently to BOTH diagrams):

0. DOMAIN-AWARE NORMALIZATION (APPLY FIRST)

   Use the domain context to understand the specific meaning of actors and use cases.

   The domain context contains:
    - keywords: Key terms from the assignment
    - mandatoryRequirements: Required system behaviors
    - scopeBoundaries: System description

   Use these to determine domain-specific meanings:

   Examples by domain:

   **Court/Sports Rental System** (Hệ thống đặt sân):
   Keywords: "đặt sân", "thuê sân", "quản lý sân"
    - "Khách hàng" / "Khách thuê sân" / "Customer" / "Client" → "customer renting court"
    - "Nhà cung cấp" / "Đối tác" / "Supplier" / "Partner" → "supplier" (equipment/goods supplier)
    - "Nhân viên" / "Staff" / "Employee" → "court staff"
    - "Quản lý" / "Manager" / "Quản lí" → "court manager"
    - "Đặt sân" / "Thuê sân" / "Book court" / "Rent court" → "rent court"
    - "Thanh toán" / "Payment" / "Pay" → "pay rental"
    - "Thống kê" / "Statistics" / "Report" → "view statistics"
    - "Nhập hàng" / "Import goods" / "Stock in" → "stock inventory"
    - "Cập nhật mặt hàng" / "Update items" → "update inventory"

   **Library System**:
   Keywords: "thư viện", "mượn sách", "quản lý sách"
    - "Khách hàng" / "Thành viên" / "Member" → "library member"
    - "Quản lý" / "Thủ thư" / "Librarian" → "librarian"
    - "Mượn sách" / "Borrow book" → "borrow book"
    - "Trả sách" / "Return book" → "return book"

   **E-commerce System**:
   Keywords: "mua hàng", "bán hàng", "giỏ hàng"
    - "Khách hàng" / "Customer" / "Buyer" → "customer"
    - "Nhà cung cấp" / "Seller" / "Merchant" → "seller"
    - "Đặt hàng" / "Place order" → "place order"
    - "Thanh toán" / "Checkout" → "checkout"

   **Healthcare System**:
   Keywords: "bệnh viện", "khám bệnh", "bệnh nhân"
    - "Khách hàng" / "Bệnh nhân" / "Patient" → "patient"
    - "Nhân viên" / "Y tá" / "Nurse" → "nurse"
    - "Bác sĩ" / "Doctor" → "doctor"

   **Process:**
    1. Analyze domain context keywords and requirements
    2. Identify the primary domain type
    3. Apply domain-specific canonical names
    4. For ambiguous cases, prioritize terms from mandatoryRequirements
    5. If context is unclear, use the most general term

1. CROSS-DIAGRAM CONSISTENCY (MOST CRITICAL)

   After applying domain-aware normalization, ensure semantically equivalent elements have IDENTICAL canonical names across both diagrams.

    - If solution has "Customer" and student has "Khách hàng" → BOTH normalize to same canonical
    - If solution has "Place Order" and student has "Đặt hàng" → BOTH normalize to same canonical
    - If solution has "Admin" and student has "Quản trị viên" → BOTH normalize to same canonical

   Goal: Enable exact matching in Step 4 by ensuring equivalent elements have identical canonical representations.

2. CANONICAL NAME FORMAT

    - All lowercase
    - No special characters except spaces
    - Spaces between words (NOT underscores or hyphens)
    - Simple, clear, standard terminology
    - Language-agnostic (prefer English equivalents)

   Examples:
    - "Customer" → "customer"
    - "Place Order" → "place order"
    - "E-mail System" → "email system"
    - "Đăng nhập" → "login"

3. ACTOR NORMALIZATION

   Actors represent roles or external systems.

   **Role-based actors:**
    - Use standard role names: "customer", "user", "administrator", "manager"
    - Remove redundancy: "System Administrator User" → "administrator"
    - Use singular form: "Customers" → "customer"
    - Fix typos: "Custmer" → "customer"

   **System actors:**
    - Standardize format: "Hệ thống thanh toán" → "payment system"
    - Pattern: "[function] system" (email system, payment system, notification system)
    - Remove "hệ thống" prefix and translate

   **Translation mapping (Vietnamese → English):**
    - "Khách hàng" → "customer" (or domain-specific: "library member", "patient", etc.)
    - "Người dùng" → "user"
    - "Quản trị viên" / "Admin" → "administrator"
    - "Nhân viên" → "employee" (or domain-specific: "court staff", "nurse", etc.)
    - "Thư viện viên" → "librarian"
    - "Bác sĩ" → "doctor"
    - "Bệnh nhân" → "patient"
    - "Sinh viên" → "student"
    - "Giáo viên" / "Giảng viên" → "teacher"
    - "Hệ thống [X]" → "[X] system"

   **Synonym consolidation:**
    - "Client" = "Customer" = "Khách hàng" → use domain-appropriate canonical
    - "Admin" = "Administrator" = "Sysadmin" = "Quản trị viên" → "administrator"
    - "User" = "End User" = "System User" = "Người dùng" → "user"
    - "Staff" = "Employee" = "Nhân viên" → "employee" (or domain-specific)
    - "Supplier" = "Partner" = "Nhà cung cấp" = "Đối tác" → check domain context

4. USE CASE NORMALIZATION

   Use cases represent system functionalities.

   **Standard verb-object format:**
    - Pattern: "[verb] [object]"
    - "Đặt hàng" → "place order"
    - "Xem sản phẩm" → "view products"
    - "Tìm kiếm sách" → "search books"

   **Remove UI/implementation details:**
    - "Click Login Button" → "login"
    - "Navigate to checkout page" → "checkout"
    - "Query database for products" → "view products"
    - "Display order history" → "view order history"

   **Standard verb mapping (Vietnamese/variations → English):**
    - "Xem" / "View" / "Browse" / "Display" → "view"
    - "Thêm" / "Tạo" / "Create" / "Add" / "New" → "create"
    - "Sửa" / "Cập nhật" / "Update" / "Edit" / "Modify" → "update"
    - "Xóa" / "Delete" / "Remove" → "delete"
    - "Tìm kiếm" / "Search" / "Find" / "Look up" → "search"
    - "Đăng nhập" / "Login" / "Sign in" / "Log in" → "login"
    - "Đăng xuất" / "Logout" / "Sign out" / "Log out" → "logout"
    - "Đăng ký" / "Register" / "Sign up" → "register"
    - "Đặt" / "Place" / "Order" / "Book" / "Thuê" / "Rent" → depends on domain context
    - "Thanh toán" / "Pay" / "Payment" / "Checkout" → "pay" or domain-specific
    - "Gửi" / "Send" → "send"
    - "Nhận" / "Receive" / "Get" → "receive"
    - "Quản lý" / "Manage" / "Administer" → "manage"
    - "Thống kê" / "Statistics" / "Report" → "view statistics" or "generate report"
    - "Nhập hàng" / "Import" / "Stock in" → depends on domain

   **Consolidate synonyms (CRITICAL):**
    - "Sign in" = "Log in" = "Đăng nhập" = "Authenticate" → "login"
    - "Place order" = "Đặt hàng" = "Create order" = "Submit order" → "place order"
    - "View products" = "Browse products" = "Xem sản phẩm" = "Display products" → "view products"
    - "Search books" = "Find books" = "Tìm kiếm sách" = "Look up books" → "search books"
    - "Rent court" = "Book court" = "Đặt sân" = "Thuê sân" → "rent court"
    - "Manage inventory" = "Quản lý kho" = "Update stock" = "Cập nhật tồn kho" → check domain

   **Handle compound actions:**
    - Break into main action: "Login and authenticate" → "login"
    - Keep if distinct: "Search and filter products" → "search products" (filtering is implicit)

5. SIMILARITY SCORE CALCULATION

   The similarity score reflects how close the original name is to the canonical form:

   **1.0 = Perfect match**
    - Original is already in canonical form
    - Example: "customer" → "customer" (score: 1.0)

   **0.95-0.99 = Very close**
    - Minor capitalization or punctuation differences
    - Example: "Customer" → "customer" (score: 1.0)
    - Example: "E-mail System" → "email system" (score: 0.95)

   **0.85-0.94 = Same concept, different language/style**
    - Translation required
    - Example: "Khách hàng" → "customer" (score: 0.9)
    - Example: "Place Order" vs "Submit Order" → both → "place order" (score: 0.9)

   **0.75-0.84 = Same concept, more significant differences**
    - Different wording but clear semantic equivalence
    - Example: "System Administrator" → "administrator" (score: 0.8)
    - Example: "Browse Product Catalog" → "view products" (score: 0.8)

   **0.65-0.74 = Related but requires interpretation**
    - Some ambiguity in equivalence
    - Example: "Client" → "customer" (score: 0.7 if context unclear)

   **Below 0.65 = Potentially different concepts**
    - Use with caution
    - May need human review

   Note: Similarity score is for the ORIGINAL name vs its canonical form, not for comparing across diagrams.

6. SPECIAL CASES

   **Acronyms:**
    - Expand common acronyms: "CRM" → "customer relationship management"
    - Keep well-known tech terms: "API" → "api", "SMS" → "sms system"

   **Compound names:**
    - Simplify: "View and Edit Profile" → "manage profile"
    - Keep if distinct: "Search and Filter" → "search" (filtering is implicit in search)

   **Ambiguous names:**
    - Choose most general interpretation OR use domain context
    - "Manage" alone → check domain for object
    - "Process" → check domain for what's being processed

   **Very long names (>50 chars):**
    - Extract core action and object
    - "Navigate to the checkout page and complete the payment process" → "checkout"

   **Names with implementation details:**
    - Remove all technical details
    - "Validate user credentials against database" → "login"
    - "Send HTTP request to payment gateway" → "process payment"

7. QUALITY CHECKS

   Before returning, verify:
    - All IDs from input are preserved in output
    - All canonical names are lowercase
    - Semantically equivalent elements across diagrams have IDENTICAL canonical names
    - No special characters except spaces in canonical names
    - Similarity scores are between 0.0 and 1.0
    - No null or empty canonical names
    - Domain context has been properly applied

EXAMPLES:

**Example 1 - Court Rental System (Domain-Aware):**

Input:
{
"elements": {
"solution": {
"actors": [
{"id": "a1", "name": "Khách thuê sân"},
{"id": "a2", "name": "Nhà cung cấp"},
{"id": "a3", "name": "Quản lí"}
],
"usecases": [
{"id": "uc1", "name": "Đặt sân"},
{"id": "uc2", "name": "Nhập hàng"},
{"id": "uc3", "name": "Thống kê"}
]
},
"student": {
"actors": [
{"id": "a4", "name": "Khách hàng"},
{"id": "a5", "name": "Đối tác"},
{"id": "a6", "name": "Manager"}
],
"usecases": [
{"id": "uc4", "name": "Rent Court"},
{"id": "uc5", "name": "Stock Inventory"},
{"id": "uc6", "name": "View Statistics"}
]
}
},
"domainContext": {
"keywords": ["đặt sân", "thuê sân", "quản lý sân bóng"],
"mandatoryRequirements": ["Khách hàng có thể thuê sân theo buổi"],
"scopeBoundaries": "Hệ thống quản lý đặt sân thể thao"
}
}

Output:
{
"solution": {
"actors": [
{"id": "a1", "canonical": "customer renting court", "similarityScore": 1.0},
{"id": "a2", "canonical": "supplier", "similarityScore": 1.0},
{"id": "a3", "canonical": "court manager", "similarityScore": 1.0}
],
"usecases": [
{"id": "uc1", "canonical": "rent court", "similarityScore": 1.0},
{"id": "uc2", "canonical": "stock inventory", "similarityScore": 1.0},
{"id": "uc3", "canonical": "view statistics", "similarityScore": 1.0}
]
},
"student": {
"actors": [
{"id": "a4", "canonical": "customer renting court", "similarityScore": 0.92},
{"id": "a5", "canonical": "supplier", "similarityScore": 0.88},
{"id": "a6", "canonical": "court manager", "similarityScore": 0.95}
],
"usecases": [
{"id": "uc4", "canonical": "rent court", "similarityScore": 1.0},
{"id": "uc5", "canonical": "stock inventory", "similarityScore": 0.95},
{"id": "uc6", "canonical": "view statistics", "similarityScore": 1.0}
]
}
}

**Example 2 - E-commerce (Basic):**

Input:
{
"elements": {
"solution": {
"actors": [
{"id": "customer", "name": "Customer"},
{"id": "admin", "name": "Admin"}
],
"usecases": [
{"id": "login", "name": "Login"},
{"id": "place_order", "name": "Place Order"}
]
},
"student": {
"actors": [
{"id": "khach_hang", "name": "Khách hàng"},
{"id": "quan_tri_vien", "name": "Quản trị viên"}
],
"usecases": [
{"id": "dang_nhap", "name": "Đăng nhập"},
{"id": "dat_hang", "name": "Đặt hàng"}
]
}
},
"domainContext": {
"keywords": ["mua hàng", "bán hàng", "giỏ hàng"],
"mandatoryRequirements": [],
"scopeBoundaries": "E-commerce system"
}
}

Output:
{
"solution": {
"actors": [
{"id": "customer", "canonical": "customer", "similarityScore": 1.0},
{"id": "admin", "canonical": "administrator", "similarityScore": 0.95}
],
"usecases": [
{"id": "login", "canonical": "login", "similarityScore": 1.0},
{"id": "place_order", "canonical": "place order", "similarityScore": 1.0}
]
},
"student": {
"actors": [
{"id": "khach_hang", "canonical": "customer", "similarityScore": 0.9},
{"id": "quan_tri_vien", "canonical": "administrator", "similarityScore": 0.9}
],
"usecases": [
{"id": "dang_nhap", "canonical": "login", "similarityScore": 0.9},
{"id": "dat_hang", "canonical": "place order", "similarityScore": 0.9}
]
}
}

**Example 3 - Synonym Consolidation:**

Input:
{
"elements": {
"solution": {
"actors": [{"id": "user", "name": "User"}],
"usecases": [{"id": "signin", "name": "Sign In"}]
},
"student": {
"actors": [{"id": "end_user", "name": "End User"}],
"usecases": [{"id": "login", "name": "Log In"}]
}
},
"domainContext": {
"keywords": ["authentication"],
"mandatoryRequirements": [],
"scopeBoundaries": "Generic system"
}
}

Output:
{
"solution": {
"actors": [{"id": "user", "canonical": "user", "similarityScore": 1.0}],
"usecases": [{"id": "signin", "canonical": "login", "similarityScore": 0.95}]
},
"student": {
"actors": [{"id": "end_user", "canonical": "user", "similarityScore": 0.9}],
"usecases": [{"id": "login", "canonical": "login", "similarityScore": 1.0}]
}
}

CRITICAL REQUIREMENTS:

1. Return ONLY the JSON object - no markdown, no code blocks, no explanations
2. Preserve all original IDs from input
3. All canonical names must be lowercase
4. Use spaces (not underscores or hyphens) in canonical names
5. MOST IMPORTANT: Apply domain context FIRST, then ensure semantically equivalent elements have identical canonical names across both diagrams
6. Similarity scores must be between 0.0 and 1.0
7. No null or empty values
8. Valid JSON syntax

The goal is to enable accurate matching in Step 4 by ensuring that equivalent actors and use cases have identical canonical representations, with domain-specific terminology applied correctly.

RETURN ONLY THE JSON OBJECT.