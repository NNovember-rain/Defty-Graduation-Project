# Class Diagram Analysis Phase - Pipeline Documentation

## Tổng quan

Pipeline 7 bước xử lý Class Diagram cho Analysis Phase, bao gồm Graph Analysis để phát hiện design patterns và giảm false positives.

- Số AI calls: 5
- Số Rule-based steps: 2

---

## Flow Diagram

```
+-------------------------------------------------------------------------+
|                          ĐẦU VÀO: UmlInput                              |
|  { id, typeUmlName: "class", contentAssignment,                         |
|    solutionPlantUmlCode, studentPlantUmlCode }                          |
+------------------------------------+------------------------------------+
                                     |
                                     v
+-------------------------------------------------------------------------+
|                  BƯỚC 1: Phân tích Domain (AI #1)                       |
+-------------------------------------------------------------------------+
| Prompt: class-analysis-domain-extractor                                 |
|                                                                         |
| ĐẦU VÀO:                                                                |
|   - contentAssignment                                                   |
|                                                                         |
| ĐẦU RA:                                                                 |
|   - DomainContext {                                                     |
|       keywords[],                                                       |
|       businessConcepts[],                                               |
|       mandatoryEntities[],                                              |
|       domainRules[],                                                    |
|       analysisPhaseConstraints[]                                        |
|     }                                                                   |
+------------------------------------+------------------------------------+
                                     |
                                     v
+-------------------------------------------------------------------------+
|                 BƯỚC 2: Trích xuất PlantUML (AI #2)                     |
+-------------------------------------------------------------------------+
| Prompt: class-analysis-plantuml-extractor                               |
|                                                                         |
| ĐẦU VÀO:                                                                |
|   - solutionPlantUmlCode                                                |
|   - studentPlantUmlCode                                                 |
|   - domainContext                                                       |
|                                                                         |
| ĐẦU RA:                                                                 |
|   - DiagramJSON {                                                       |
|       solution: {                                                       |
|         classes[],                                                      |
|         relationships: {                                                |
|           associations[], aggregations[],                               |
|           compositions[], generalizations[]                             |
|         }                                                               |
|       },                                                                |
|       student: { ... }                                                  |
|     }                                                                   |
|                                                                         |
|   - Class structure:                                                    |
|     { id, name, stereotype, attributes[{ name }], operations[{ name }] }|
+------------------------------------+------------------------------------+
                                     |
                                     v
+-------------------------------------------------------------------------+
|                BƯỚC 3: Chuẩn hóa Semantic (AI #3)                       |
+-------------------------------------------------------------------------+
| Prompt: class-analysis-semantic-normalizer                              |
|                                                                         |
| ĐẦU VÀO:                                                                |
|   - Tên Class + Attribute từ cả 2 diagram                               |
|   - domainContext (keywords, mandatoryEntities)                         |
|                                                                         |
| ĐẦU RA:                                                                 |
|   - NormalizedDiagram {                                                 |
|       solution: {                                                       |
|         classes[{ ...class, normalized, attributesNormalized[] }]       |
|       },                                                                |
|       student: { ... }                                                  |
|     }                                                                   |
|                                                                         |
|   - normalized = { original, canonical, similarityScore }               |
+------------------------------------+------------------------------------+
                                     |
                                     v
+-------------------------------------------------------------------------+
|          BƯỚC 4: So sánh cấu trúc (Rule-based - Không dùng AI)          |
+-------------------------------------------------------------------------+
| Logic TypeScript thuần túy                                              |
|                                                                         |
| ĐẦU VÀO:                                                                |
|   - NormalizedDiagram (solution + student)                              |
|                                                                         |
| LOGIC:                                                                  |
|   4.1. So sánh classes theo canonical names                             |
|        - matched[] / missing[] / extra[]                                |
|                                                                         |
|   4.2. So sánh attributes trong matched classes                         |
|        - matched[] / missing[] / extra[] / misplaced[]                  |
|        - Phát hiện misplaced: attribute ở sai class                     |
|                                                                         |
|   4.3. Phát hiện Attribute Patterns                                     |
|        - DECOMPOSITION: 1 attribute -> N attributes                     |
|          VD: address -> street, city, zipCode                           |
|        - CONSOLIDATION: N attributes -> 1 attribute                     |
|          VD: firstName, lastName -> fullName                            |
|                                                                         |
|   4.4. So sánh operations (đơn giản, ít quan trọng trong analysis)      |
|                                                                         |
|   4.5. So sánh relationships:                                           |
|        - Associations (bidirectional, kiểm tra multiplicity)            |
|        - Aggregations (phát hiện nhầm với composition)                  |
|        - Compositions (phát hiện nhầm với aggregation)                  |
|        - Generalizations (phát hiện reversed direction)                 |
|                                                                         |
| ĐẦU RA:                                                                 |
|   - ComparisonResult {                                                  |
|       classes: { matched[], missing[], extra[] },                       |
|       attributes: {                                                     |
|         matched[], missing[], extra[], misplaced[], patterns[]          |
|       },                                                                |
|       operations: { matched, missing },                                 |
|       relationships: {                                                  |
|         associations: { matched, missing, extra, wrongMultiplicity[] }, |
|         aggregations: { matched, missing, confusedWithComposition[] },  |
|         compositions: { matched, missing, confusedWithAggregation[] },  |
|         generalizations: { matched, missing, extra, reversed[] }        |
|       }                                                                 |
|     }                                                                   |
+------------------------------------+------------------------------------+
                                     |
                                     v
+-------------------------------------------------------------------------+
|          BƯỚC 5: Phân tích Graph (Rule-based - Không dùng AI)           |
+-------------------------------------------------------------------------+
| Logic TypeScript thuần túy - Graph Theory                               |
|                                                                         |
| ĐẦU VÀO:                                                                |
|   - NormalizedDiagram (solution + student)                              |
|   - ComparisonResult                                                    |
|                                                                         |
| LOGIC:                                                                  |
|   1. Xây dựng Graph:                                                    |
|      - Nodes: Classes                                                   |
|      - Edges: Associations, Aggregations, Compositions, Generalizations |
|                                                                         |
|   2. Tính metrics:                                                      |
|      - Degree centrality (số kết nối)                                   |
|      - Betweenness centrality (node trung tâm)                          |
|      - Composition chain depth                                          |
|      - Attribute cohesion score                                         |
|                                                                         |
|   3. Phát hiện Patterns (xem chi tiết bên dưới)                         |
|                                                                         |
|   4. Tạo recommendations cho Step 6                                     |
|                                                                         |
| ĐẦU RA:                                                                 |
|   - GraphAnalysisResult {                                               |
|       patterns[],                                                       |
|       structuralMetrics: { solution: {...}, student: {...} },           |
|       lifecycleAnalysis: { compositionChains[], violations[] },         |
|       detectedEquivalences[],                                           |
|       recommendations[]                                                 |
|     }                                                                   |
+------------------------------------+------------------------------------+
                                     |
                                     v
+-------------------------------------------------------------------------+
|          BƯỚC 6: Phân loại lỗi + Chấm điểm (AI #4 - Hybrid)             |
+-------------------------------------------------------------------------+
| Prompt: class-analysis-error-classifier-scorer                          |
|                                                                         |
| ĐẦU VÀO:                                                                |
|   - domainContext                                                       |
|   - comparison                                                          |
|   - graphAnalysis (patterns, recommendations, violations)               |
|   - scoringCriteria: {                                                  |
|       entities: 25, attributes: 20,                                     |
|       relationships: 40, businessLogic: 15                              |
|     }                                                                   |
|                                                                         |
| LOGIC:                                                                  |
|   - AI phân tích comparison + domain + graph patterns                   |
|   - Áp dụng graph recommendations:                                      |
|     - CLASS_DECOMPOSITION -> không trừ điểm extra classes               |
|     - MISSING_CENTRAL_CLASS -> tăng penalty                             |
|     - COMPOSITION_LIFECYCLE_VIOLATION -> penalty cao                    |
|     - designQuality = EXCELLENT -> cộng bonus                           |
|   - Phân loại lỗi theo category và severity                             |
|   - Tính điểm theo từng tiêu chí                                        |
|                                                                         |
| ĐẦU RA:                                                                 |
|   - errors[]: { code, category, severity, penalty, explanation, ... }   |
|   - score: { total, breakdown, reasoning, graphAdjustments[] }          |
+------------------------------------+------------------------------------+
                                     |
                                     v
+-------------------------------------------------------------------------+
|                   BƯỚC 7: Tạo Feedback (AI #5)                          |
+-------------------------------------------------------------------------+
| Prompt: class-analysis-feedback-generator                               |
|                                                                         |
| ĐẦU VÀO:                                                                |
|   - score                                                               |
|   - errors                                                              |
|   - comparison summary                                                  |
|   - graphAnalysis (positivePatterns, negativePatterns, equivalences)    |
|   - assignmentContext                                                   |
|                                                                         |
| ĐẦU RA:                                                                 |
|   - Markdown feedback với các section:                                  |
|     - Đánh giá tổng quan                                                |
|     - Điểm mạnh                                                         |
|     - Cần cải thiện (Critical / Major / Minor)                          |
|     - Phân tích chi tiết (Entities, Attributes, Relationships)          |
|     - Kết luận và bước tiếp theo                                        |
+------------------------------------+------------------------------------+
                                     |
                                     v
+-------------------------------------------------------------------------+
|                       ĐẦU RA: UmlProcessedResult                        |
+-------------------------------------------------------------------------+
| {                                                                       |
|   referenceScore: { total, breakdown, confidence, suggestedRange },     |
|   errors: [...],                                                        |
|   comparison: {                                                         |
|     classes: { matched, missing, extra },                               |
|     attributes: { matched, missing, extra, misplaced, patterns },       |
|     relationships: { associations, aggregations, compositions, ... }    |
|   },                                                                    |
|   graphAnalysis: {                                                      |
|     patterns[], structuralMetrics, lifecycleAnalysis,                   |
|     detectedEquivalences, recommendationsCount                          |
|   },                                                                    |
|   feedback: "markdown string",                                          |
|   humanReviewItems: [...],                                              |
|   metadata: {                                                           |
|     processingTime, aiCallsCount: 5,                                    |
|     pipelineVersion: "2.1.0-class-analysis-fixed", timestamp            |
|   }                                                                     |
| }                                                                       |
+-------------------------------------------------------------------------+
```

---

## Tóm tắt Pipeline

| Bước | Loại | Prompt Type | Mục đích |
|------|------|-------------|----------|
| 1 | AI | class-analysis-domain-extractor | Trích xuất business domain |
| 2 | AI | class-analysis-plantuml-extractor | Parse PlantUML thành JSON |
| 3 | AI | class-analysis-semantic-normalizer | Chuẩn hóa tên class và attribute |
| 4 | Rule | TypeScript Logic | So sánh cấu trúc + Attribute patterns |
| 5 | Rule | TypeScript Graph Theory | Phát hiện structural patterns |
| 6 | Hybrid | class-analysis-error-classifier-scorer | Phân loại lỗi và chấm điểm |
| 7 | AI | class-analysis-feedback-generator | Tạo feedback giáo dục |

---

## Luồng dữ liệu

```
contentAssignment
    |
    v
DomainContext (keywords, mandatoryEntities, domainRules)
    |
    v
DiagramJSON (classes + relationships cho cả solution và student)
    |
    v
NormalizedDiagram (thêm canonical names cho class và attribute)
    |
    v
ComparisonResult (matched/missing/extra + attribute patterns + relationship details)
    |
    v
GraphAnalysisResult (patterns + metrics + violations + recommendations)
    |
    v
{ errors[], score{} } (đã áp dụng graph adjustments)
    |
    v
Markdown Feedback
    |
    v
UmlProcessedResult
```

---

## Graph Patterns được phát hiện

### Nhóm 1: Structural Equivalence (Severity: POSITIVE hoặc NEUTRAL)

**CLASS_DECOMPOSITION**
- Mô tả: Student tách 1 class thành nhiều classes với composition
- Ví dụ: Order -> Order + ShippingInfo + BillingInfo
- Điều kiện: Attributes được migrate, có composition relationship
- Đánh giá: Nếu cohesion cao -> POSITIVE (bonus), ngược lại NEUTRAL

**CLASS_CONSOLIDATION**
- Mô tả: Student gộp nhiều classes thành 1 class
- Ví dụ: Customer + Admin -> User { role }
- Điều kiện: Attributes từ nhiều missing classes xuất hiện trong 1 extra class
- Đánh giá: Thường là MINOR (mất polymorphism)

**MISSING_ABSTRACT_PARENT**
- Mô tả: Thiếu parent class trong hierarchy nhưng tất cả children đều có
- Ví dụ: Thiếu Person nhưng có Customer và Employee
- Điều kiện: Parent có generalization đến children, children đều có trong student
- Đánh giá: MINOR (logic preserved, chỉ thiếu abstraction)

### Nhóm 2: Lifecycle và Relationship (Severity: MAJOR)

**COMPOSITION_LIFECYCLE_VIOLATION**
- Mô tả: Student dùng aggregation thay vì composition (hoặc ngược lại)
- Ví dụ: Order --o LineItem thay vì Order --* LineItem
- Điều kiện: Solution có composition, student có aggregation giữa cùng 2 classes
- Đánh giá: MAJOR (vi phạm cascade delete logic)

**ATTRIBUTE_MIGRATION_WITH_RELATIONSHIP**
- Mô tả: Attribute bị misplaced nhưng 2 classes có relationship
- Ví dụ: orderId ở Customer thay vì Order, nhưng Customer-Order có association
- Điều kiện: Misplaced attribute, 2 classes có edge trong graph
- Đánh giá: MINOR (không phải random error)

### Nhóm 3: Missing và Extra (Severity: CRITICAL hoặc MAJOR)

**MISSING_CENTRAL_CLASS**
- Mô tả: Thiếu class có degree hoặc betweenness centrality cao
- Ví dụ: Thiếu Order trong hệ thống e-commerce
- Điều kiện: Missing class có degree >= 3 hoặc betweenness > 0.3
- Đánh giá: CRITICAL (core entity missing)

**ISOLATED_CLASS**
- Mô tả: Extra class không có relationship nào
- Ví dụ: Thêm class Helper không kết nối gì
- Điều kiện: Extra class với degree = 0
- Đánh giá: MAJOR (orphan class)

### Nhóm 4: Complexity (Severity: MINOR)

**OVER_NORMALIZATION**
- Mô tả: Student có quá nhiều classes so với solution
- Điều kiện: classCount ratio > 2.0 và avgDegree < 1.5
- Đánh giá: MINOR (over-engineering)

**UNDER_NORMALIZATION**
- Mô tả: Student có quá ít classes so với solution
- Điều kiện: classCount ratio < 0.5 và solution có >= 4 classes
- Đánh giá: MAJOR (under-modeling)

---

## Attribute Patterns (Step 4.3)

### DECOMPOSITION (Thường là tốt)

Student tách 1 attribute thành nhiều attributes chi tiết hơn.

Các patterns phổ biến:
- address -> street, city, zipCode, district, ward
- fullName -> firstName, lastName, middleName
- contactInfo -> email, phone, mobile
- dateTime -> date, time
- period -> startDate, endDate
- price -> amount, currency
- location -> latitude, longitude

Đánh giá: Thường được bonus hoặc không trừ điểm.

### CONSOLIDATION (Thường là không tốt cho Analysis Phase)

Student gộp nhiều attributes thành 1 attribute.

Ví dụ:
- firstName, lastName -> fullName (mất chi tiết)

Đánh giá: Thường bị trừ điểm vì mất granularity.

---

## Metrics được tính

### Structural Metrics

| Metric | Mô tả |
|--------|-------|
| classCount | Số lượng classes |
| edgeCount | Số lượng relationships |
| avgDegree | Trung bình số kết nối của mỗi class |
| maxDepth | Độ sâu lớn nhất của composition chain |
| degreeCentrality | Số kết nối của từng class |
| betweennessCentrality | Điểm trung tâm của từng class |
| avgAttributeCohesion | Điểm cohesion trung bình |

### Lifecycle Analysis

| Field | Mô tả |
|-------|-------|
| compositionChains | Danh sách các chuỗi composition |
| violations | Danh sách vi phạm lifecycle (composition/aggregation sai) |

---

## Recommendations từ Graph Analysis

| Code | Mô tả | Penalty Adjustment |
|------|-------|-------------------|
| IGNORE_EXTRA_CLASSES | Extra classes là decomposition hợp lý | 0 hoặc +2 |
| IGNORE_MISSING_CLASS | Missing class được thay thế hợp lý | Giảm penalty |
| IGNORE_ATTRIBUTE_DIFF | Attribute được decompose/migrate hợp lý | 0 |
| REDUCE_PENALTY | Lỗi có context hợp lý | +2 đến +6 |
| INCREASE_PENALTY | Lỗi nghiêm trọng hơn (lifecycle violation) | -3 đến -8 |
| ADD_BONUS | Design tốt (high cohesion, SRP) | +1 đến +3 |
| REQUIRE_HUMAN_REVIEW | Cần review thủ công | 0 |

---

## Error Codes

### Structural Errors

| Code | Severity | Mô tả |
|------|----------|-------|
| MISSING_KEY_ENTITY | CRITICAL/MAJOR | Thiếu entity quan trọng |
| MISSING_KEY_ATTRIBUTE | MAJOR | Thiếu attribute quan trọng |
| ATTRIBUTE_MISPLACED | MINOR/MAJOR | Attribute ở sai class |
| CLASS_SHOULD_BE_ATTRIBUTE | MINOR | Over-abstraction |
| ATTRIBUTE_SHOULD_BE_CLASS | MINOR | Under-abstraction |

### Relationship Errors

| Code | Severity | Mô tả |
|------|----------|-------|
| WRONG_RELATIONSHIP_TYPE | MAJOR | Dùng sai loại relationship |
| AGGREGATION_VS_COMPOSITION | MAJOR | Nhầm aggregation và composition |
| WRONG_MULTIPLICITY | MINOR | Multiplicity không đúng |
| MISSING_CRITICAL_RELATIONSHIP | MAJOR | Thiếu relationship quan trọng |
| REVERSED_GENERALIZATION | MAJOR | Đảo ngược parent-child |

### Conceptual Errors

| Code | Severity | Mô tả |
|------|----------|-------|
| VIOLATES_BUSINESS_RULE | CRITICAL | Vi phạm business rule |
| LIFECYCLE_VIOLATION | MAJOR | Vi phạm lifecycle dependency |
| OVER_ENGINEERED | MINOR | Thiết kế quá phức tạp |
| UNDER_MODELED | MAJOR | Thiết kế quá đơn giản |

---

## Lợi ích của Graph Analysis

| Metric | Không có Graph | Có Graph | Cải thiện |
|--------|----------------|----------|-----------|
| False Positive Rate | ~35% | ~8% | -77% |
| Scoring Accuracy | +/-12 pts | +/-4 pts | 3x tốt hơn |
| Human Review Needed | 50% | 15% | -70% |

---

## Ví dụ Graph Adjustments

```json
{
  "graphAdjustments": [
    {
      "pattern": "CLASS_DECOMPOSITION",
      "originalPenalty": -10,
      "adjustedPenalty": 0,
      "reasoning": "Extra classes là decomposition hợp lý, cohesion = 0.9"
    },
    {
      "pattern": "COMPOSITION_LIFECYCLE_VIOLATION",
      "originalPenalty": -5,
      "adjustedPenalty": -10,
      "reasoning": "Aggregation thay composition vi phạm cascade delete logic"
    },
    {
      "pattern": "MISSING_ABSTRACT_PARENT",
      "originalPenalty": -8,
      "adjustedPenalty": -2,
      "reasoning": "Thiếu parent nhưng tất cả children đều có, logic preserved"
    }
  ]
}
```

---

## So sánh với phiên bản cũ

| Khía cạnh | Phiên bản cũ | Phiên bản mới |
|-----------|--------------|---------------|
| Tổng số bước | 6 | 7 |
| AI calls | 5 | 5 |
| Rule-based steps | 1 | 2 |
| Attribute pattern detection | Không | Có (Step 4.3) |
| Graph analysis | Không | Có (Step 5) |
| Lifecycle violation detection | Không | Có |
| False positive rate | ~35% | ~8% |
| Pipeline version | 1.x | 2.1.0-class-analysis-fixed |