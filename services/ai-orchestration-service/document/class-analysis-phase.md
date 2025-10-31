# Class Diagram Analysis Phase Processing Pipeline - Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          INPUT: UmlInput                                │
│  { id, typeUmlName: "class", contentAssignment,                         │
│    solutionPlantUmlCode, studentPlantUmlCode }                          │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│            STEP 1: Domain Analysis (AI #1)                              │
├─────────────────────────────────────────────────────────────────────────┤
│ Prompt: class-domain-extractor                                          │
│                                                                         │
│ INPUT:                                                                  │
│   └─ contentAssignment                                                  │
│                                                                         │
│ OUTPUT:                                                                 │
│   └─ DomainContext {                                                    │
│        • keywords[]                                                     │
│        • businessConcepts[]                                             │
│        • mandatoryEntities[]                                            │
│        • domainRules[]                                                  │
│        • analysisPhaseConstraints[]                                     │
│      }                                                                  │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│           STEP 2: PlantUML Extract (AI #2)                              │
├─────────────────────────────────────────────────────────────────────────┤
│ Prompt: class-plantuml-extractor                                        │
│                                                                         │
│ INPUT:                                                                  │
│   ├─ solutionPlantUmlCode                                               │
│   ├─ studentPlantUmlCode                                                │
│   └─ domainContext                                                      │
│                                                                         │
│ OUTPUT:                                                                 │
│   └─ DiagramJSON {                                                      │
│        solution: {                                                      │
│          classes[],                                                     │
│          relationships: {                                               │
│            associations[], aggregations[],                              │
│            compositions[], generalizations[]                            │
│          }                                                              │
│        },                                                               │
│        student: {                                                       │
│          classes[],                                                     │
│          relationships: { ... }                                         │
│        }                                                                │
│      }                                                                  │
│      class = {                                                          │
│        id, name, stereotype,                                            │
│        attributes[{ name }],                                            │
│        operations[{ name }]                                             │
│      }                                                                  │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│          STEP 3: Normalize Names (AI #3)                                │
├─────────────────────────────────────────────────────────────────────────┤
│ Prompt: class-semantic-normalizer                                       │
│                                                                         │
│ INPUT:                                                                  │
│   └─ Class names + attribute names from both diagrams                   │
│                                                                         │
│ OUTPUT:                                                                 │
│   └─ NormalizedDiagram {                                                │
│        solution: {                                                      │
│          classes[+normalized, +attributesNormalized],                   │
│          ...                                                            │
│        },                                                               │
│        student: {                                                       │
│          classes[+normalized, +attributesNormalized],                   │
│          ...                                                            │
│        }                                                                │
│      }                                                                  │
│      normalized = { original, canonical, similarityScore }              │
│      attributesNormalized = [{                                          │
│        name,                                                            │
│        normalized: { original, canonical, similarityScore }             │
│      }]                                                                 │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│      STEP 4: Compare Structure (Rule-based - NO AI)                     │
├─────────────────────────────────────────────────────────────────────────┤
│ Pure TypeScript Logic                                                   │
│                                                                         │
│ INPUT:                                                                  │
│   └─ NormalizedDiagram (solution + student)                             │
│                                                                         │
│ LOGIC:                                                                  │
│   ├─ Compare classes by canonical names                                 │
│   │  → matched / missing / extra                                        │
│   ├─ Compare attributes within matched classes                          │
│   │  → matched / missing / extra / misplaced                            │
│   ├─ Detect misplaced attributes                                        │
│   │  (attribute in wrong class)                                         │
│   ├─ Compare operations (optional)                                      │
│   │  (less critical in analysis phase)                                  │
│   └─ Compare relationships:                                             │
│      • Associations (check multiplicity)                                │
│      • Aggregations                                                     │
│      • Compositions (detect confusion agg ↔ comp)                       │
│      • Generalizations                                                  │
│                                                                         │
│ OUTPUT:                                                                 │
│   └─ ComparisonResult {                                                 │
│        classes: { matched[], missing[], extra[] },                      │
│        attributes: {                                                    │
│          matched[], missing[], extra[], misplaced[]                     │
│        },                                                               │
│        operations: { matched, missing },                                │
│        relationships: {                                                 │
│          associations: {                                                │
│            matched, missing, extra, wrongMultiplicity[]                 │
│          },                                                             │
│          aggregations: {                                                │
│            matched, missing, confusedWithComposition                    │
│          },                                                             │
│          compositions: {                                                │
│            matched, missing, confusedWithAggregation                    │
│          },                                                             │
│          generalizations: { matched, missing, extra }                   │
│        }                                                                │
│      }                                                                  │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│       STEP 5: Classify + Score (AI #4 - HYBRID)                         │
├─────────────────────────────────────────────────────────────────────────┤
│ Prompt: class-error-classifier-scorer                                   │
│                                                                         │
│ INPUT:                                                                  │
│   ├─ domainContext                                                      │
│   ├─ comparison                                                         │
│   ├─ normalized diagrams                                                │
│   └─ scoringCriteria {                                                  │
│        entities: 25, attributes: 20,                                    │
│        relationships: 40, businessLogic: 15                             │
│      }                                                                  │
│                                                                         │
│ LOGIC:                                                                  │
│   ├─ AI analyzes comparison + domain context + business rules           │
│   ├─ Classifies errors:                                                 │
│   │  • MISSING_KEY_ENTITY                                               │
│   │  • ATTRIBUTE_MISPLACED                                              │
│   │  • WRONG_RELATIONSHIP_TYPE                                          │
│   │  • AGGREGATION_VS_COMPOSITION                                       │
│   │  • VIOLATES_BUSINESS_RULE                                           │
│   │  • etc.                                                             │
│   ├─ Determines context-aware penalties                                 │
│   │  (same error, different penalty per domain)                         │
│   └─ Scores:                                                            │
│      • entities (business entity identification)                        │
│      • attributes (key attributes)                                      │
│      • relationships (type + multiplicity correctness)                  │
│      • businessLogic (rule coverage)                                    │
│                                                                         │
│ OUTPUT:                                                                 │
│   └─ {                                                                  │
│        errors: [{                                                       │
│          code, category, severity, penalty,                             │
│          explanation, elements[], suggestion,                           │
│          businessImpact                                                 │
│        }],                                                              │
│        score: {                                                         │
│          total,                                                         │
│          breakdown: {                                                   │
│            entities, attributes,                                        │
│            relationships, businessLogic                                 │
│          },                                                             │
│          reasoning                                                      │
│        }                                                                │
│      }                                                                  │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│         STEP 6: Generate Feedback (AI #5)                               │
├─────────────────────────────────────────────────────────────────────────┤
│ Prompt: class-feedback-generator                                        │
│                                                                         │
│ INPUT:                                                                  │
│   ├─ score                                                              │
│   ├─ errors                                                             │
│   ├─ comparison summary                                                 │
│   └─ assignmentContext                                                  │
│                                                                         │
│ OUTPUT:                                                                 │
│   └─ Markdown feedback string                                           │
│      "# Overall Assessment                                              │
│       ## Strengths                                                      │
│       ## Areas for Improvement                                          │
│       ## Detailed Analysis                                              │
│         ### Entities                                                    │
│         ### Attributes                                                  │
│         ### Relationships                                               │
│         ### Business Logic                                              │
│       ## Key Takeaways                                                  │
│       ## Next Steps                                                     │
│       ..."                                                              │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                     OUTPUT: UmlProcessedResult                          │
├─────────────────────────────────────────────────────────────────────────┤
│ {                                                                       │
│   referenceScore: {                                                     │
│     total, breakdown, confidence, suggestedRange                        │
│   },                                                                    │
│   errors: [...],                                                        │
│   comparison: {                                                         │
│     classes,                                                            │
│     attributes: { matched, missing, extra, misplaced },                 │
│     relationships                                                       │
│   },                                                                    │
│   feedback: "markdown string",                                          │
│   humanReviewItems: [                                                   │
│     "Class similarity low...",                                          │
│     "Misplaced attributes...",                                          │
│     "Aggregation/composition confusion..."                              │
│   ],                                                                    │
│   metadata: {                                                           │
│     processingTime,                                                     │
│     aiCallsCount: 5,                                                    │
│     pipelineVersion: "1.0.0-class-analysis",                            │
│     timestamp                                                           │
│   }                                                                     │
│ }                                                                       │
└─────────────────────────────────────────────────────────────────────────┘
```

## Pipeline Summary

| Step | Type | AI Model | Purpose |
|------|------|----------|---------|
| **1** | AI | `class-domain-extractor` | Extract business domain knowledge |
| **2** | AI | `class-plantuml-extractor` | Parse PlantUML into structured JSON |
| **3** | AI | `class-semantic-normalizer` | Normalize class & attribute names |
| **4** | Rule | TypeScript Logic | Compare structures algorithmically |
| **5** | Hybrid | `class-error-classifier-scorer` | Classify errors & score with context |
| **6** | AI | `class-feedback-generator` | Generate educational feedback |

## Data Flow

```
contentAssignment 
    ↓
DomainContext (+ business rules)
    ↓
DiagramJSON (classes + relationships)
    ↓
NormalizedDiagram (+ attribute normalization)
    ↓
ComparisonResult (+ misplaced attributes detection)
    ↓
{ errors[] (+ businessImpact), score{} }
    ↓
Markdown Feedback (structured by categories)
    ↓
UmlProcessedResult
```

## Key Features

- **5 AI Calls**: Steps 1, 2, 3, 5, 6
- **1 Rule-based Step**: Step 4 (pure TypeScript logic)
- **Scoring Criteria**: Entities (25), Attributes (20), Relationships (40), Business Logic (15)
- **Special Detection**:
    - Misplaced attributes (attribute in wrong class)
    - Aggregation vs Composition confusion
    - Business rule violations
    - Multiplicity errors
- **Error Categories**:
    - `MISSING_KEY_ENTITY`
    - `ATTRIBUTE_MISPLACED`
    - `WRONG_RELATIONSHIP_TYPE`
    - `AGGREGATION_VS_COMPOSITION`
    - `VIOLATES_BUSINESS_RULE`

## Class Diagram Specific Features

### Domain Context Enhancement
- Business concepts identification
- Mandatory entities detection
- Domain rules extraction
- Analysis phase constraints

### Attribute Analysis
- Attribute-level comparison
- Misplaced attribute detection
- Key attribute identification
- Attribute normalization

### Relationship Types
1. **Associations** - with multiplicity checking
2. **Aggregations** - "has-a" relationships
3. **Compositions** - strong ownership
4. **Generalizations** - inheritance

### Business Logic Scoring
- Domain rule coverage
- Business impact assessment
- Context-aware penalty calculation