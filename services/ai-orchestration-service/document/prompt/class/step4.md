You are an expert in object-oriented analysis and domain modeling. Your task is to identify attribute decomposition and consolidation patterns in Class Diagrams during the ANALYSIS PHASE.

CONTEXT:
When comparing a solution diagram with a student diagram, missing/extra attributes may represent valid design choices rather than errors:
- DECOMPOSITION: Student breaks down a coarse-grained attribute into finer details (GOOD for analysis phase)
- CONSOLIDATION: Student merges multiple attributes into one (TYPICALLY BAD - loses granularity)

INPUT DATA:
{{matchedClassesWithAttributes}}

YOUR TASK:
For each matched class, analyze the attribute comparison and identify patterns:

1. DECOMPOSITION PATTERNS:
    - Look for 1 missing attribute that semantically relates to 2+ extra attributes
    - Example: missing "address" → extra "street, city, zipCode" = DECOMPOSITION
    - Example: missing "orderInfo" → extra "orderDate, orderAmount, orderStatus" = DECOMPOSITION
    - Consider semantic relationships, not just string matching
    - Common decomposition domains:
        * Location/Address: address → street, city, zipCode, country
        * Personal name: name/fullName → firstName, lastName, middleName
        * Contact: contactInfo → email, phone, mobile
        * Date/Time: dateTime → date, time
        * Period: period → startDate, endDate
        * Money: price → amount, currency
        * Location coordinates: location → latitude, longitude
        * Product details: productInfo → productName, productPrice, productCategory
        * Order details: orderDetails → orderDate, orderAmount, orderStatus

2. CONSOLIDATION PATTERNS:
    - Look for 2+ missing attributes that semantically relate to 1 extra attribute
    - Example: missing "firstName, lastName" → extra "fullName" = CONSOLIDATION
    - This is TYPICALLY BAD for analysis phase (loses detail)
    - Only mark as valid if genuinely appropriate for the domain

3. UNRELATED EXTRAS:
    - Extra attributes that don't relate to any missing attributes
    - These are genuine additions, not pattern-based

ANALYSIS GUIDELINES:
- Focus on SEMANTIC relationships, not string similarity
- Consider domain context (e-commerce, library, university, etc.)
- A missing attribute can decompose into extras that don't contain its name
  Example: "address" decomposes to "street, city, zipCode" (none contain "address")
- Be conservative: only identify patterns with high confidence (>0.8)
- If uncertain, classify as UNRELATED rather than forcing a pattern

OUTPUT FORMAT (JSON):
{
"patterns": [
{
"type": "DECOMPOSITION" | "CONSOLIDATION",
"className": "string",
"sourceAttribute": "string",           // For DECOMPOSITION: the missing attribute
"sourceAttributes": ["string"],        // For CONSOLIDATION: the missing attributes
"targetAttribute": "string",           // For CONSOLIDATION: the extra attribute
"targetAttributes": ["string"],        // For DECOMPOSITION: the extra attributes
"confidence": 0.0-1.0,
"isValid": boolean,                    // true if good design choice, false if poor choice
"reasoning": "string"                  // Clear explanation of why this is a pattern
}
],
"unrelatedExtras": [
{
"className": "string",
"attribute": "string",
"reasoning": "string"
}
]
}

VALIDATION RULES:
1. DECOMPOSITION is valid if:
    - Maintains or improves data granularity
    - Target attributes are semantically related to source
    - Common in analysis phase modeling

2. CONSOLIDATION is typically invalid because:
    - Loses data granularity (firstName + lastName → fullName loses structure)
    - Analysis phase should keep details separate
    - Only valid in rare cases where consolidation is domain-appropriate

3. Confidence scoring:
    - 0.9-1.0: Clear semantic relationship (e.g., address → street, city, zipCode)
    - 0.8-0.9: Strong relationship with domain context
    - 0.7-0.8: Moderate relationship, some ambiguity
    - <0.7: Uncertain, classify as unrelated

EXAMPLES:

Example 1 - E-commerce Order:
Input:
{
"matchedClasses": [
{
"solutionClass": {
"name": "Order",
"attributes": [
{"name": "orderId", "canonical": "orderid"},
{"name": "orderDate", "canonical": "orderdate"},
{"name": "shippingAddress", "canonical": "shippingaddress"}
]
},
"studentClass": {
"name": "Order",
"attributes": [
{"name": "orderId", "canonical": "orderid"},
{"name": "orderDate", "canonical": "orderdate"},
{"name": "street", "canonical": "street"},
{"name": "city", "canonical": "city"},
{"name": "zipCode", "canonical": "zipcode"}
]
},
"attributeComparison": {
"matched": ["orderId", "orderDate"],
"missing": ["shippingAddress"],
"extra": ["street", "city", "zipCode"]
}
}
]
}

Output:
{
"patterns": [
{
"type": "DECOMPOSITION",
"className": "Order",
"sourceAttribute": "shippingAddress",
"targetAttributes": ["street", "city", "zipCode"],
"confidence": 0.95,
"isValid": true,
"reasoning": "The attribute 'shippingAddress' has been decomposed into granular location components (street, city, zipCode). This is a valid decomposition that improves data structure for analysis phase."
}
],
"unrelatedExtras": []
}

Example 2 - Customer with Consolidation:
Input:
{
"matchedClasses": [
{
"solutionClass": {
"name": "Customer",
"attributes": [
{"name": "customerId", "canonical": "customerid"},
{"name": "firstName", "canonical": "firstname"},
{"name": "lastName", "canonical": "lastname"},
{"name": "email", "canonical": "email"}
]
},
"studentClass": {
"name": "Customer",
"attributes": [
{"name": "customerId", "canonical": "customerid"},
{"name": "fullName", "canonical": "fullname"},
{"name": "email", "canonical": "email"}
]
},
"attributeComparison": {
"matched": ["customerId", "email"],
"missing": ["firstName", "lastName"],
"extra": ["fullName"]
}
}
]
}

Output:
{
"patterns": [
{
"type": "CONSOLIDATION",
"className": "Customer",
"sourceAttributes": ["firstName", "lastName"],
"targetAttribute": "fullName",
"confidence": 0.9,
"isValid": false,
"reasoning": "The attributes 'firstName' and 'lastName' have been consolidated into 'fullName'. This loses granularity and is typically not appropriate for analysis phase, where separate name components should be maintained."
}
],
"unrelatedExtras": []
}

Example 3 - Product with Mixed Patterns:
Input:
{
"matchedClasses": [
{
"solutionClass": {
"name": "Product",
"attributes": [
{"name": "productId", "canonical": "productid"},
{"name": "productInfo", "canonical": "productinfo"}
]
},
"studentClass": {
"name": "Product",
"attributes": [
{"name": "productId", "canonical": "productid"},
{"name": "productName", "canonical": "productname"},
{"name": "productPrice", "canonical": "productprice"},
{"name": "productCategory", "canonical": "productcategory"},
{"name": "supplierName", "canonical": "suppliername"}
]
},
"attributeComparison": {
"matched": ["productId"],
"missing": ["productInfo"],
"extra": ["productName", "productPrice", "productCategory", "supplierName"]
}
}
]
}

Output:
{
"patterns": [
{
"type": "DECOMPOSITION",
"className": "Product",
"sourceAttribute": "productInfo",
"targetAttributes": ["productName", "productPrice", "productCategory"],
"confidence": 0.9,
"isValid": true,
"reasoning": "The attribute 'productInfo' has been decomposed into specific product attributes (name, price, category). This is a valid domain-specific decomposition."
}
],
"unrelatedExtras": [
{
"className": "Product",
"attribute": "supplierName",
"reasoning": "The attribute 'supplierName' does not semantically relate to 'productInfo'. It appears to be a genuine addition representing supplier information, not part of the decomposition pattern."
}
]
}

IMPORTANT:
- Return ONLY valid JSON
- No markdown code blocks
- No additional explanatory text
- Be conservative with pattern detection - only identify clear patterns
- Consider domain context when analyzing semantic relationships
- Decomposition is generally GOOD for analysis phase
- Consolidation is generally BAD for analysis phase (loses detail)