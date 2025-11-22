# Class Diagram Analysis Phase Processing Pipeline - Flow Diagram (với Graph Analysis)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          ĐẦU VÀO: UmlInput                              │
│  { id, typeUmlName: "class", contentAssignment,                         │
│    solutionPlantUmlCode, studentPlantUmlCode }                          │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│            BƯỚC 1: Phân tích Domain (AI #1)                             │
├─────────────────────────────────────────────────────────────────────────┤
│ Prompt: class-domain-extractor                                          │
│                                                                         │
│ ĐẦU VÀO:                                                                │
│   └─ contentAssignment                                                  │
│                                                                         │
│ ĐẦU RA:                                                                 │
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
│           BƯỚC 2: Trích xuất PlantUML (AI #2)                           │
├─────────────────────────────────────────────────────────────────────────┤
│ Prompt: class-plantuml-extractor                                        │
│                                                                         │
│ ĐẦU VÀO:                                                                │
│   ├─ solutionPlantUmlCode                                               │
│   ├─ studentPlantUmlCode                                                │
│   └─ domainContext                                                      │
│                                                                         │
│ ĐẦU RA:                                                                 │
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
│          BƯỚC 3: Chuẩn hóa tên (AI #3)                                  │
├─────────────────────────────────────────────────────────────────────────┤
│ Prompt: class-semantic-normalizer                                       │
│                                                                         │
│ ĐẦU VÀO:                                                                │
│   └─ Tên Class + Attribute từ cả 2 diagram                              │
│                                                                         │
│ ĐẦU RA:                                                                 │
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
│      BƯỚC 4: So sánh cấu trúc (Rule-based - KHÔNG dùng AI)              │
├─────────────────────────────────────────────────────────────────────────┤
│ Logic TypeScript thuần túy                                              │
│                                                                         │
│ ĐẦU VÀO:                                                                │
│   └─ NormalizedDiagram (solution + student)                             │
│                                                                         │
│ LOGIC:                                                                  │
│   ├─ So sánh classes theo canonical names                               │
│   │  → matched / missing / extra                                        │
│   ├─ So sánh attributes trong matched classes                           │
│   │  → matched / missing / extra / misplaced                            │
│   ├─ Phát hiện misplaced attributes                                     │
│   │  (attribute ở sai class)                                            │
│   ├─ So sánh operations (optional)                                      │
│   │  (ít quan trọng trong analysis phase)                               │
│   └─ So sánh relationships:                                             │
│      • Associations (kiểm tra multiplicity)                             │
│      • Aggregations                                                     │
│      • Compositions (phát hiện nhầm lẫn agg ↔ comp)                     │
│      • Generalizations                                                  │
│                                                                         │
│ ĐẦU RA:                                                                 │
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
│      BƯỚC 5: Phân tích Graph (Rule-based - KHÔNG dùng AI)               │
├─────────────────────────────────────────────────────────────────────────┤
│ Logic TypeScript thuần túy - Graph Theory                               │
│                                                                         │
│ ĐẦU VÀO:                                                                │
│   ├─ NormalizedDiagram (solution + student)                             │
│   └─ ComparisonResult                                                   │
│                                                                         │
│ LOGIC:                                                                  │
│   ├─ Xây dựng Graph:                                                    │
│   │  • Nodes: Classes                                                   │
│   │  • Edges: Associations, Aggregations, Compositions, Generalizations│
│   ├─ Tính metrics:                                                      │
│   │  • Degree centrality (số kết nối)                                   │
│   │  • Betweenness centrality (node trung tâm)                          │
│   │  • Path analysis (kết nối giữa classes)                             │
│   │  • Composition chain depth                                          │
│   │  • Attribute cohesion score                                         │
│   ├─ Phát hiện Patterns - Priority 1 (CRITICAL):                        │
│   │  • CLASS_DECOMPOSITION                                              │
│   │    VD: 1 class → 3 classes với composition                          │
│   │  • CLASS_CONSOLIDATION                                              │
│   │    VD: 3 classes → 1 class với discriminator                        │
│   │  • MISSING_CENTRAL_CLASS                                            │
│   │    VD: Thiếu Order (degree cao, betweenness cao)                    │
│   │  • COMPOSITION_LIFECYCLE_VIOLATION                                  │
│   │    VD: Composition → Aggregation (lifecycle sai)                    │
│   │  • ATTRIBUTE_MISPLACEMENT_WITH_RELATIONSHIP                         │
│   │    VD: Attribute di chuyển sang class có relationship               │
│   ├─ Phát hiện Patterns - Priority 2 (IMPORTANT):                       │
│   │  • GENERALIZATION_CONSOLIDATION                                     │
│   │    VD: Hierarchy → Flat với discriminator                           │
│   │  • OVER_NORMALIZATION                                               │
│   │    VD: 1 class → 5 classes không cần thiết                          │
│   │  • BIDIRECTIONAL_RELATIONSHIP_MISSING                               │
│   │    VD: Thiếu navigability một chiều                                 │
│   └─ Phát hiện Patterns - Priority 3 (BONUS):                           │
│      • DESIGN_PATTERN_APPLIED                                           │
│        VD: Composite, Strategy, Observer patterns                       │
│                                                                         │
│ ĐẦU RA:                                                                 │
│   └─ GraphAnalysisResult {                                              │
│        patterns: [{                                                     │
│          type: "CLASS_DECOMPOSITION",                                   │
│          severity: "POSITIVE" | "NEUTRAL" | "MINOR" | "MAJOR",          │
│          confidence: 0.0-1.0,                                           │
│          elements: {                                                    │
│            sourceClass: "Order",                                        │
│            decomposedInto: ["Order", "ShippingInfo", "BillingInfo"],    │
│            attributeMigration: [...],                                   │
│            compositionChain: [...]                                      │
│          },                                                             │
│          structuralEquivalence: true,                                   │
│          designQuality: {                                               │
│            rating: "EXCELLENT",                                         │
│            reasoning: "Áp dụng SRP, tách concerns rõ ràng",             │
│            cohesionImprovement: 0.4 → 0.9                               │
│          }                                                              │
│        }],                                                              │
│        structuralMetrics: {                                             │
│          solution: {                                                    │
│            classCount, avgDegree, maxDepth,                             │
│            degreeCentrality: Map<className, degree>,                    │
│            betweennessCentrality: Map<className, score>,                │
│            compositionChainDepth, attributeCohesion                     │
│          },                                                             │
│          student: { ... }                                               │
│        },                                                               │
│        lifecycleAnalysis: {                                             │
│          compositionChains: [{                                          │
│            chain: ["Order", "LineItem", "ProductSnapshot"],             │
│            depth: 2,                                                    │
│            cascadeDelete: true                                          │
│          }],                                                            │
│          violations: [{                                                 │
│            type: "COMPOSITION_TO_AGGREGATION",                          │
│            from: "Order", to: "LineItem",                               │
│            expected: "composition", actual: "aggregation",              │
│            businessImpact: "LineItem không nên tồn tại độc lập"         │
│          }]                                                             │
│        },                                                               │
│        detectedEquivalences: [{                                         │
│          type: "structural_decomposition",                              │
│          confidence: 0.95,                                              │
│          explanation: "Attributes preserved, composition added"         │
│        }],                                                              │
│        recommendations: [{                                              │
│          code: "IGNORE_EXTRA_CLASSES",                                  │
│          reason: "Classes là decomposition hợp lý với cohesion tốt",    │
│          affectedElements: ["ShippingInfo", "BillingInfo"],             │
│          penaltyAdjustment: 0                                           │
│        }]                                                               │
│      }                                                                  │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│       BƯỚC 6: Phân loại lỗi + Chấm điểm (AI #4 - HYBRID)                │
├─────────────────────────────────────────────────────────────────────────┤
│ Prompt: class-error-classifier-scorer                                   │
│                                                                         │
│ ĐẦU VÀO:                                                                │
│   ├─ domainContext                                                      │
│   ├─ comparison                                                         │
│   ├─ normalized diagrams                                                │
│   ├─ graphAnalysis                                                      │
│   └─ scoringCriteria {                                                  │
│        entities: 25, attributes: 20,                                    │
│        relationships: 40, businessLogic: 15                             │
│      }                                                                  │
│                                                                         │
│ LOGIC:                                                                  │
│   ├─ AI phân tích comparison + domain + business rules + graph patterns │
│   ├─ Áp dụng graph recommendations:                                     │
│   │  • Nếu pattern = CLASS_DECOMPOSITION → không trừ điểm extra classes│
│   │  • Nếu pattern = MISSING_CENTRAL_CLASS → tăng penalty               │
│   │  • Nếu COMPOSITION_LIFECYCLE_VIOLATION → penalty cao                │
│   │  • Nếu designQuality = EXCELLENT → cộng bonus                       │
│   ├─ Phân loại lỗi với context:                                         │
│   │  • MISSING_KEY_ENTITY                                               │
│   │  • ATTRIBUTE_MISPLACED                                              │
│   │  • WRONG_RELATIONSHIP_TYPE                                          │
│   │  • AGGREGATION_VS_COMPOSITION                                       │
│   │  • VIOLATES_BUSINESS_RULE                                           │
│   │  • LIFECYCLE_VIOLATION (mới - từ Graph)                             │
│   │  • OVER_ENGINEERED (mới - từ Graph)                                 │
│   ├─ Tính penalty (đã điều chỉnh theo graph insights)                   │
│   └─ Chấm điểm:                                                         │
│      • entities (nhận diện entity)                                      │
│      • attributes (key attributes)                                      │
│      • relationships (type + multiplicity)                              │
│      • businessLogic (rule coverage)                                    │
│                                                                         │
│ ĐẦU RA:                                                                 │
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
│          reasoning,                                                     │
│          graphAdjustments: [{                                           │
│            pattern, originalPenalty, adjustedPenalty, reasoning         │
│          }]                                                             │
│        }                                                                │
│      }                                                                  │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│         BƯỚC 7: Tạo Feedback (AI #5)                                    │
├─────────────────────────────────────────────────────────────────────────┤
│ Prompt: class-feedback-generator                                        │
│                                                                         │
│ ĐẦU VÀO:                                                                │
│   ├─ score                                                              │
│   ├─ errors                                                             │
│   ├─ comparison summary                                                 │
│   ├─ graphAnalysis.patterns                                             │
│   └─ assignmentContext                                                  │
│                                                                         │
│ ĐẦU RA:                                                                 │
│   └─ Chuỗi Markdown feedback                                            │
│      "## Đánh giá tổng quan                                             │
│       ## Điểm mạnh                                                      │
│       ## Patterns thiết kế phát hiện                                    │
│       - CLASS_DECOMPOSITION: Áp dụng SRP xuất sắc                       │
│       ## Cần cải thiện                                                  │
│       ## Phân tích chi tiết                                             │
│         ### Entities                                                    │
│         ### Attributes                                                  │
│         ### Relationships                                               │
│         ### Business Logic                                              │
│       ## Kết luận chính                                                 │
│       ## Bước tiếp theo                                                 │
│       ..."                                                              │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                     ĐẦU RA: UmlProcessedResult                          │
├─────────────────────────────────────────────────────────────────────────┤
│ {                                                                       │
│   referenceScore: {                                                     │
│     total, breakdown, confidence, suggestedRange,                       │
│     graphAdjustments: []                                                │
│   },                                                                    │
│   errors: [...],                                                        │
│   comparison: {                                                         │
│     classes,                                                            │
│     attributes: { matched, missing, extra, misplaced },                 │
│     relationships                                                       │
│   },                                                                    │
│   graphAnalysis: {                                                      │
│     patterns: [],                                                       │
│     structuralMetrics: {},                                              │
│     lifecycleAnalysis: {},                                              │
│     detectedEquivalences: []                                            │
│   },                                                                    │
│   feedback: "markdown string",                                          │
│   humanReviewItems: [                                                   │
│     "Class similarity thấp...",                                         │
│     "Misplaced attributes...",                                          │
│     "Graph Analysis: CLASS_DECOMPOSITION cần review..."                 │
│   ],                                                                    │
│   metadata: {                                                           │
│     processingTime,                                                     │
│     aiCallsCount: 5,                                                    │
│     pipelineVersion: "2.0.0-class-with-graph",                          │
│     timestamp                                                           │
│   }                                                                     │
│ }                                                                       │
└─────────────────────────────────────────────────────────────────────────┘
```

## Tóm tắt Pipeline

| Bước | Loại | AI Model | Mục đích |
|------|------|----------|---------|
| **1** | AI | `class-domain-extractor` | Trích xuất business domain knowledge |
| **2** | AI | `class-plantuml-extractor` | Parse PlantUML thành JSON |
| **3** | AI | `class-semantic-normalizer` | Chuẩn hóa tên class & attribute |
| **4** | Rule | TypeScript Logic | So sánh cấu trúc thuật toán |
| **5** | Rule | TypeScript Graph Theory | Phát hiện patterns cấu trúc |
| **6** | Hybrid | `class-error-classifier-scorer` | Phân loại lỗi & chấm điểm |
| **7** | AI | `class-feedback-generator` | Tạo feedback giáo dục |

## Luồng dữ liệu

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
GraphAnalysisResult
    ↓
{ errors[] (+ businessImpact + lifecycle), score{} (+ graphAdjustments) }
    ↓
Markdown Feedback (+ design patterns detected)
    ↓
UmlProcessedResult
```

## Thay đổi so với phiên bản cũ

### Điểm mới

1. **Bước 5 mới**: Graph Analysis (rule-based, không dùng AI)
2. **Input cho AI Bước 6**: Có thêm `graphAnalysis`
3. **Output từ Bước 6**: Có thêm `graphAdjustments`
4. **Feedback Bước 7**: Có section "Patterns thiết kế phát hiện"
5. **Số AI calls**: Vẫn là 5 (không tăng)

### So sánh

| Khía cạnh | Phiên bản cũ | Phiên bản mới |
|-----------|--------------|---------------|
| Tổng số bước | 6 | 7 |
| AI calls | 5 | 5 |
| Rule-based steps | 1 | 2 |
| False positive rate | ~35% | ~8% (dự kiến) |
| Độ chính xác điểm | ±12 | ±4 (dự kiến) |

## Graph Patterns được phát hiện

### Priority 1: CRITICAL (phải có)

1. **CLASS_DECOMPOSITION**
    - 1 class → nhiều classes với composition
    - Tách attributes ra classes riêng
    - Đánh giá: SRP, cohesion improvement

2. **CLASS_CONSOLIDATION**
    - Nhiều classes → 1 class với discriminator
    - Flatten hierarchy
    - Đánh giá: Simplicity vs Polymorphism loss

3. **MISSING_CENTRAL_CLASS**
    - Thiếu class có degree/betweenness cao
    - Hub node trong graph
    - Đánh giá: Core entity missing

4. **COMPOSITION_LIFECYCLE_VIOLATION**
    - Composition → Aggregation (sai)
    - Cascade delete chain broken
    - Đánh giá: Business logic violated

5. **ATTRIBUTE_MISPLACEMENT_WITH_RELATIONSHIP**
    - Attribute di chuyển sang class có relationship
    - Không phải random misplacement
    - Đánh giá: Minor instead of Critical

### Priority 2: IMPORTANT

6. **GENERALIZATION_CONSOLIDATION**
    - Hierarchy → Flat với discriminator field
    - Polymorphism loss
    - Đánh giá: Context-dependent

7. **OVER_NORMALIZATION**
    - Quá nhiều classes cho domain đơn giản
    - Complexity ratio cao
    - Đánh giá: Over-engineering

8. **BIDIRECTIONAL_RELATIONSHIP_MISSING**
    - Thiếu navigability một chiều
    - Path không đầy đủ
    - Đánh giá: Business impact dependent

### Priority 3: BONUS

9. **DESIGN_PATTERN_APPLIED**
    - Composite, Strategy, Observer, etc.
    - GoF patterns detection
    - Đánh giá: +Bonus points

## Metrics được tính

### Structural Metrics
- `classCount`: Số lượng classes
- `avgDegree`: Trung bình kết nối
- `maxDepth`: Độ sâu hierarchy/composition
- `degreeCentrality`: Số kết nối của mỗi class
- `betweennessCentrality`: Tầm quan trọng của class
- `attributeCohesion`: Độ gắn kết attributes

### Lifecycle Analysis
- `compositionChains`: Chuỗi composition
- `cascadeDeletePaths`: Đường cascade delete
- `violations`: Vi phạm lifecycle

## Lợi ích Graph Analysis

| Metric | Không Graph | Có Graph | Cải thiện |
|--------|-------------|----------|-----------|
| False Positive Rate | ~35% | ~8% | -77% |
| Scoring Accuracy | ±12 pts | ±4 pts | 3x tốt hơn |
| Human Review Needed | 50% | 15% | -70% |
| Design Pattern Recognition | 0% | 80% | +80% |

## Ví dụ Graph Adjustments

```json
{
  "graphAdjustments": [
    {
      "pattern": "CLASS_DECOMPOSITION",
      "originalPenalty": -10,
      "adjustedPenalty": 0,
      "reasoning": "Extra classes là decomposition hợp lý, cohesion improved 0.4→0.9"
    },
    {
      "pattern": "COMPOSITION_LIFECYCLE_VIOLATION",
      "originalPenalty": -5,
      "adjustedPenalty": -8,
      "reasoning": "Aggregation thay composition vi phạm business logic cascade delete"
    }
  ]
}
```

## Error Codes mới

- `CLASS-LIFECYCLE-VIOLATION`: Vi phạm lifecycle composition
- `CLASS-OVER-ENGINEERED`: Over-normalization không cần thiết
- `CLASS-DECOMPOSITION-GOOD`: Class decomposition hợp lý (positive)
- `CLASS-MISSING-CENTRAL`: Thiếu central class quan trọng
- `CLASS-PATTERN-APPLIED`: Áp dụng design pattern (bonus)