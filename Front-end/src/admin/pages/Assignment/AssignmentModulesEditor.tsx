import React, {useEffect, useState} from 'react';
import {useTranslation} from 'react-i18next';
import TextEditor from '../../components/TextEditor/TextEditor';
import {Button, Card, Col, Collapse, Form, Input, message, Modal, Row, Select, Space, Tooltip} from 'antd';
import {CodeOutlined, DeleteOutlined, PlusOutlined, EditOutlined} from '@ant-design/icons';
import {getTypeUmls, type ITypeUml} from "../../../shared/services/typeUmlService.ts";

interface Option {
    value: string;
    label: string;
}

interface ModuleDetail {
    typeUmlId: string;
    solutionCode: string;
}

interface ModuleData {
    moduleName: string;
    description: string;
    umlSolutions: ModuleDetail[];
    id: number;
}

interface AssignmentModulesEditorProps {
    value: ModuleData[];
    onChange: (modules: ModuleData[]) => void;
    typeUmlOptions: Option[]; // Giữ lại để dùng cho hiển thị tên UML
    disabled?: boolean;
}

const initialUmlSolution: ModuleDetail = {
    typeUmlId: '',
    solutionCode: '',
};

const createInitialModule = (): ModuleData => ({
    moduleName: '',
    description: '',
    umlSolutions: [{ ...initialUmlSolution }],
    id: Date.now() + Math.random(),
});


interface ModuleModalProps {
    isVisible: boolean;
    onClose: () => void;
    onSave: (module: ModuleData, originalIndex: number | null) => void;
    t: (key: string) => string;
    disabled?: boolean;
    initialData: ModuleData | null;
    originalIndex: number | null;
}

const ModuleModal: React.FC<ModuleModalProps> = ({ isVisible, onClose, onSave, t, disabled, initialData, originalIndex }) => {

    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [typeUMLs, setTypeUMLs] = useState<ITypeUml[]>([]);
    const [optionsLoading, setOptionsLoading] = useState(false);

    useEffect(() => {
        async function fetchTypeUMLs() {
            setOptionsLoading(true);
            try {
                const response = await getTypeUmls();
                setTypeUMLs(response.typeUmls);
            } catch (error) {
                console.error('Error fetching Type UMLs:', error);
                message.error(t('common.errorFetchingData'));
            } finally {
                setOptionsLoading(false);
            }
        }
        fetchTypeUMLs();
    }, [t]);

    const typeUmlOptions: Option[] = typeUMLs.map(uml => ({
        value: uml.name,
        label: uml.name,
    })).filter(opt => opt.value);

    useEffect(() => {
        if (isVisible) {
            const data = initialData ? JSON.parse(JSON.stringify(initialData)) : createInitialModule();
            if (data.umlSolutions.length === 0) {
                data.umlSolutions = [{ ...initialUmlSolution }];
            }
            form.setFieldsValue(data);
        } else {
            form.resetFields();
        }
    }, [isVisible, initialData, form]);

    const handleOk = async () => {
        if (disabled) return;
        setLoading(true);
        try {
            const values = await form.validateFields();

            const validUmlSolutions = (values.umlSolutions || []).filter(
                (sol: ModuleDetail) => sol.typeUmlId && sol.solutionCode && sol.solutionCode.trim()
            );

            if (!validUmlSolutions.length) {
                message.error(t('assignmentForm.solutionRequired') || 'Module phải có ít nhất một Solution Code hợp lệ.');
                setLoading(false);
                return;
            }

            const moduleToSave: ModuleData = {
                ...values,
                umlSolutions: validUmlSolutions,
                id: initialData?.id || Date.now() + Math.random(),
            };

            onSave(moduleToSave, originalIndex);
            message.success(t(originalIndex !== null ? 'common.editSuccess' : 'common.addSuccess') || 'Lưu thành công.');
            setLoading(false);
            onClose();

        } catch (errorInfo) {
            message.warning(t('assignmentForm.moduleValidationRequired') || 'Vui lòng kiểm tra lại các trường bắt buộc.');
            setLoading(false);
        }
    };

    const modalWidth = Math.min(window.innerWidth * 0.9, 1400);
    const FIXED_MODAL_HEIGHT = window.innerHeight * 0.8;
    const HEADER_FOOTER_HEIGHT = 120;
    const CONTENT_HEIGHT = FIXED_MODAL_HEIGHT - HEADER_FOOTER_HEIGHT;

    const title = originalIndex !== null ? t('assignmentForm.editModuleTitle') : t('assignmentForm.addModuleTitle');

    return (
        <Modal
            title={<span style={{ fontWeight: 700 }}>{title}</span>}
            open={isVisible}
            onCancel={onClose}
            width={modalWidth}
            centered
            destroyOnClose={true}
            confirmLoading={loading || optionsLoading}
            bodyStyle={{
                padding: '0 16px 16px',
                maxHeight: FIXED_MODAL_HEIGHT,
                overflowY: 'hidden'
            }}
            footer={[
                <Button key="back" onClick={onClose} disabled={disabled || optionsLoading}>
                    {t('common.cancel')}
                </Button>,
                <Button
                    key="submit"
                    type="primary"
                    onClick={handleOk}
                    loading={loading || optionsLoading}
                    disabled={disabled || optionsLoading}
                >
                    {t('common.save')}
                </Button>,
            ]}
        >
            <div style={{ maxHeight: CONTENT_HEIGHT, overflowY: 'auto', paddingBottom: 20 }}>
                <Form
                    form={form}
                    layout="vertical"
                    initialValues={initialData || createInitialModule()}
                    style={{ marginTop: 20 }}
                >
                    <Form.Item
                        name="moduleName"
                        label={<span style={{ fontWeight: 600 }}>{t('assignmentForm.moduleName')}</span>}
                        rules={[{ required: true, message: t('assignmentForm.moduleNameRequired') || 'Vui lòng nhập tên Module!' }]}
                    >
                        <Input disabled={disabled} placeholder={t('assignmentForm.moduleNamePlaceholder')}/>
                    </Form.Item>


                    <Form.Item
                        name="description"
                        label={<span style={{ fontWeight: 600 }}>{t('assignmentForm.descriptionLabel')}</span>}
                        rules={[{ required: true, message: t('assignmentForm.descriptionRequired') || 'Vui lòng nhập mô tả!' }]}
                    >
                        <TextEditor
                            onChange={(val: string) => form.setFieldsValue({ description: val })}
                            value={form.getFieldValue('description')}
                            disabled={disabled}
                            placeholder={t('assignmentForm.descriptionPlaceholder')}
                            style={{ minHeight: 180 }}
                        />
                    </Form.Item>

                    <Card
                        title={<h3 style={{ color: '#0056b3', margin: 0 }}>{t('assignmentForm.umlSolutionsLabel')}</h3>}
                        size="small"
                        style={{ marginBottom: 20, border: '1px solid #1890ff', backgroundColor: '#f0f9ff' }}
                    >
                        <Form.List
                            name="umlSolutions"
                        >
                            {(fields, { add, remove }) => (
                                <>
                                    {fields.map(({ key, name, fieldKey, ...restField }, index) => (
                                        <Collapse
                                            key={key}
                                            defaultActiveKey={['1']}
                                            style={{ marginBottom: 12, border: '1px solid #d9d9d9', borderRadius: 6 }}
                                        >
                                            <Collapse.Panel
                                                key="1"
                                                header={<span style={{ fontWeight: 600, color: '#333' }}>
                                                    {t('assignmentForm.solution')} {index + 1}
                                                </span>}
                                                extra={
                                                    <Space size="small">
                                                        <Tooltip title={t('common.delete')}>
                                                            <Button
                                                                type="text"
                                                                danger
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    remove(name);
                                                                }}
                                                                icon={<DeleteOutlined />}
                                                                disabled={fields.length === 1 || disabled || optionsLoading}
                                                            />
                                                        </Tooltip>
                                                    </Space>
                                                }
                                            >
                                                <Row gutter={16} style={{ marginTop: 10 }}>

                                                    <Col span={4}>
                                                        <Form.Item
                                                            {...restField}
                                                            name={[name, 'typeUmlId']}
                                                            fieldKey={[fieldKey, 'typeUmlId']}
                                                            label={<span style={{ fontWeight: 500 }}>{t('assignmentForm.typeUmlLabel')}</span>}
                                                            rules={[{ required: true, message: t('assignmentForm.typeUmlRequired') || 'Chọn Type UML!' }]}
                                                        >
                                                            <Select
                                                                disabled={disabled || optionsLoading} // Disabled khi đang loading
                                                                placeholder={t('assignmentForm.selectTypeUml')}
                                                                options={typeUmlOptions} // <-- Sử dụng options đã format
                                                                loading={optionsLoading} // Hiển thị loading state
                                                            />
                                                        </Form.Item>
                                                    </Col>

                                                    <Col span={20}>
                                                        <Form.Item
                                                            {...restField}
                                                            name={[name, 'solutionCode']}
                                                            fieldKey={[fieldKey, 'solutionCode']}
                                                            label={<span style={{ fontWeight: 500 }}><CodeOutlined /> {t('assignmentForm.solutionCodeLabel')}</span>}
                                                            rules={[{ required: true, message: t('assignmentForm.solutionCodeRequired') || 'Nhập Solution Code!' }]}
                                                        >
                                                            <TextEditor
                                                                onChange={(val: string) => {
                                                                    const solutions = form.getFieldValue('umlSolutions');
                                                                    if (solutions && solutions[index]) {
                                                                        solutions[index].solutionCode = val;
                                                                        form.setFieldsValue({ umlSolutions: solutions });
                                                                    }
                                                                }}
                                                                value={form.getFieldValue(['umlSolutions', index, 'solutionCode'])}
                                                                disabled={disabled}
                                                                style={{ minHeight: 180, width: '100%' }}
                                                                placeholder={t('assignmentForm.solutionCodePlaceholder')}
                                                            />
                                                        </Form.Item>
                                                    </Col>
                                                </Row>
                                            </Collapse.Panel>
                                        </Collapse>
                                    ))}

                                    <Form.Item style={{ marginBottom: 0 }}>
                                        <Button
                                            type="dashed"
                                            onClick={() => add(initialUmlSolution)}
                                            block
                                            icon={<PlusOutlined />}
                                            disabled={disabled || optionsLoading}
                                            style={{ marginTop: 10, borderColor: '#0056b3', color: '#0056b3' }}
                                        >
                                            {t('assignmentForm.addUmlSolution')}
                                        </Button>
                                    </Form.Item>
                                </>
                            )}
                        </Form.List>
                    </Card>
                </Form>
            </div>
        </Modal>
    );
};


const AssignmentModulesEditor: React.FC<AssignmentModulesEditorProps> = ({
                                                                             value,
                                                                             onChange,
                                                                             typeUmlOptions,
                                                                             disabled
                                                                         }) => {
    const { t } = useTranslation();
    const modules = Array.isArray(value) ? value.map(m => m.id ? m : { ...m, id: Date.now() + Math.random() }) : [];

    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingModule, setEditingModule] = useState<{ data: ModuleData, index: number } | null>(null);
    const [activeKey, setActiveKey] = useState<string | string[]>([]);

    const handleDeleteModule = (moduleIndex: number) => {
        Modal.confirm({
            title: t('common.confirmDelete'),
            content: t('assignmentForm.confirmDeleteModule') || 'Bạn có chắc chắn muốn xóa Module này không? Thao tác này không thể hoàn tác.',
            okText: t('common.delete'),
            okType: 'danger',
            cancelText: t('common.cancel'),
            onOk() {
                const newModules = modules.filter((_, i) => i !== moduleIndex);
                onChange(newModules);
                setActiveKey([]);
                message.success(t('assignmentForm.deleteModuleSuccess') || 'Đã xóa Module thành công.');
            },
        });
    };

    const handleOpenEditModal = (module: ModuleData, index: number | null) => {
        // Clone data để tránh thay đổi trực tiếp state
        const dataToEdit = index !== null ? JSON.parse(JSON.stringify(module)) : createInitialModule();

        setEditingModule(index !== null ? { data: dataToEdit, index: index } : null);
        setIsModalVisible(true);
    };

    /**
     * @description Lưu Module và đảm bảo Panel được mở trên giao diện chính.
     */
    const handleSaveModule = (moduleToSave: ModuleData, originalIndex: number | null) => {
        let newModules = [...modules];
        let savedModuleId: number;

        if (originalIndex !== null) {
            // Trường hợp SỬA
            newModules[originalIndex] = moduleToSave;
            savedModuleId = moduleToSave.id;
        } else {
            // Trường hợp THÊM MỚI
            newModules = [...modules, moduleToSave];
            savedModuleId = moduleToSave.id;
        }

        // 1. Cập nhật state của Form cha
        onChange(newModules);

        // 2. Tự động mở Panel của Module vừa lưu
        setActiveKey([savedModuleId.toString()]);

        setEditingModule(null);
    };

    const handleCloseModal = () => {
        setIsModalVisible(false);
        setEditingModule(null);
    };

    // Hàm này vẫn cần typeUmlOptions để hiển thị tên trong giao diện chính
    const getUmlName = (id: string) => typeUmlOptions.find(opt => opt.value === id)?.label || t('common.unknownType');

    return (
        <div>
            <Collapse
                onChange={setActiveKey}
                activeKey={activeKey}
                expandIconPosition="end"
                style={{ marginBottom: 16 }}
            >
                {modules.map((module, index) => (
                    <Collapse.Panel
                        key={module.id.toString()}
                        header={<span style={{ fontWeight: 600 }}>{module.moduleName || t('assignmentForm.untitledModule')}</span>}
                        extra={
                            <Space size="small">
                                <Tooltip title={t('common.edit')}>
                                    <Button
                                        type="text"
                                        icon={<EditOutlined />}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleOpenEditModal(module, index);
                                        }}
                                        disabled={disabled}
                                    />
                                </Tooltip>
                                <Tooltip title={t('common.delete')}>
                                    <Button
                                        type="text"
                                        danger
                                        icon={<DeleteOutlined />}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteModule(index);
                                        }}
                                        disabled={disabled}
                                    />
                                </Tooltip>
                            </Space>
                        }
                    >

                        <div dangerouslySetInnerHTML={{ __html: module.description }} style={{ marginBottom: 10 }} />
                        <h4 style={{ color: '#0056b3', marginTop: 15 }}>{t('assignmentForm.umlSolutionsLabel')}</h4>
                        <ul style={{ paddingLeft: 20 }}>
                            {module.umlSolutions.map((sol, solIndex) => {
                                const CODE_PREVIEW_LENGTH = 70;
                                const rawCode = sol.solutionCode.replace(/<[^>]*>?/gm, '').trim();
                                const codePreview = rawCode.substring(0, CODE_PREVIEW_LENGTH) + (rawCode.length > CODE_PREVIEW_LENGTH ? '...' : '');

                                const tooltipContent = (
                                    <div style={{ maxWidth: 350, fontFamily: 'sans-serif', padding: 5 }}>
                                        <div style={{ fontWeight: 'bold', marginBottom: 5 }}>
                                            {t('assignmentForm.solutionCodePreview') || 'Code Preview'}:
                                        </div>
                                        {/* Sử dụng <pre> để hiển thị code font và định dạng tốt hơn */}
                                        <pre style={{ margin: 0, overflow: 'auto', maxHeight: 200, padding: 8, backgroundColor: '#222', color: '#fff', borderRadius: 4, whiteSpace: 'pre-wrap' }}>
                                            {codePreview}
                                        </pre>
                                        <div style={{ marginTop: 5, color: '#999', fontSize: 10, textAlign: 'right' }}>
                                            {t('assignmentForm.totalLength') || 'Total Length'}: {rawCode.length} {t('common.characters')}
                                        </div>
                                    </div>
                                );

                                return (
                                    <li key={solIndex} style={{ marginBottom: 5, display: 'flex', alignItems: 'center' }}>
                                        <span style={{ marginRight: 8, fontWeight: 500 }}>{getUmlName(sol.typeUmlId)}:</span>
                                        <Tooltip
                                            title={tooltipContent}
                                            placement="rightTop"
                                            color="#333"
                                        >
                                            <span
                                                style={{
                                                    fontFamily: 'monospace',
                                                    backgroundColor: '#e6f7ff',
                                                    padding: '3px 8px',
                                                    borderRadius: 4,
                                                    cursor: 'pointer',
                                                    border: '1px solid #91d5ff',
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    fontSize: 12,
                                                    fontWeight: 600
                                                }}
                                            >
                                                {t('assignmentForm.viewSolutionCode') || 'View Solution Code'}
                                                <CodeOutlined style={{ marginLeft: 5 }} />
                                            </span>
                                        </Tooltip>
                                    </li>
                                );
                            })}
                        </ul>
                    </Collapse.Panel>
                ))}
            </Collapse>

            <Button
                type="primary"
                onClick={() => handleOpenEditModal(createInitialModule(), null)}
                disabled={disabled}
                icon={<PlusOutlined />}
                block
                size="large"
                style={{ backgroundColor: '#1890ff', borderColor: '#1890ff' }}
            >
                {t('assignmentForm.addNewModule')}
            </Button>

            <ModuleModal
                isVisible={isModalVisible}
                onClose={handleCloseModal}
                onSave={handleSaveModule}
                t={t}
                disabled={disabled}
                initialData={editingModule?.data || null}
                originalIndex={editingModule?.index || null}
            />
        </div>
    );
};

export default AssignmentModulesEditor;