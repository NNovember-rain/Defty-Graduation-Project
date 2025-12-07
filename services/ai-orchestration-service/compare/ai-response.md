# Đánh giá Class Diagram - Giai đoạn Phân tích

<div align="center">

# **1.6/100**

</div>

---

## Tổng quan

Bài làm của bạn còn nhiều thiếu sót cơ bản trong việc xác định các thực thể, thuộc tính và mối quan hệ cốt lõi của hệ thống. Điểm số thấp phản ánh những vấn đề nghiêm trọng về cấu trúc và logic nghiệp vụ.

---

## Các lỗi cần sửa

**Class thiếu:**
- Thực thể đại diện cho các cửa hàng trong chuỗi (Company)
- Thực thể chi tiết các kỳ trả góp của một khoản vay (PaymentSchedule)
- Thực thể trung tâm quan trọng cho việc chi tiết hóa các khoản thanh toán cho đối tác (PartnerPaymentDetail)

**Class thừa:**
- Bill
- PartnerItemPrice
→ Các class này không cần thiết cho giai đoạn phân tích hoặc cố gắng tổng quát hóa không rõ ràng.

**Attribute đặt sai class:**
- unitPrice: đang ở `Item`, nên ở `ContractDetails`
- totalPrice: đang ở `Contract`, nên ở `ContractDetails`
- partnerPrice: đang ở `ContractDetails`, nên ở `Item`
- paymentDate: đang ở `Bill`, nên ở `CustomerPayment`
- totalAmount: đang ở `Bill`, nên ở `CustomerPayment`
- paymentDate: đang ở `Bill`, nên ở `PartnerPayment`

**Attribute thừa:**
- Client: note, idCardNumber, idCard type
- Partner: createdDate
- Contract: item, client, note, totalAmountDue
- ContractDetails: item, contract
- Item: description, price, stock, createdDate
- BillClient: contract, remainingPrincipalAfterPayment, lateFeePaid
- BillPartner: contractDetail
- Bill: paymentType, note, paymentAmount
- PartnerItemPrice: List price
→ Các thuộc tính này không thiết yếu cho giai đoạn phân tích hoặc là dư thừa.

**Nhầm lẫn Aggregation/Composition:**
- `Contract` ◇ `ContractDetails`: dùng aggregation, nhưng nên dùng composition.
  → `ContractDetails` là thành phần của `Contract` và không nên tồn tại độc lập khi `Contract` bị xóa.

**Relationship thiếu:**
- 7 association
- 3 composition (thể hiện mối quan hệ toàn thể-bộ phận với sự phụ thuộc vào vòng đời)

**Relationship thừa:**
- 4 association
- 7 aggregation

**Vấn đề nghiệp vụ:**
- Quy tắc "Mỗi Khoản vay bao gồm nhiều Kỳ trả góp" bị vi phạm do thiếu thực thể `Kỳ trả góp` (PaymentSchedule).
- Quy tắc "Các hoạt động liên quan đến Khoản vay và Khách hàng được thực hiện tại các Cửa hàng cụ thể" bị vi phạm do thiếu thực thể `Cửa hàng` (Company).

---

## Phân tích Graph Patterns

**Thiếu class trung tâm:**
- Class `PartnerPaymentDetail` bị thiếu. Phân tích đồ thị cho thấy đây là một class trung tâm quan trọng (có nhiều kết nối với các class khác, degree=3, betweenness=4.00), đóng vai trò cốt lõi trong logic xử lý thanh toán của đối tác.

**Vi phạm sự phụ thuộc vòng đời:**
- Mối quan hệ giữa `Contract` và `ContractDetails` được mô hình hóa sai là aggregation thay vì composition. Điều này vi phạm nguyên tắc `ContractDetails` không nên tồn tại độc lập khi `Contract` bị xóa.

---

## Chi tiết điểm

| Thành phần | Điểm | Ghi chú |
|------------|------|---------|
| Entities (Classes) | 1.55/25 | 8/11 class được khớp, thiếu 2 class bắt buộc, thừa 2 class, thiếu 1 class trung tâm quan trọng. |
| Attributes | 0/20 | 18/28 thuộc tính được khớp, 6 thuộc tính đặt sai vị trí, 21 thuộc tính thừa không cần thiết. |
| Relationships | 0/40 | 0/10 mối quan hệ được khớp, 4 association thừa, 1 lỗi composition-thành-aggregation nghiêm trọng. |
| Business Logic | 0/15 | Vi phạm 2 quy tắc nghiệp vụ quan trọng do thiếu các thực thể cốt lõi. |

---

## Cách sửa

1.  **Bổ sung các class cốt lõi:** Thêm các class đại diện cho `Cửa hàng`, `Kỳ trả góp` và `Chi tiết thanh toán đối tác` vào sơ đồ.
2.  **Sửa mối quan hệ:** Thay đổi mối quan hệ giữa `Contract` và `ContractDetails` từ aggregation sang composition để thể hiện đúng sự phụ thuộc vào vòng đời.
3.  **Di chuyển thuộc tính:** Đặt các thuộc tính vào đúng class của chúng theo logic nghiệp vụ (ví dụ: `unitPrice` vào `ContractDetails`, `partnerPrice` vào `Item`).
4.  **Loại bỏ các yếu tố thừa:** Xóa bỏ các class (`Bill`, `PartnerItemPrice`) và các thuộc tính không cần thiết hoặc dư thừa.
5.  **Bổ sung mối quan hệ:** Xác định và thêm các mối quan hệ association và composition còn thiếu để kết nối các thực thể một cách hợp lý.