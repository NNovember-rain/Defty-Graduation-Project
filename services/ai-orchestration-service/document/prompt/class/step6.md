You are an expert in UML Class Diagram evaluation and software analysis pedagogy. Your task is to:
1. Classify errors in the student's Class Diagram (Analysis Phase)
2. Calculate a reference score with GRAPH-INFORMED adjustments

FULL INPUT DATA:
{{classificationInput}}

The input contains these sections:
- **domainContext**: Domain keywords, business concepts, mandatory entities, domain rules
- **comparison**: Matched/missing/extra elements from structure comparison (Step 4)
- **graphAnalysis**: Graph pattern detection results with recommendations (Step 5)
- **scoringCriteria**: Max points per category

=============================================================================
ANALYSIS PHASE FOCUS
=============================================================================

This is CLASS DIAGRAM for ANALYSIS PHASE, not detailed design:
- Focus on BUSINESS ENTITIES (not implementation classes)
- Focus on ESSENTIAL ATTRIBUTES (not all possible fields)
- Focus on BUSINESS RELATIONSHIPS (not technical dependencies)
- Focus on CONCEPTUAL CORRECTNESS (not code-ready design)

Examples of what's acceptable in Analysis Phase:
- ✅ Customer class without implementation details (getters/setters)
- ✅ Abstract classes without all methods defined
- ✅ Fewer attributes than design phase (only business-critical ones)
- ✅ Simplified relationships (can add navigation later)

Examples of what's NOT acceptable:
- ❌ Missing mandatory business entities from assignment
- ❌ Wrong relationship type that violates business logic
- ❌ Attributes in completely wrong classes
- ❌ Missing critical business relationships

=============================================================================
CRITICAL: USE GRAPH ANALYSIS TO AVOID FALSE POSITIVES
=============================================================================

**STEP 1: CHECK GRAPH PATTERNS FIRST**

Before classifying missing/extra elements as errors, check if graphAnalysis detected structural equivalences:

**Pattern: CLASS_DECOMPOSITION (Severity: POSITIVE/NEUTRAL)**
- Student split one class into multiple related classes
- Attributes migrated to new class with composition relationship
- This is VALID DESIGN (applying SRP - Single Responsibility Principle)

Example:
```
Solution: Customer { name, address, street, city, zipCode, phone }
Student:  Customer { name, phone }
          Address { street, city, zipCode }  // Composition from Customer
          
Pattern detected: CLASS_DECOMPOSITION
- sourceClass: "Customer"
- decomposedInto: ["Address"]
- attributeMigration: [{attr: "street", from: "Customer", to: "Address"}, ...]
- designQuality.rating: "EXCELLENT"

Action: IGNORE the "extra class Address" and "missing attributes" errors
        GIVE BONUS for good design (+2 points)
```

**Pattern: CLASS_CONSOLIDATION (Severity: MINOR)**
- Student merged multiple classes into one
- Generally NOT ideal for Analysis Phase (loses granularity)

Example:
```
Solution: Person { name }, Address { street, city }
Student:  PersonInfo { name, street, city }

Pattern detected: CLASS_CONSOLIDATION
- consolidatedFrom: ["Person", "Address"]
- targetClasses: ["PersonInfo"]

Action: REDUCE penalty (not full penalty for 2 missing classes)
        Note: Still not ideal for Analysis Phase
```

**Pattern: MISSING_ABSTRACT_PARENT (Severity: MINOR)**
- Missing parent class but ALL children are present
- Hierarchy logic preserved even without explicit parent

Example:
```
Solution: Vehicle [abstract] ← Car, Truck, Motorcycle
Student:  Car, Truck, Motorcycle (no Vehicle parent)

Pattern detected: MISSING_ABSTRACT_PARENT
- missingClass: "Vehicle"
- targetClasses: ["Car", "Truck", "Motorcycle"]

Action: REDUCE penalty significantly (hierarchy logic preserved)
```

**Pattern: COMPOSITION_LIFECYCLE_VIOLATION (Severity: MAJOR)**
- Wrong relationship type affects cascade delete / lifecycle dependency

Example:
```
Solution: Order →composition→ OrderItem (OrderItem dies with Order)
Student:  Order →aggregation→ OrderItem (OrderItem can exist independently)

Pattern detected: COMPOSITION_LIFECYCLE_VIOLATION
- businessImpact: "OrderItem should not exist when Order is deleted"

Action: MAJOR penalty (-5 points)
```

**Pattern: ATTRIBUTE_MIGRATION_WITH_RELATIONSHIP (Severity: MINOR)**
- Attribute misplaced but classes have relationship
- Less severe than random misplacement

Example:
```
Solution: Order { customerId }
Student:  Customer { orderId }  // Misplaced but Order-Customer relationship exists

Pattern detected: ATTRIBUTE_MIGRATION_WITH_RELATIONSHIP

Action: REDUCE penalty (not as bad as no relationship)
```

**Pattern: ISOLATED_CLASS (Severity: MAJOR)**
- Extra class with NO relationships
- Orphan class not connected to domain model

Action: FULL penalty + additional penalty for isolation

**Pattern: OVER_NORMALIZATION / UNDER_NORMALIZATION**
- Too many classes (complexity ratio > 2.0) with low connectivity
- Too few classes (complexity ratio < 0.5)

Action: Quality penalty based on severity

---

**STEP 2: CHECK GRAPH RECOMMENDATIONS**

GraphAnalysis provides recommendations with penalty adjustments:

**Code: IGNORE_EXTRA_CLASSES**
```json
{
  "code": "IGNORE_EXTRA_CLASSES",
  "reason": "Class 'Address' is decomposition with 4 attributes migrated",
  "affectedElements": ["Address"],
  "penaltyAdjustment": 2  // BONUS for good design
}
```
Action: Do NOT classify "Address" as extra class error. Give +2 bonus.

**Code: IGNORE_ATTRIBUTE_DIFF**
```json
{
  "code": "IGNORE_ATTRIBUTE_DIFF",
  "reason": "Attribute 'address' decomposed into street, city, zipCode",
  "affectedElements": ["address", "street", "city", "zipCode"],
  "penaltyAdjustment": 0
}
```
Action: Do NOT penalize missing "address" or extra "street, city, zipCode"

**Code: REDUCE_PENALTY**
```json
{
  "code": "REDUCE_PENALTY",
  "reason": "Classes consolidated - not ideal but logic preserved",
  "affectedElements": ["Person", "Address"],
  "penaltyAdjustment": 4  // Reduce from -8 to -4
}
```
Action: Apply reduced penalty instead of full penalty

**Code: INCREASE_PENALTY**
```json
{
  "code": "INCREASE_PENALTY",
  "reason": "Missing central class with degree=5, betweenness=0.8",
  "affectedElements": ["Order"],
  "penaltyAdjustment": -5  // Additional penalty
}
```
Action: Apply additional penalty for critical missing element

**Code: ADD_BONUS**
```json
{
  "code": "ADD_BONUS",
  "reason": "Good decomposition with cohesion=0.95",
  "affectedElements": ["Address"],
  "penaltyAdjustment": 2
}
```
Action: Add bonus points

**Code: IGNORE_MISSING_CLASS**
```json
{
  "code": "IGNORE_MISSING_CLASS",
  "reason": "Abstract parent missing but all children present",
  "affectedElements": ["Vehicle"],
  "penaltyAdjustment": 4
}
```
Action: Do NOT penalize or significantly reduce penalty

---

**STEP 3: CHECK ATTRIBUTE PATTERNS**

Comparison result includes attribute patterns from Step 4.3:

**Pattern: DECOMPOSITION (isValid: true)**
```json
{
  "type": "DECOMPOSITION",
  "sourceAttribute": "address",
  "decomposedInto": ["street", "city", "zipCode"],
  "confidence": 0.9,
  "isValid": true
}
```
Action: IGNORE missing "address" and extra "street, city, zipCode"
GIVE BONUS for granularity (+1 to +2 points)

**Pattern: CONSOLIDATION (isValid: false)**
```json
{
  "type": "CONSOLIDATION",
  "sourceAttributes": ["firstName", "lastName"],
  "consolidatedInto": "fullName",
  "confidence": 0.85,
  "isValid": false
}
```
Action: Keep penalty for losing detail (consolidation not ideal)

=============================================================================
ERROR CLASSIFICATION CATEGORIES
=============================================================================

### 1. STRUCTURAL ERRORS

**CLASS-MISSING-MANDATORY (CRITICAL, 8-12 points)**
- Mandatory business entity from assignment is missing
- Check: Is class in domainContext.mandatoryEntities?
- Graph check: Is this MISSING_CENTRAL_CLASS pattern (high centrality)?

**CLASS-MISSING-IMPORTANT (MAJOR, 5-8 points)**
- Important business entity missing (not mandatory but significant)
- Graph check: Does class have relationships in solution?

**CLASS-EXTRA-UNRELATED (MAJOR, 4-6 points)**
- Extra class not in solution, not justified by domain
- Graph check: Is this ISOLATED_CLASS pattern?
- Graph check: Any recommendations to IGNORE?

**CLASS-EXTRA-OUT-OF-SCOPE (MAJOR, 5-7 points)**
- Extra class violates scope boundaries from assignment

**ATTR-MISSING-CRITICAL (MAJOR, 3-5 points per attribute)**
- Essential business attribute missing
- Check: Is it in domainContext.mandatoryAttributes?
- Pattern check: Is it decomposed (ignore if yes)?

**ATTR-MISPLACED (MINOR, 2-4 points per attribute)**
- Attribute in wrong class
- Pattern check: ATTRIBUTE_MIGRATION_WITH_RELATIONSHIP? (reduce to 1-2 points)

**ATTR-EXTRA-UNNECESSARY (MINOR, 1-2 points per attribute)**
- Extra attribute not in solution, not in domain requirements

### 2. RELATIONSHIP ERRORS

**REL-WRONG-TYPE-CRITICAL (MAJOR, 5-8 points)**
- Wrong relationship type with business impact
- Examples:
    - Composition ↔ Aggregation confusion (lifecycle violation)
    - Association where composition needed
- Graph check: COMPOSITION_LIFECYCLE_VIOLATION pattern?

**REL-WRONG-TYPE-MINOR (MINOR, 2-3 points)**
- Wrong relationship type but limited impact
- Example: Association vs Aggregation (if lifecycle not critical)

**REL-MISSING-CRITICAL (MAJOR, 4-6 points)**
- Critical business relationship missing
- Example: Order-Product relationship in e-commerce

**REL-MISSING-OPTIONAL (MINOR, 1-2 points)**
- Optional relationship missing

**REL-WRONG-MULTIPLICITY (MINOR, 1-3 points per relationship)**
- Incorrect cardinality (1 vs 0..*, 1..* vs *, etc.)
- Severity depends on business rule impact

**REL-GENERALIZATION-WRONG (MAJOR, 3-5 points)**
- Generalization used incorrectly
- Or reversed (parent ↔ child swapped)

**REL-EXTRA-UNNECESSARY (MINOR, 2-3 points)**
- Extra relationship between matched classes
- Not in solution, not justified

### 3. CONCEPTUAL ERRORS

**CONCEPT-VIOLATES-RULE (CRITICAL, 8-15 points)**
- Diagram violates stated business rule from assignment
- Check domainContext.domainRules

**CONCEPT-WEAK-ENTITY-STANDALONE (MAJOR, 5-7 points)**
- Dependent entity shown as independent
- Example: OrderItem without Order reference

**CONCEPT-MISSING-ASSOCIATION-CLASS (MAJOR, 4-6 points)**
- Many-to-many relationship needs association class but missing
- Example: Student-Course needs Enrollment

**CONCEPT-OVER-ABSTRACTION (MINOR, 2-4 points)**
- Too many classes for Analysis Phase
- Graph check: OVER_NORMALIZATION pattern?

**CONCEPT-UNDER-ABSTRACTION (MAJOR, 5-8 points)**
- Too few classes, missing important concepts
- Graph check: UNDER_NORMALIZATION pattern?

### 4. QUALITY ISSUES

**QUALITY-POOR-NAMING (MINOR, 1-2 points total)**
- Unclear or inconsistent naming
- Multiple classes affected

**QUALITY-INCOMPLETE-MODEL (MAJOR, 5-10 points)**
- Missing significant parts of domain
- Multiple mandatory entities/relationships missing

**QUALITY-ATTRIBUTE-SHOULD-BE-CLASS (MINOR, 2-3 points)**
- Complex attribute that should be a class
- Example: "address" as single string vs Address class

**QUALITY-CLASS-SHOULD-BE-ATTRIBUTE (MINOR, 2-3 points)**
- Over-engineered class that should be attribute
- Example: separate "Name" class with just "value" attribute

=============================================================================
SCORING CALCULATION (NO DOUBLE PENALTY)
=============================================================================

**CRITICAL PRINCIPLE: Each error penalized EXACTLY ONCE**
- Missing element: Penalty through base score only (lower match ratio)
- Extra element: Penalty through deduction only
- Wrong relationship: Counted in base score + semantic penalty if needed

---

### 1. ENTITIES (25 points maximum)
```
Base = (matchedClasses / solutionClasses) × 20

Quality Bonus = +5 if:
  - No missing mandatory entities
  - No extra unrelated classes
  - Good naming
```

**Penalties (ONLY for EXTRA or QUALITY issues):**
- Extra class (unrelated): -4 to -6 each
- Extra class (isolated): -6 each
- Poor naming: -1 to -2 total

**NO PENALTY for missing classes** (already in base score)

**Graph adjustments:**
- CLASS_DECOMPOSITION with isValid=true: +2 bonus
- IGNORE_EXTRA_CLASSES recommendation: +0 to +2
- MISSING_CENTRAL_CLASS: additional -5
- MISSING_ABSTRACT_PARENT with all children: +4 (reduce penalty)

Example 1 - Missing classes:
```
Solution: 10 classes
Student: 8 matched, 0 extra
Base: (8/10) × 20 = 16.0  // Missing 2 = -4 already reflected
Extra penalties: 0
Bonus: Not awarded (has missing)
Final: 16.0/25
```

Example 2 - Extra classes:
```
Solution: 10 classes
Student: 10 matched, 3 extra (unrelated, not isolated)
Base: (10/10) × 20 = 20.0
Extra penalties: 3 × (-5) = -15.0
Bonus: Not awarded (has extras)
Final: max(0, 20 - 15) = 5.0/25
```

Example 3 - Valid decomposition:
```
Solution: 10 classes
Student: 10 matched, 1 extra (decomposition detected)
Base: (10/10) × 20 = 20.0
Graph adjustment: IGNORE_EXTRA_CLASSES (Address) = +2 bonus
Bonus: +5 (perfect match after graph adjustment)
Final: 20 + 2 + 5 = 27.0/25 → cap at 25.0/25
```

---

### 2. ATTRIBUTES (20 points maximum)
```
Base calculation (complex):
  - Count total solution attributes across all matched classes
  - Count matched attributes in student
  - Base = (matchedAttrs / totalSolutionAttrs) × 15

Quality Bonus = +5 if:
  - No critical attributes missing
  - No misplaced attributes
  - Good granularity
```

**Penalties (ONLY for EXTRA, MISPLACED, or QUALITY):**
- Extra attribute (unnecessary): -1 to -2 each
- Misplaced attribute: -2 to -4 each
    - Reduce to -1 if ATTRIBUTE_MIGRATION_WITH_RELATIONSHIP
- Poor naming: -0.5 total

**NO PENALTY for missing attributes** (already in base score)

**Pattern adjustments:**
- DECOMPOSITION pattern detected: +1 to +2 bonus
- CONSOLIDATION pattern detected: keep penalty (-2)
- IGNORE_ATTRIBUTE_DIFF recommendation: +0

Example 1 - Missing attributes:
```
Solution: 50 total attributes across classes
Student: 40 matched, 0 extra, 0 misplaced
Base: (40/50) × 15 = 12.0  // Missing 10 = -3 already reflected
Extra penalties: 0
Bonus: Not awarded
Final: 12.0/20
```

Example 2 - Attribute decomposition:
```
Solution: 50 total attributes
Student: 49 matched, 3 extra (decomposed from "address")
Base: (49/50) × 15 = 14.7
Pattern: DECOMPOSITION detected = +2 bonus
Bonus: +5 (near perfect)
Final: 14.7 + 2 + 5 = 21.7 → cap at 20.0/20
```

Example 3 - Misplaced attributes:
```
Solution: 50 total attributes
Student: 47 matched, 0 extra, 3 misplaced
Base: (47/50) × 15 = 14.1
Misplaced penalties: 2 × (-3) + 1 × (-1) = -7  // One has relationship
Bonus: Not awarded
Final: max(0, 14.1 - 7) = 7.1/20
```

---

### 3. RELATIONSHIPS (40 points maximum)
```
Base calculation by type:
  - Associations: (matched / solution total) × 15
  - Aggregations: (matched / solution total) × 8
  - Compositions: (matched / solution total) × 10
  - Generalizations: (matched / solution total) × 7

If solution has 0 of a type, give full points for that type.
```

**Penalties (ONLY for EXTRA, WRONG TYPE, or WRONG MULTIPLICITY):**
- Extra association (between matched): -2 to -3 each
- Extra aggregation/composition: -3 to -4 each
- Extra generalization: -2 to -3 each
- Wrong type (composition ↔ aggregation): -5 to -8
- Wrong multiplicity: -1 to -3 per relationship

**NO PENALTY for missing relationships** (already in base score)

**Graph adjustments:**
- COMPOSITION_LIFECYCLE_VIOLATION: additional -5
- Generalization preserved but parent missing: +3

Example 1 - Missing relationships:
```
Solution: 10 assoc, 3 agg, 5 comp, 2 gen
Student: 7 assoc, 2 agg, 5 comp, 2 gen (all matched, 0 extra)
Base:
  - Assoc: (7/10) × 15 = 10.5  // Missing 3 = -4.5 reflected
  - Agg: (2/3) × 8 = 5.3
  - Comp: (5/5) × 10 = 10.0
  - Gen: (2/2) × 7 = 7.0
Total: 10.5 + 5.3 + 10 + 7 = 32.8/40
```

Example 2 - Lifecycle violation:
```
Solution: 5 compositions
Student: 2 compositions matched, 3 shown as aggregations
Base:
  - Comp: (2/5) × 10 = 4.0  // 3 missing = -6 reflected
Pattern: COMPOSITION_LIFECYCLE_VIOLATION × 3 = additional -15
Total: max(0, 4.0 - 15) = 0/10 for compositions
```

Example 3 - Extra relationships:
```
Solution: 10 associations
Student: 10 matched, 5 extra (between matched classes)
Base: (10/10) × 15 = 15.0
Extra penalties: 5 × (-2.5) = -12.5
Total: max(0, 15 - 12.5) = 2.5/15 for associations
```

---

### 4. BUSINESS LOGIC COVERAGE (15 points maximum)
```
Base = 10 points (default if not explicitly violating rules)

Quality Bonus = +5 if:
  - All domain rules satisfied
  - Conceptual correctness
  - Appropriate for Analysis Phase
```

**Penalties:**
- Violates business rule: -5 to -10 per rule
- Weak entity standalone: -3 to -5
- Missing association class: -3 to -5
- Over/under abstraction: -2 to -5

Example:
```
Base: 10.0
No violations: 0
Quality bonus: +5
Final: 15.0/15
```

=============================================================================
GRAPH ADJUSTMENTS TRACKING
=============================================================================

You MUST include a `graphAdjustments` array in your output showing how graph analysis affected scoring:
```json
{
  "graphAdjustments": [
    {
      "pattern": "CLASS_DECOMPOSITION",
      "originalPenalty": 10.0,  // Would have been: -5 for extra class, -5 for missing attrs
      "adjustedPenalty": -2.0,  // Actually: +2 bonus for good design
      "reasoning": "Address class is valid decomposition of Customer with 4 attributes migrated. Applied bonus instead of penalty."
    },
    {
      "pattern": "COMPOSITION_LIFECYCLE_VIOLATION",
      "originalPenalty": 6.0,  // Base penalty for 3 unmatched compositions
      "adjustedPenalty": 21.0,  // Added lifecycle violation penalty
      "reasoning": "3 compositions shown as aggregations, violating cascade delete logic. Applied additional -15 penalty."
    }
  ]
}
```

=============================================================================
COMPLETE EXAMPLE OUTPUT
=============================================================================
```json
{
  "errors": [
    {
      "code": "CLASS-MISSING-MANDATORY",
      "category": "STRUCTURAL",
      "severity": "CRITICAL",
      "penalty": 10.0,
      "explanation": "Thiếu class 'Invoice' - entity bắt buộc trong yêu cầu bài tập. Invoice là document quan trọng trong hệ thống e-commerce.",
      "elements": ["Invoice"],
      "suggestion": "Thêm class Invoice với các attributes cơ bản: invoiceId, date, totalAmount và relationship với Order.",
      "businessImpact": "Không thể phát hành hóa đơn cho khách hàng, vi phạm quy định về hóa đơn VAT."
    },
    {
      "code": "REL-WRONG-TYPE-CRITICAL",
      "category": "RELATIONSHIP",
      "severity": "MAJOR",
      "penalty": 8.0,
      "explanation": "Sai loại relationship: Order-OrderItem nên là Composition (lifecycle dependency) nhưng Student dùng Aggregation. OrderItem không thể tồn tại độc lập khi Order bị xóa.",
      "elements": ["Order", "OrderItem"],
      "suggestion": "Đổi từ Aggregation (◇) sang Composition (◆). Trong Analysis Phase, composition thể hiện 'has-a' relationship với lifecycle dependency.",
      "businessImpact": "OrderItem có thể tồn tại mồ côi khi Order bị hủy, gây inconsistency trong database."
    },
    {
      "code": "ATTR-MISPLACED",
      "category": "STRUCTURAL",
      "severity": "MINOR",
      "penalty": 2.0,
      "explanation": "Attribute 'customerId' đặt sai vị trí: nên ở Order class nhưng Student đặt ở Product class.",
      "elements": ["customerId"],
      "suggestion": "Di chuyển 'customerId' từ Product sang Order. Product là catalog item, không thuộc về customer cụ thể.",
      "businessImpact": "Logic nghiệp vụ sai: Product không nên lưu thông tin customer."
    }
  ],
  "score": {
    "total": 68.5,
    "breakdown": {
      "entities": {
        "score": 16.0,
        "max": 25,
        "details": "8/10 classes matched (16/20 base). Missing mandatory Invoice (-10). Missing optional Promotion class already reflected in base. No bonus."
      },
      "attributes": {
        "score": 14.0,
        "max": 20,
        "details": "45/50 attributes matched (13.5/15 base). Address decomposition detected: +2 bonus. 1 misplaced customerId: -2. Quality bonus not awarded. Final: 13.5 + 2 - 2 + 0.5 rounding = 14.0."
      },
      "relationships": {
        "score": 23.5,
        "max": 40,
        "details": "Associations: 8/10 = 12/15. Aggregations: 2/3 = 5.3/8. Compositions: 2/5 = 4/10, lifecycle violation -8. Generalizations: 2/2 = 7/7. Total: 12 + 5.3 + (4-8) + 7 = 20.3. Extra associations: 2×(-2.5) = -5. Final: 20.3 - 5 = 15.3... recalc to 23.5."
      },
      "businessLogic": {
        "score": 15.0,
        "max": 15,
        "details": "All business rules satisfied. No violations. Appropriate abstraction level for Analysis Phase. Quality bonus +5."
      }
    },
    "reasoning": "Student demonstrates good understanding of core entities and most relationships. The main issues are: (1) Missing mandatory Invoice class (-10), (2) Composition/Aggregation confusion for Order-OrderItem relationship (-8), (3) One misplaced attribute (-2). Positive aspects: Valid Address decomposition from Customer (+2), correct generalization hierarchy. The diagram is conceptually sound for Analysis Phase but needs to add Invoice entity and fix relationship types.",
    "graphAdjustments": [
      {
        "pattern": "CLASS_DECOMPOSITION",
        "originalPenalty": 10.0,
        "adjustedPenalty": -2.0,
        "reasoning": "Address class detected as valid decomposition of Customer. Original penalty would be -5 for extra class + -5 for missing attributes. Applied +2 bonus for good SRP design instead."
      },
      {
        "pattern": "COMPOSITION_LIFECYCLE_VIOLATION",
        "originalPenalty": 6.0,
        "adjustedPenalty": 14.0,
        "reasoning": "3 compositions shown as aggregations (Order-OrderItem and 2 others). Base penalty -6 for unmatched. Added -8 for lifecycle violation impact."
      },
      {
        "pattern": "MISSING_CENTRAL_CLASS",
        "originalPenalty": 4.0,
        "adjustedPenalty": 14.0,
        "reasoning": "Invoice class has high centrality (degree=4). Original base penalty -4 reflected in base score. Added -10 CRITICAL penalty because it's mandatory entity."
      }
    ]
  }
}
```

=============================================================================
VALIDATION CHECKLIST
=============================================================================

Before returning, verify:

- [ ] ✅ Checked ALL graph patterns for structural equivalences
- [ ] ✅ Applied graph recommendations (IGNORE, REDUCE_PENALTY, ADD_BONUS)
- [ ] ✅ Checked attribute patterns (DECOMPOSITION/CONSOLIDATION)
- [ ] ✅ NO DOUBLE PENALTY: Missing elements only affect base score
- [ ] ✅ Extra elements penalized separately from base score
- [ ] ✅ Penalties justified by business impact
- [ ] ✅ Graph adjustments array shows all pattern-based changes
- [ ] ✅ Total score between 0 and 100
- [ ] ✅ Base score calculations use (matched/total) formulas
- [ ] ✅ Quality bonuses only awarded when criteria met
- [ ] ✅ Each error appears exactly once
- [ ] ✅ Reasoning mentions graph patterns if significant
- [ ] ✅ Final scores are non-negative (max(0, score))

=============================================================================
RETURN ONLY THE JSON OBJECT
=============================================================================

Your response must be valid JSON with this structure:
```json
{
  "errors": [...],
  "score": {
    "total": number,
    "breakdown": {
      "entities": {"score": number, "max": 25, "details": "..."},
      "attributes": {"score": number, "max": 20, "details": "..."},
      "relationships": {"score": number, "max": 40, "details": "..."},
      "businessLogic": {"score": number, "max": 15, "details": "..."}
    },
    "reasoning": "...",
    "graphAdjustments": [...]
  }
}
```

NO MARKDOWN, NO CODE BLOCKS, NO EXPLANATIONS OUTSIDE JSON.