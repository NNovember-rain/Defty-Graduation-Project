You are an expert in software analysis and domain modeling. Your task is to analyze an assignment description and extract domain context for evaluating student Class Diagrams in the ANALYSIS PHASE.

ASSIGNMENT DESCRIPTION:
{{contentAssignment}}

ANALYSIS PHASE CHARACTERISTICS:
- Focus on business concepts and entities (NOT implementation details)
- Attributes are simple (NO data types, NO visibility modifiers)
- Methods/Operations are OPTIONAL and simple
- Relationships represent business logic
- NO technical implementation concerns

Extract the following information and return as JSON:

{
"keywords": [
// List of important domain-specific keywords (nouns, entities)
// Examples: "Customer", "Order", "Product", "Invoice", "Payment"
],

"businessConcepts": [
// List of key business concepts and rules in natural language
// Examples: "A customer can place multiple orders"
// Examples: "Each order must belong to exactly one customer"
],

"mandatoryEntities": [
// List of entities that MUST exist in the diagram
// These are core business entities mentioned in the assignment
// Examples: "Customer", "Order", "Product"
],

"domainRules": [
// List of business rules and constraints
// Examples: "Customer must have unique identification"
// Examples: "Order contains one or more products"
// Examples: "Payment is associated with an order"
],

"analysisPhaseConstraints": [
// Specific constraints for analysis phase modeling
// Examples: "Focus on 'what' not 'how'"
// Examples: "Identify essential attributes only"
// Examples: "Represent business relationships clearly"
]
}

IMPORTANT RULES:
1. Extract ONLY information explicitly stated or strongly implied in the assignment
2. Focus on BUSINESS DOMAIN concepts, not technical implementation
3. Identify mandatory entities based on assignment requirements
4. Keep it concise and relevant to Class Diagram modeling
5. Return ONLY valid JSON, no additional text

RETURN ONLY THE JSON OBJECT.
```

---

## 🔧 **PROMPT 2: PlantUML Extractor**

**Type:** `class-plantuml-extractor`

**Purpose:** Extract Class Diagram elements from PlantUML code to structured JSON

**Template:**
```
You are an expert in PlantUML and UML Class Diagram notation. Your task is to extract structured information from TWO PlantUML Class Diagrams (solution and student) and convert them to JSON format suitable for ANALYSIS PHASE evaluation.

DOMAIN CONTEXT:
{{domainContext}}

SOLUTION PLANTUML CODE:
{{solutionPlantUmlCode}}

STUDENT PLANTUML CODE:
{{studentPlantUmlCode}}

ANALYSIS PHASE EXTRACTION RULES:
1. Extract class names (ignore stereotypes like <<entity>> if present)
2. Extract attributes - NAMES ONLY (ignore types, visibility, static modifiers)
3. Extract operations/methods - NAMES ONLY if present (OPTIONAL in analysis phase)
4. Extract all relationships with multiplicity
5. Normalize different PlantUML syntaxes to standard format

RELATIONSHIP TYPES TO EXTRACT:
- Association: --> or -- (with multiplicity)
- Aggregation: o-- or --o (hollow diamond, "has-a" relationship, part can exist independently)
- Composition: *-- or --* (filled diamond, "contains", part cannot exist without whole)
- Generalization/Inheritance: --|> or <|-- (parent-child, "is-a" relationship)

MULTIPLICITY NOTATION:
- "1" = exactly one
- "0..1" = zero or one
- "1..*" or "1..n" = one or many
- "0..*" or "*" = zero or many

Return the following JSON structure:

{
"solution": {
"classes": [
{
"id": "unique_identifier",  // Use class name as ID
"name": "ClassName",
"stereotype": "entity" | "boundary" | "control" | null,  // Optional
"attributes": [
{
"name": "attributeName"
// NO type, NO visibility in analysis phase
}
],
"operations": [  // OPTIONAL - may be empty array
{
"name": "operationName"
// NO parameters, NO return type in analysis phase
}
]
}
],
"relationships": {
"associations": [
{
"from": "ClassA_id",
"to": "ClassB_id",
"fromLabel": "role1",  // Optional
"toLabel": "role2",    // Optional
"fromMultiplicity": {
"min": "1",
"max": "1"
},
"toMultiplicity": {
"min": "0",
"max": "*"
}
}
],
"aggregations": [
{
"whole": "ContainerClass_id",  // Class with hollow diamond
"part": "PartClass_id",
"wholeMultiplicity": {
"min": "1",
"max": "1"
},
"partMultiplicity": {
"min": "0",
"max": "*"
}
}
],
"compositions": [
{
"composite": "WholeClass_id",  // Class with filled diamond
"component": "PartClass_id",
"compositeMultiplicity": {
"min": "1",
"max": "1"
},
"componentMultiplicity": {
"min": "1",
"max": "*"
}
}
],
"generalizations": [
{
"parent": "ParentClass_id",
"child": "ChildClass_id"
}
]
}
},
"student": {
// Same structure as solution
}
}

CRITICAL RULES:
1. Use class names as IDs (consistent naming)
2. Handle different PlantUML syntax variations correctly
3. Extract multiplicity accurately (default is "1" if not specified)
4. Distinguish between aggregation (o--) and composition (*--)
5. For analysis phase: IGNORE implementation details (private/public, data types, method signatures)
6. If a class has no attributes or operations, use empty arrays
7. Preserve relationship labels/roles if present

RETURN ONLY THE JSON OBJECT, NO ADDITIONAL TEXT.