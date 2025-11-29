You are an expert in domain modeling and semantic analysis. Your task is to normalize class names and attribute names from TWO Class Diagrams (solution and student) to enable accurate semantic matching.

ELEMENTS TO NORMALIZE:
{{elements}}

YOUR TASK:
For each class and its attributes in both diagrams:
1. Generate a CANONICAL name (standardized form)
2. Calculate a SIMILARITY SCORE (0.0 to 1.0)

NORMALIZATION RULES:

FOR CLASS NAMES:
- Convert to lowercase for comparison
- Remove common prefixes/suffixes: "Entity", "Class", "Model", "Info", "Data"
- Handle synonyms: "Customer" ≈ "Client", "User" ≈ "Person" (context-dependent)
- Handle singular/plural: "Product" ≈ "Products"
- Handle abbreviations: "Cust" ≈ "Customer", "Prod" ≈ "Product"
- Compound words: "OrderItem" ≈ "Order_Item" ≈ "Order Item"

FOR ATTRIBUTE NAMES:
- Convert to lowercase for comparison
- Remove common prefixes: "attr", "field", "m_", "_"
- Handle synonyms: "name" ≈ "fullName" ≈ "customerName" (context-dependent)
- Handle different naming conventions: "customer_id" ≈ "customerId" ≈ "CustomerID"
- Consider parent class context: "id" in "Customer" ≈ "customerId" in "Order"

SIMILARITY SCORE GUIDELINES:
- 1.0 = Identical (same canonical form)
- 0.9-0.99 = Very similar (minor differences, clear match)
- 0.8-0.89 = Similar (synonyms, different naming style)
- 0.7-0.79 = Somewhat similar (partial match, may need review)
- < 0.7 = Not similar (different concepts)

Return the following JSON structure:

{
"solution": {
"classes": [
{
"id": "ClassName_from_input",
"canonical": "standardized_class_name",
"similarityScore": 1.0,  // Self-similarity is always 1.0
"attributes": [
{
"name": "attributeName_from_input",
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
"id": "ClassName_from_input",
"canonical": "standardized_class_name",
"similarityScore": 0.95,  // Similarity to its canonical form
"attributes": [
{
"name": "attributeName_from_input",
"canonical": "standardized_attribute_name",
"similarityScore": 0.9
}
]
}
]
}
}

EXAMPLES:

Input: "Customer" → canonical: "customer", similarity: 1.0
Input: "Customers" → canonical: "customer", similarity: 0.95
Input: "Client" → canonical: "customer", similarity: 0.85
Input: "CustomerEntity" → canonical: "customer", similarity: 0.95

Input: "customer_name" → canonical: "customername", similarity: 1.0
Input: "customerName" → canonical: "customername", similarity: 1.0
Input: "name" (in Customer class) → canonical: "customername", similarity: 0.9
Input: "fullName" → canonical: "customername", similarity: 0.85

CRITICAL RULES:
1. Canonical forms should be lowercase, no spaces, no special characters
2. Focus on SEMANTIC meaning, not just string similarity
3. Consider domain context when determining synonyms
4. Be consistent: same input should always produce same canonical form
5. Similarity score reflects semantic closeness for matching purposes

RETURN ONLY THE JSON OBJECT, NO ADDITIONAL TEXT.