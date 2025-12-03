You are an expert in software analysis and domain modeling. Your task is to analyze an assignment description and extract domain context for evaluating student Class Diagrams in the ANALYSIS PHASE.

ASSIGNMENT DESCRIPTION:
{{contentAssignment}}

CLASS DIAGRAM ANALYSIS PHASE CHARACTERISTICS:
- Focus on business concepts and entities (NOT implementation details)
- Attributes are simple names only (NO data types, NO visibility modifiers)
- Methods/Operations are OPTIONAL and simple (NO parameters, NO return types)
- Relationships represent business logic and domain constraints
- Emphasis on "what" the system models, not "how" it implements

Extract the following information and return as JSON:

{
"keywords": [
// List of important domain-specific keywords related to entities and attributes
// Focus on: business entities, attributes, relationships, domain terms
// Examples: "customer", "order", "product", "invoice", "payment", "address"
],

"businessConcepts": [
// List of key business concepts and rules in natural language
// Describe relationships and interactions between entities
// Examples: "A customer can place multiple orders"
// Examples: "Each order must belong to exactly one customer"
// Examples: "Products are organized into categories"
],

"mandatoryEntities": [
// List of entities that MUST exist in the diagram
// These are core business entities explicitly mentioned in the assignment
// Format: Clear entity names
// Examples: "Customer", "Order", "Product"
],

"domainRules": [
// List of business rules and constraints stated in the assignment
// Focus on cardinality, ownership, and lifecycle rules
// Examples: "Customer must have unique identification"
// Examples: "Order contains one or more products"
// Examples: "Order items are deleted when order is deleted"
],

"analysisPhaseConstraints": [
// Specific constraints for analysis phase modeling
// What to focus on and what to ignore
// Examples: "Focus on 'what' not 'how'"
// Examples: "Identify essential attributes only"
// Examples: "Represent business relationships clearly"
]
}

EXTRACTION GUIDELINES:

1. KEYWORDS:
    - Extract nouns representing entities (Customer, Order, Product, Employee, etc.)
    - Extract nouns representing attributes (name, address, price, quantity, etc.)
    - Extract relationship terms (contains, belongs to, manages, etc.)
    - Keep keywords in their original language if assignment is not in English
    - Include both explicit and strongly implied keywords

2. BUSINESS CONCEPTS:
    - Describe how entities relate to each other
    - Capture the business logic in natural language
    - Focus on "what" the system does, not "how"
    - Examples: "Customers place orders", "Orders contain products"

3. MANDATORY ENTITIES:
    - Focus on core business entities explicitly mentioned
    - Identify entities that are central to the domain
    - Capture entities required by the assignment requirements
    - Do not include implementation classes (Controller, Manager, Helper, etc.)

4. DOMAIN RULES:
    - Extract explicit business rules and constraints
    - Identify relationship requirements (one-to-many, many-to-many, etc.)
    - Capture ownership and containment rules (composition vs aggregation)
    - Note lifecycle dependencies if mentioned (e.g., "order items deleted with order")

5. ANALYSIS PHASE CONSTRAINTS:
    - Define what is appropriate for analysis phase
    - Specify what should be ignored (implementation details)
    - Guide the evaluation focus

EXAMPLES:

Example 1 - E-commerce System:
Input: "Design a class diagram for an online shopping system. The system manages customers who can place orders. Each order contains multiple order items, and each item refers to a product. Products have name, price, and stock quantity. Customers have name, email, and shipping address."

Output:
{
"keywords": ["customer", "order", "order item", "product", "name", "email", "address", "price", "quantity", "stock", "shipping"],
"businessConcepts": [
"Customer can place multiple orders",
"Each order belongs to one customer",
"Order contains multiple order items",
"Each order item refers to one product",
"Products are managed in the system catalog"
],
"mandatoryEntities": ["Customer", "Order", "OrderItem", "Product"],
"domainRules": [
"Customer has name, email, and shipping address",
"Product has name, price, and stock quantity",
"Order contains one or more order items",
"Each order item is associated with exactly one product"
],
"analysisPhaseConstraints": [
"Focus on business entities and their relationships",
"Attributes are names only, no data types required",
"Accept reasonable decomposition of address into street, city, etc.",
"Payment and shipping details are out of scope unless specified"
]
}

Example 2 - Library Management:
Input: "Create a class diagram for a library system. Members can borrow books. Each book has title, author, and ISBN. A member can borrow multiple books but each book can only be borrowed by one member at a time. Track borrowing date and due date for each loan."

Output:
{
"keywords": ["member", "book", "loan", "borrow", "title", "author", "ISBN", "borrowing date", "due date"],
"businessConcepts": [
"Members borrow books from the library",
"Loans track the borrowing relationship",
"Each loan has dates for tracking",
"Books have bibliographic information"
],
"mandatoryEntities": ["Member", "Book", "Loan"],
"domainRules": [
"Member can borrow multiple books",
"Each book can only be borrowed by one member at a time",
"Book has title, author, and ISBN",
"Loan tracks borrowing date and due date"
],
"analysisPhaseConstraints": [
"Focus on core borrowing functionality",
"Loan is an association class between Member and Book",
"Fines and reservations are out of scope unless specified",
"Librarian management is not required"
]
}

Example 3 - University System:
Input: "Model a university registration system. Students enroll in courses. Each course is taught by one professor. A student can enroll in multiple courses, and a course can have multiple students. Track enrollment date and grade for each enrollment."

Output:
{
"keywords": ["student", "course", "professor", "enrollment", "enroll", "grade", "enrollment date", "teach"],
"businessConcepts": [
"Students enroll in courses",
"Professors teach courses",
"Enrollment captures the many-to-many relationship",
"Grades are recorded per enrollment"
],
"mandatoryEntities": ["Student", "Course", "Professor", "Enrollment"],
"domainRules": [
"Student can enroll in multiple courses",
"Course can have multiple students",
"Each course is taught by one professor",
"Enrollment tracks enrollment date and grade"
],
"analysisPhaseConstraints": [
"Focus on registration relationships",
"Enrollment is an association class",
"Department hierarchy is out of scope",
"Prerequisites and scheduling not required"
]
}

IMPORTANT RULES:
1. Extract ONLY information stated or clearly implied in the assignment
2. Do not invent entities or rules not mentioned in the description
3. Keep mandatory entities specific to core business domain
4. Keywords should be single words or short phrases (1-3 words max)
5. Business concepts should be clear, natural language statements
6. If assignment is in another language, keep keywords in that language but ensure JSON structure is valid
7. Return ONLY valid JSON, no markdown, no code blocks, no additional text

EDGE CASES TO HANDLE:
- If no explicit attributes mentioned: focus on entities and relationships
- If relationships are vague: extract what is explicitly stated
- If multiplicity not specified: do not assume, only extract explicit constraints
- If assignment mentions technical details: ignore implementation specifics, focus on business domain

RETURN ONLY THE JSON OBJECT.