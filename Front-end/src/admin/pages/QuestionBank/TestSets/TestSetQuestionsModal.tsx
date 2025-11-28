import React, { useState, useRef } from "react";
import { Modal } from "antd";
import { IoMdAddCircle } from "react-icons/io";
import { FaMinusCircle, FaSortNumericDown } from "react-icons/fa";
import QuestionGroupManagement from "../QuestionGroups";
import {
    addQuestionGroupsToTestSet,
    removeQuestionGroupsFromTestSet,
    type ITestSet, updateQuestionGroupOrders,
} from "../../../../shared/services/questionBankService/testSetService";
import { useNotification } from "../../../../shared/notification/useNotification";

const TestSetQuestionsModal: React.FC<{
    isOpen: boolean;
    testSet: ITestSet | null;
    onClose: () => void;
}> = ({ isOpen, testSet, onClose }) => {
    const { message, modal } = useNotification();

    const [isUpdatingOrder, setIsUpdatingOrder] = useState(false);
    const reloadQuestionGroupsRef = useRef<(() => Promise<void>) | null>(null);
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [selectedRemoveGroups, setSelectedRemoveGroups] = useState<string[]>([]);
    const [isRemoving, setIsRemoving] = useState(false);
    const [isAssigning, setIsAssigning] = useState(false);
    const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
    const [orderMapTestModal, setOrderMapTestModal] = useState<Record<string, number>>({});
    const [orderMapAddModal, setOrderMapAddModal] = useState<Record<string, number>>({});

    if (!testSet) return null;

    const handleAssignClick = () => setIsAssignModalOpen(true);
    const handleAssignClose = () => setIsAssignModalOpen(false);

    const handleConfirmAssign = async () => {
        if (!testSet || selectedGroups.length === 0) return;

        const missingOrderIds = selectedGroups.filter(
            (id) => !orderMapAddModal[id] || orderMapAddModal[id] <= 0
        );

        if (missingOrderIds.length > 0) {
            message.error("Vui lòng nhập thứ tự cho tất cả nhóm câu hỏi đã chọn trước khi gán!");
            return;
        }

        setIsAssigning(true);
        try {
            const payload = selectedGroups.map((id) => ({
                questionGroupId: id,
                questionPartOrder: orderMapAddModal[id],
            }));

            await addQuestionGroupsToTestSet(testSet.id, payload);

            message.success(
                `Đã gán ${selectedGroups.length} nhóm câu hỏi vào đề "${testSet.testName}"`
            );
            setIsAssignModalOpen(false);
            setSelectedGroups([]);
            setOrderMapAddModal({});

            if (reloadQuestionGroupsRef.current) {
                await reloadQuestionGroupsRef.current();
            }
        } catch (err: any) {
            message.error(err.message || "Không thể gán nhóm câu hỏi vào đề");
        } finally {
            setIsAssigning(false);
        }
    };

    /** 🗑 GỠ NHÓM KHỎI ĐỀ */
    const handleConfirmRemove = async () => {
        if (!testSet || selectedRemoveGroups.length === 0) return;

        modal.deleteConfirm(
            "Gỡ nhóm khỏi đề thi",
            async () => {
                setIsRemoving(true);
                try {
                    await removeQuestionGroupsFromTestSet(testSet.id, selectedRemoveGroups);
                    message.success(
                        `Đã gỡ ${selectedRemoveGroups.length} nhóm câu hỏi khỏi đề "${testSet.testName}"`
                    );
                    setSelectedRemoveGroups([]);

                    if (reloadQuestionGroupsRef.current) {
                        await reloadQuestionGroupsRef.current();
                    }
                } catch (err: any) {
                    message.error(err.message || "Không thể gỡ nhóm câu hỏi khỏi đề");
                } finally {
                    setIsRemoving(false);
                }
            },
            "Bạn có chắc chắn muốn gỡ các nhóm này khỏi đề thi?"
        );
    };

    /** 🔄 CẬP NHẬT THỨ TỰ NHÓM CÂU HỎI TRONG ĐỀ */
    const handleUpdateOrder = async () => {
        if (!testSet) return;

        // ✅ Kiểm tra có item nào được chọn không
        if (!selectedRemoveGroups || selectedRemoveGroups.length === 0) { // ✅ Thêm check null
            message.warning("Vui lòng chọn ít nhất một nhóm câu hỏi để cập nhật thứ tự.");
            return;
        }

        // ✅ Lọc chỉ những item đã chọn VÀ có order hợp lệ
        const selectedOrders = Object.entries(orderMapTestModal).filter(
            ([id, _]) => selectedRemoveGroups.includes(id)
        );

        if (selectedOrders.length === 0) {
            message.warning("Không có thay đổi thứ tự nào để cập nhật.");
            return;
        }

        // ✅ Kiểm tra order hợp lệ CHỈ cho các item đã chọn
        const invalidOrders = selectedOrders.filter(([_, order]) => !order || order <= 0);

        if (invalidOrders.length > 0) {
            message.error("Vui lòng nhập đầy đủ thứ tự hợp lệ (>=1) cho tất cả nhóm đã chọn!");
            return;
        }

        setIsUpdatingOrder(true);
        try {
            // ✅ Chỉ gửi payload của những item đã chọn
            const payload = selectedOrders.map(([id, order]) => ({
                questionGroupId: id,
                questionPartOrder: order,
            }));

            await updateQuestionGroupOrders(testSet.id, payload);
            message.success(`Cập nhật thứ tự cho ${payload.length} nhóm câu hỏi thành công.`);

            // ✅ Reset selection và orderMap sau khi update thành công
            setSelectedRemoveGroups([]);

            // ✅ Cập nhật orderMapTestModal với giá trị mới từ payload
            setOrderMapTestModal(prev => {
                const updated = { ...prev };
                payload.forEach(({ questionGroupId, questionPartOrder }) => {
                    updated[questionGroupId] = questionPartOrder;
                });
                return updated;
            });
        } catch (err: any) {
            console.error("Lỗi cập nhật thứ tự:", err);
            message.error(err.message || "Không thể cập nhật thứ tự nhóm câu hỏi.");
        } finally {
            setIsUpdatingOrder(false);
        }
    };

    const customCSS = `
        /* =============================== */
        /* ====== MODAL CHÍNH (ĐỀ THI) ==== */
        /* =============================== */
        
        .test-set-modal .ant-modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          position: relative;
        }
        
        .test-set-modal .ant-modal-title {
          flex-grow: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
        
        /* --- Nút chung: bố cục & hiệu ứng --- */
        .test-set-modal .assign-button,
        .test-set-modal .remove-button,
        .test-set-modal .management-template__filter-toggle {
          position: absolute;
          top: 15px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 6px 14px;
          font-size: 14px;
          font-weight: 500;
          height: 36px;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s ease;
          z-index: 4;
          border: none;
        }
        
        /* --- Nút gỡ khỏi đề --- */
        .test-set-modal .remove-button {
          right: 475px;
          background-color: #dc3545;
          color: #fff;
          box-shadow: 0 2px 6px rgba(220, 53, 69, 0.4);
        }
        .test-set-modal .remove-button:hover:not(:disabled) {
          background-color: #b02a37;
          box-shadow: 0 3px 8px rgba(220, 53, 69, 0.6);
        }
        .test-set-modal .remove-button:disabled {
          background-color: #f3b6bd;
          color: #fff;
          opacity: 0.8;
          cursor: not-allowed;
          box-shadow: none;
        }
        .test-set-modal .remove-button svg {
          font-size: 16px;
        }
        
        /* --- Nút gán thêm --- */
        .test-set-modal .assign-button {
          right: 170px;
          background-color: #0d6efd;
          color: #fff;
          box-shadow: 0 2px 6px rgba(13, 110, 253, 0.4);
        }
        .test-set-modal .assign-button:hover:not(:disabled) {
          background-color: #0a58ca;
          box-shadow: 0 3px 8px rgba(13, 110, 253, 0.6);
        }
        .test-set-modal .assign-button:disabled {
          background-color: #a6c8ff;
          color: #fff;
          opacity: 0.8;
          cursor: not-allowed;
          box-shadow: none;
        }
        .test-set-modal .assign-button svg {
          font-size: 16px;
        }
        
        /* --- Nút ẩn bộ lọc --- */
        .test-set-modal .management-template__filter-toggle {
          right: 50px;
          background-color: #6c757d;
          color: #fff;
          box-shadow: 0 2px 6px rgba(108, 117, 125, 0.4);
        }
        .test-set-modal .management-template__filter-toggle:hover:not(:disabled) {
          background-color: #5a6268;
          box-shadow: 0 3px 8px rgba(108, 117, 125, 0.6);
        }
        .test-set-modal .management-template__filter-toggle:disabled {
          background-color: #b8bfc5;
          color: #fff;
          opacity: 0.8;
          cursor: not-allowed;
          box-shadow: none;
        }
        
        /* --- Nút cập nhật thứ tự --- */
        .test-set-modal .update-order-button {
          position: absolute;
          top: 15px;
          right: 295px;
          background-color: #ffc107;
          color: #212529;
          box-shadow: 0 2px 6px rgba(255, 193, 7, 0.4);
          padding: 6px 14px;
          border-radius: 6px;
          height: 36px;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 6px;
          border: none;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .test-set-modal .update-order-button:hover:not(:disabled) {
          background-color: #e0a800;
          box-shadow: 0 3px 8px rgba(255, 193, 7, 0.6);
        }
        .test-set-modal .update-order-button:disabled {
          background-color: #ffe08a;
          color: #6c757d;
          cursor: not-allowed;
          box-shadow: none;
        }
        
        /* --- Ẩn phần không cần thiết --- */
        .test-set-modal .management-template__create-button,
        .test-set-modal .breadcrumb,
        .test-set-modal .management-template__page-title {
          display: none !important;
        }
        
        .test-set-modal .data-table-section__toolbar,
        .test-set-modal .management-template__header-container {
          margin: 0;
        }
        
        /* --- Khu vực bảng --- */
        .test-set-modal .data-table-section {
          max-height: 74vh;
          overflow-y: auto;
          scrollbar-gutter: stable;
        }
        
        /* --- Khi ẩn bộ lọc: tăng chiều cao --- */
        .test-set-modal .filter-options--hidden + .data-table-section {
          max-height: 85vh !important;
        }
        
        
        /* ================================= */
        /* ====== MODAL CON: GÁN THÊM ====== */
        /* ================================= */
        
        .add-to-test-modal .ant-modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          position: relative;
          margin-bottom: 20px;
        }
        
        /* --- Nút xác nhận gán --- */
        .add-to-test-modal .assign-confirm-button {
          position: absolute;
          top: 15px;
          right: 170px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 6px 14px;
          font-size: 14px;
          font-weight: 500;
          height: 36px;
          border-radius: 6px;
          background-color: #0d6efd;
          color: #fff;
          border: none;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 2px 6px rgba(13, 110, 253, 0.4);
        }
        .add-to-test-modal .assign-confirm-button:hover:not(:disabled) {
          background-color: #0a58ca;
          box-shadow: 0 3px 8px rgba(13, 110, 253, 0.6);
        }
        .add-to-test-modal .assign-confirm-button:disabled {
          background-color: #a6c8ff;
          color: #fff;
          opacity: 0.8;
          cursor: not-allowed;
          box-shadow: none;
        }
        
        /* --- Nút ẩn bộ lọc trong modal con --- */
        .add-to-test-modal .management-template__filter-toggle {
          position: absolute;
          top: 15px;
          right: 50px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 6px 14px;
          font-size: 14px;
          font-weight: 500;
          height: 36px;
          border-radius: 6px;
          background-color: #6c757d;
          color: #fff;
          border: none;
          box-shadow: 0 2px 6px rgba(108, 117, 125, 0.4);
          transition: all 0.2s ease;
        }
        .add-to-test-modal .management-template__filter-toggle:hover:not(:disabled) {
          background-color: #5a6268;
          box-shadow: 0 3px 8px rgba(108, 117, 125, 0.6);
        }
        .add-to-test-modal .management-template__filter-toggle:disabled {
          background-color: #b8bfc5;
          color: #fff;
          opacity: 0.8;
          cursor: not-allowed;
          box-shadow: none;
        }
        
        /* --- Ẩn các phần không cần thiết trong modal con --- */
        .add-to-test-modal .management-template__create-button,
        .add-to-test-modal .breadcrumb,
        .add-to-test-modal .management-template__page-title {
          display: none !important;
        }
        
        .add-to-test-modal .data-table-section__toolbar,
        .add-to-test-modal .management-template__header-container {
          margin: 0;
        }
        
        /* --- Khu vực bảng --- */
        .add-to-test-modal .data-table-section {
          max-height: 74vh;
          overflow-y: auto;
          scrollbar-gutter: stable;
        }
        
        /* --- Khi ẩn bộ lọc: tăng chiều cao --- */
        .add-to-test-modal .filter-options--hidden + .data-table-section {
          max-height: 85vh !important;
        }
    `;


    return (
        <>
            <style>{customCSS}</style>

            {/* ✅ Modal chính */}
            <Modal
                title={
                    <div>
                        <div className="text-lg font-semibold">Danh sách câu hỏi</div>
                        <div className="text-sm text-gray-500 font-normal mt-1">
                            {testSet.testName}
                        </div>
                    </div>
                }
                open={isOpen}
                onCancel={onClose}
                width="95%"
                style={{ top: 20 }}
                footer={null}
                className="test-set-modal"
            >
                {/* Nút gán thêm */}
                <button className="assign-button" onClick={handleAssignClick}>
                    <IoMdAddCircle /> Gán thêm
                </button>

                {/* Nút gỡ khỏi đề */}
                <button
                    className="remove-button"
                    onClick={handleConfirmRemove}
                    disabled={selectedRemoveGroups.length === 0 || isRemoving}
                >
                    <FaMinusCircle />
                    {isRemoving
                        ? "Đang gỡ..."
                        : `Gỡ khỏi đề (${selectedRemoveGroups.length})`}
                </button>

                <button
                    className="update-order-button"
                    onClick={handleUpdateOrder}
                    disabled={selectedRemoveGroups.length === 0 || isUpdatingOrder}
                >
                    <FaSortNumericDown /> {/* hoặc icon khác */}
                    {isUpdatingOrder ? "Đang cập nhật..." : `Cập nhật thứ tự (${selectedRemoveGroups.length})`}
                </button>

                {/* Danh sách câu hỏi */}
                <QuestionGroupManagement
                    viewType="TestModal"
                    testSetId={testSet.id}
                    onSelectedChange={setSelectedRemoveGroups}
                    onOrderChange={setOrderMapTestModal} // ✅ Callback riêng cho modal chính
                    updateSelectedIds={selectedRemoveGroups}
                    onReloadRef={(fn) => (reloadQuestionGroupsRef.current = fn)}
                />
            </Modal>

            {/* ✅ Modal con */}
            <Modal
                title="Gán thêm nhóm câu hỏi"
                open={isAssignModalOpen}
                onCancel={handleAssignClose}
                width="93%"
                style={{ top: 40 }}
                footer={null}
                className="add-to-test-modal"
            >
                <button
                    className="assign-confirm-button"
                    onClick={handleConfirmAssign}
                    disabled={selectedGroups.length === 0 || isAssigning}
                >
                    {isAssigning
                        ? "Đang gán..."
                        : `Xác nhận gán (${selectedGroups.length})`}
                </button>

                <QuestionGroupManagement
                    viewType="AddToTestModal"
                    testSetId={testSet.id}
                    onSelectedChange={setSelectedGroups}
                    onOrderChange={setOrderMapAddModal}
                    updateSelectedIds={selectedRemoveGroups}
                />
            </Modal>
        </>
    );
};

export default TestSetQuestionsModal;