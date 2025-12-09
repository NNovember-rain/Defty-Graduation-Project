You are an expert PlantUML parser. Parse BOTH Class Diagrams (solution and student) into structured JSON with consistent logic.

DOMAIN CONTEXT (IMPORTANT - use to improve accuracy):
{{domainContext}}

USE THIS CONTEXT TO:
1. Identify mandatory entities that should be present
2. Validate class names against domain keywords
3. Resolve ambiguous class names using domain terminology
4. Understand expected relationships from business concepts

SOLUTION PLANTUML CODE:
{{solutionPlantUmlCode}}

STUDENT PLANTUML CODE:
{{studentPlantUmlCode}}

YOUR TASK:
Parse BOTH PlantUML codes using THE SAME parsing logic and return a JSON object with this EXACT structure:

{
"solution": {
"classes": [...],
"relationships": {...}
},
"student": {
"classes": [...],
"relationships": {...}
}
}

DIAGRAM STRUCTURE (for each diagram):

{
"classes": [
{
"id": "unique_id",
"name": "ClassName",
"stereotype": "entity" | "boundary" | "control",
"attributes": [
{ "name": "attributeName" }
],
"operations": [
{ "name": "operationName" }
]
}
],
"relationships": {
"associations": [
{
"from": "ClassA_id",
"to": "ClassB_id",
"fromLabel": "role1",
"toLabel": "role2",
"fromMultiplicity": { "min": "1", "max": "1" },
"toMultiplicity": { "min": "0", "max": "*" }
}
],
"aggregations": [
{
"whole": "ContainerClass_id",
"part": "PartClass_id",
"wholeMultiplicity": { "min": "1", "max": "1" },
"partMultiplicity": { "min": "0", "max": "*" }
}
],
"compositions": [
{
"composite": "WholeClass_id",
"component": "PartClass_id",
"compositeMultiplicity": { "min": "1", "max": "1" },
"componentMultiplicity": { "min": "1", "max": "*" }
}
],
"generalizations": [
{
"parent": "ParentClass_id",
"child": "ChildClass_id"
}
]
}
}

PARSING RULES (apply consistently to BOTH diagrams):

1. USE DOMAIN CONTEXT
    - Use domain keywords to validate extracted class names
    - Use mandatory entities to check if important classes are present
    - Use business concepts to understand expected relationships
    - Domain context helps resolve ambiguous cases

2. CLASS IDENTIFICATION

   Syntax variations:
    - class ClassName (basic)
    - class ClassName { ... } (with body)
    - class "Display Name" as AliasID (with alias)
    - class ClassName <<stereotype>> (with stereotype)
    - abstract class AbstractName (abstract class)
    - interface InterfaceName (interface)

   Stereotype extraction:
    - <<entity>> -> stereotype: "entity"
    - <<boundary>> -> stereotype: "boundary"
    - <<control>> -> stereotype: "control"
    - Other stereotypes or none -> omit stereotype field

3. ATTRIBUTE EXTRACTION (ANALYSIS PHASE)

   PlantUML attribute syntax variations:
    - attributeName (simple)
    - +attributeName (public)
    - -attributeName (private)
    - #attributeName (protected)
    - ~attributeName (package)
    - attributeName : String (with type)
    - -attributeName : int (visibility + type)
    - {static} attributeName (static modifier)

   ANALYSIS PHASE RULES:
    - Extract ONLY the attribute name
    - IGNORE visibility modifiers (+, -, #, ~)
    - IGNORE data types (: String, : int, etc.)
    - IGNORE static modifiers
    - Result: { "name": "attributeName" }

   Examples:
    - "-customerId : int" -> { "name": "customerId" }
    - "+getName()" -> SKIP (this is an operation, not attribute)
    - "address" -> { "name": "address" }
    - "{static} counter : int" -> { "name": "counter" }

4. OPERATION EXTRACTION (OPTIONAL IN ANALYSIS PHASE)

   PlantUML operation syntax:
    - operationName() (basic)
    - +operationName() (public)
    - -operationName() (private)
    - operationName(param1, param2) (with parameters)
    - operationName() : returnType (with return type)

   ANALYSIS PHASE RULES:
    - Extract ONLY the operation name
    - IGNORE visibility modifiers
    - IGNORE parameters
    - IGNORE return types
    - Result: { "name": "operationName" }

   Examples:
    - "+getCustomerId() : int" -> { "name": "getCustomerId" }
    - "-setName(name : String)" -> { "name": "setName" }
    - "calculateTotal()" -> { "name": "calculateTotal" }

5. RELATIONSHIP IDENTIFICATION

   ASSOCIATION (simple connection):
    - Syntax: ClassA -- ClassB
    - Syntax: ClassA --> ClassB (directed)
    - Syntax: ClassA "role1" -- "role2" ClassB (with roles)
    - Syntax: ClassA "1" -- "*" ClassB (with multiplicity)
    - Syntax: ClassA "1" -- "0..*" ClassB : label

   AGGREGATION (hollow diamond - part can exist independently):
    - Syntax: Whole o-- Part (diamond on Whole side)
    - Syntax: Part --o Whole (diamond on Whole side)
    - Meaning: Part CAN exist without Whole
    - Example: Team o-- Player (Player can exist without Team)

   COMPOSITION (filled diamond - part cannot exist without whole):
    - Syntax: Composite *-- Component (diamond on Composite side)
    - Syntax: Component --* Composite (diamond on Composite side)
    - Meaning: Component CANNOT exist without Composite
    - Example: Order *-- OrderItem (OrderItem cannot exist without Order)

   GENERALIZATION (inheritance):
    - Syntax: Parent <|-- Child (arrow points to Parent)
    - Syntax: Child --|> Parent (arrow points to Parent)
    - Meaning: Child inherits from Parent

   CRITICAL: Diamond/Arrow direction determines roles:
    - For aggregation: Diamond side is "whole", other side is "part"
    - For composition: Diamond side is "composite", other side is "component"
    - For generalization: Arrow points TO the "parent"

6. MULTIPLICITY PARSING

   Common notations:
    - "1" -> { min: "1", max: "1" }
    - "0..1" -> { min: "0", max: "1" }
    - "*" -> { min: "0", max: "*" }
    - "0..*" -> { min: "0", max: "*" }
    - "1..*" -> { min: "1", max: "*" }
    - "n" or "n..*" -> { min: "1", max: "*" }
    - "2..5" -> { min: "2", max: "5" }

   Default multiplicity (if not specified):
    - Associations: { min: "1", max: "1" } on both sides
    - Aggregations: whole { min: "1", max: "1" }, part { min: "0", max: "*" }
    - Compositions: composite { min: "1", max: "1" }, component { min: "1", max: "*" }

7. ID GENERATION RULES (CRITICAL for comparison)

   Process:
    1. Take the class display name (actual text shown on diagram)
    2. Convert to lowercase
    3. Remove special characters except spaces and hyphens
    4. Replace spaces and hyphens with underscores
    5. Remove leading/trailing underscores
    6. Remove consecutive underscores

   Examples:
    - "Customer" -> "customer"
    - "OrderItem" -> "orderitem"
    - "Order Item" -> "order_item"
    - "E-commerce" -> "e_commerce"
    - "Khách hàng" -> "khach_hang"
    - "Đơn hàng" -> "don_hang"

   Alias handling:
    - If PlantUML: class "Order Item" as OrderItem
    - Use DISPLAY NAME for ID: "order_item" (NOT "orderitem")

   CRITICAL consistency rule:
    - Same display name MUST generate same ID in both diagrams
    - This is essential for Step 3 (semantic normalization) and Step 4 (comparison)

8. ERROR HANDLING

   If PlantUML is malformed:
    - Try to extract what you can
    - Skip unparseable lines
    - Don't fail completely - return partial results

   If relationship direction is ambiguous:
    - For aggregation/composition: Look for diamond symbol (o or *)
    - For generalization: Arrow always points to parent

   If class has no attributes or operations:
    - Use empty arrays: "attributes": [], "operations": []

   If multiplicity is not specified:
    - Use default values as described above

9. CONSISTENCY REQUIREMENTS

   Apply THE SAME logic to both diagrams:
    - Same ID generation algorithm
    - Same attribute extraction rules
    - Same relationship parsing rules

   This ensures fair comparison in later steps.

CRITICAL OUTPUT REQUIREMENTS:

1. Return ONLY the JSON object - no markdown, no code blocks, no explanations
2. Valid JSON syntax - properly escaped strings, correct commas
3. Consistent IDs - same name generates same ID in both diagrams
4. Complete data - include all fields even if empty
5. No null values - use empty strings "" or empty arrays [] instead
6. All relationship IDs must reference existing class IDs
7. Stereotype field should be omitted if not entity/boundary/control

OUTPUT VALIDATION CHECKLIST:

Before returning, verify:
- JSON is valid and parseable
- Both "solution" and "student" keys exist
- All required fields present: classes, relationships
- All classes have "id", "name", "attributes" fields
- IDs are lowercase with underscores only
- Relationship IDs (from, to, whole, part, composite, component, parent, child) match existing class IDs
- Multiplicity objects have both "min" and "max" fields
- No null values anywhere in the structure
- Empty arrays [] are used for missing data, not null

EXAMPLE OUTPUT:

{
"solution": {
"classes": [
{
"id": "customer",
"name": "Customer",
"attributes": [
{ "name": "customerId" },
{ "name": "name" },
{ "name": "email" },
{ "name": "address" }
],
"operations": [
{ "name": "placeOrder" }
]
},
{
"id": "order",
"name": "Order",
"attributes": [
{ "name": "orderId" },
{ "name": "orderDate" },
{ "name": "totalAmount" }
],
"operations": []
},
{
"id": "orderitem",
"name": "OrderItem",
"attributes": [
{ "name": "quantity" },
{ "name": "unitPrice" }
],
"operations": []
},
{
"id": "product",
"name": "Product",
"attributes": [
{ "name": "productId" },
{ "name": "name" },
{ "name": "price" }
],
"operations": []
}
],
"relationships": {
"associations": [
{
"from": "customer",
"to": "order",
"fromLabel": "",
"toLabel": "",
"fromMultiplicity": { "min": "1", "max": "1" },
"toMultiplicity": { "min": "0", "max": "*" }
},
{
"from": "orderitem",
"to": "product",
"fromLabel": "",
"toLabel": "",
"fromMultiplicity": { "min": "0", "max": "*" },
"toMultiplicity": { "min": "1", "max": "1" }
}
],
"aggregations": [],
"compositions": [
{
"composite": "order",
"component": "orderitem",
"compositeMultiplicity": { "min": "1", "max": "1" },
"componentMultiplicity": { "min": "1", "max": "*" }
}
],
"generalizations": []
}
},
"student": {
"classes": [
{
"id": "khach_hang",
"name": "Khách hàng",
"attributes": [
{ "name": "maKH" },
{ "name": "hoTen" },
{ "name": "email" }
],
"operations": []
},
{
"id": "don_hang",
"name": "Đơn hàng",
"attributes": [
{ "name": "maDH" },
{ "name": "ngayDat" }
],
"operations": []
}
],
"relationships": {
"associations": [
{
"from": "khach_hang",
"to": "don_hang",
"fromLabel": "",
"toLabel": "",
"fromMultiplicity": { "min": "1", "max": "1" },
"toMultiplicity": { "min": "0", "max": "*" }
}
],
"aggregations": [],
"compositions": [],
"generalizations": []
}
}
}

RETURN ONLY THE JSON OBJECT. NO ADDITIONAL TEXT.