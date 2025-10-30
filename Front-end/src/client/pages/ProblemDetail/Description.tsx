import React, {useEffect, useState, useMemo} from "react";
import {MdOutlineDescription} from "react-icons/md";
import {useTranslation} from "react-i18next";
import DOMPurify from "dompurify";
import {getAssignmentByClassId, type IAssignment} from "../../../shared/services/assignmentService";
import {Select, Space, Tag, Typography} from "antd";
import {useNotification} from "../../../shared/notification/useNotification.ts";
import {getTypeUmls, type ITypeUml} from "../../../shared/services/typeUmlService.ts";
import "./Description.scss";

const { Title, Text } = Typography;

// ... (Các interfaces và hằng số UML_TYPES, MODULE_OPTIONS giữ nguyên)

export type UmlTypeOption = {
    value: string;
    label: string;
    key: string;
};

interface IModuleResponse {
    id: number;
    moduleName: string;
    moduleDescription: string;
}

interface ITypeUmlResponse {
    id: number;
    name: string;
}

interface IAssignmentClassModule {
    moduleName: string;
    moduleDescription: string;
}

const MODULE_OPTIONS: UmlTypeOption[] = [
    { value: 'default', label: 'Module: Default', key: 'default' },
    { value: 'server-side', label: 'Module: Server Side', key: 'server-side' },
];


interface IConsolidatedModuleResponse extends IModuleResponse {
    typeUmlIds: Set<number>;
}

// Thêm prop cho UML Type Name được gán trong mode test
type Props = {
    assignment: IAssignment | null;
    isLoading?: boolean;
    error?: string | null;
    umlType: string;
    onUmlTypeChange: (value: string) => void;
    module: string;
    onModuleChange: (value: string) => void;
    umlTypes?: UmlTypeOption[];
    isRenderingOrSubmitting: boolean;
    mode: 'practice' | 'test';
    assignmentClassModule: IAssignmentClassModule | null;
    classId: number | null;
    onTypeUmlNameChange: (name: string) => void;
    onModuleNameChange: (name: string) => void;
};

const Description: React.FC<Props> = ({
                                          assignment,
                                          isLoading,
                                          error,
                                          umlType,
                                          onUmlTypeChange,
                                          onModuleChange,
                                          isRenderingOrSubmitting,
                                          classId,
                                          mode,
                                          onTypeUmlNameChange,
                                          onModuleNameChange,
                                          module: propModule
                                      }) => {
    const { t } = useTranslation();
    const { message } = useNotification();
    const [typeUMLs, setTypeUMLs] = useState<UmlTypeOption[]>([]);
    const [modules, setModules] = useState<IConsolidatedModuleResponse[]>([]);
    const [localModule, setLocalModule] = useState<string>(propModule);
    const [assignedUmlType, setAssignedUmlType] = useState<ITypeUmlResponse | null>(null);

    // Fetch Type UMLs (Giữ nguyên)
    useEffect(() => {
        async function fetchTypeUMLs() {
            try {
                const response = await getTypeUmls();
                const typeUmlsArray = Array.isArray(response.typeUmls)
                    ? response.typeUmls.map((t: ITypeUml) => ({
                        value: String(t.id),
                        label: t.name,
                        key: String(t.id)
                    }))
                    : [];
                setTypeUMLs(typeUmlsArray);
                const initialType = typeUmlsArray.find(t => t.value === umlType);
                if (initialType) {
                    onTypeUmlNameChange(initialType.label);
                }
            } catch (error) {
                console.error('Error fetching Type UMLs:', error);
                message.error(t('common.errorFetchingData'));
            }
        }
        fetchTypeUMLs();
    }, [t, onTypeUmlNameChange, umlType, message]);


    /**
     * Logic chính: Fetch Modules và trích xuất Type UML được gán (mode test).
     */
    useEffect(() => {
        const fetchModules = async (assignmentId: number, classId: number, currentMode: 'practice' | 'test') => {
            try {
                const data: any = await getAssignmentByClassId(classId, assignmentId);

                let modulesToUse: IConsolidatedModuleResponse[] = [];
                let defaultUmlType: ITypeUmlResponse | null = null;
                const consolidatedModuleMap = new Map<number, IConsolidatedModuleResponse>();
                const assignmentClasses = data.assignmentClasses || [];

                // Xác định điều kiện lọc dựa trên mode
                const filterCondition = currentMode === 'test' ? true : false;

                // --- SỬA ĐỔI LỚP LỌC MODULE CHÍNH ---
                const relevantAssignmentClasses = assignmentClasses.filter(
                    (ac: any) =>
                        ac.classId === classId &&
                        ac.checkedTest === filterCondition &&
                        // LỌC CHỈ NHỮNG GÁN NÀO CÓ assignmentId KHỚP VỚI BÀI TẬP HIỆN TẠI
                        ac.assignmentId === assignmentId
                );
                // --- KẾT THÚC SỬA ĐỔI LỚP LỌC MODULE CHÍNH ---

                if (currentMode === 'practice') {
                    // Logic Practice: Lấy tất cả unique modules từ các lần gán practice
                    const uniqueModulesMap = new Map<number, IModuleResponse>();

                    relevantAssignmentClasses.forEach((ac: any) => {
                        (ac.moduleResponses || []).forEach((mod: IModuleResponse) => {
                            const moduleId = mod.id;
                            if (!uniqueModulesMap.has(moduleId)) {
                                uniqueModulesMap.set(moduleId, mod);
                            }
                        });
                    });
                    modulesToUse = Array.from(uniqueModulesMap.values()).map(m => ({
                        ...m,
                        typeUmlIds: new Set<number>()
                    }));

                } else { // mode === 'test'

                    // Logic Test: Chỉ lấy lần gán TEST (chỉ có 1 nếu logic gán là đúng)
                    const testAssignmentClass = relevantAssignmentClasses[0];

                    if (testAssignmentClass) {
                        // 1. Trích xuất Type UML được gán
                        defaultUmlType = testAssignmentClass.typeUmlResponse || null;

                        // 2. Trích xuất modules (thường chỉ có 1 module trong mode test)
                        (testAssignmentClass.moduleResponses || []).forEach((mod: IModuleResponse) => {
                            const moduleId = mod.id;
                            consolidatedModuleMap.set(moduleId, {
                                ...mod,
                                typeUmlIds: new Set<number>(),
                            } as IConsolidatedModuleResponse);
                        });
                    }
                    modulesToUse = Array.from(consolidatedModuleMap.values());
                }

                setModules(modulesToUse);
                setAssignedUmlType(defaultUmlType);

            } catch (error) {
                console.error('Error fetching Modules:', error);
            }
        };

        if (assignment?.id && classId !== null && classId !== undefined) {
            // Đảm bảo assignment.id là số
            fetchModules(Number(assignment.id), classId, mode);
        }

    }, [assignment?.id, classId, mode, t]);


    /**
     * Khởi tạo Module và UML Type mặc định.
     */
    useEffect(() => {
        // --- 1. Khởi tạo/Đồng bộ Module ---
        if (modules.length > 0) {
            const firstModuleId = String(modules[0].id);
            let selectedModuleId = propModule || firstModuleId;
            let moduleChanged = false;

            // Kiểm tra xem module hiện tại (từ prop hoặc local) có hợp lệ không
            const isValidModule = modules.some(m => String(m.id) === selectedModuleId);
            if (!isValidModule) {
                selectedModuleId = firstModuleId;
                moduleChanged = true;
            }

            // Chỉ cập nhật nếu localModule khác giá trị mới hoặc module cần thay đổi
            if (localModule !== selectedModuleId || moduleChanged) {
                setLocalModule(selectedModuleId);
                onModuleChange(selectedModuleId);
                const selectedModule = modules.find(m => String(m.id) === selectedModuleId);
                if (selectedModule) {
                    onModuleNameChange(selectedModule.moduleName);
                }
            }
        } else if (localModule) {
            // Reset localModule nếu không có modules
            setLocalModule('');
            onModuleChange('');
            onModuleNameChange('');
        }

        // --- 2. Khởi tạo UML Type mặc định trong mode test ---
        if (mode === 'test' && assignedUmlType) {
            // Tự động set UML Type được gán nếu nó khác với UML Type hiện tại
            if (umlType !== String(assignedUmlType.id)) {
                onUmlTypeChange(String(assignedUmlType.id));
                onTypeUmlNameChange(assignedUmlType.name);
            }
        }

    }, [modules, propModule, localModule, onModuleChange, onModuleNameChange, mode, assignedUmlType, umlType, onUmlTypeChange, onTypeUmlNameChange]);


    const handleModuleChange = (value: string) => {
        setLocalModule(value);
        onModuleChange(value);
        const selectedModule = modules.find(m => String(m.id) === value);
        if (selectedModule) {
            onModuleNameChange(selectedModule.moduleName);
        }
    };

    const handleUmlTypeChange = (value: string) => {
        onUmlTypeChange(value);
        const selectedType = typeUMLs.find(t => t.value === value);
        if (selectedType) {
            onTypeUmlNameChange(selectedType.label);
        } else {
            const fallback = UML_TYPES.find((t: any) => t.key === value);
            if (fallback) {
                onTypeUmlNameChange(fallback.label);
            }
        }
    };

    const selectUmlTypeOptions = [
        { value: '', label: t('problemDetail.description.selectUmlType', { defaultValue: 'Chọn UML Type' }), disabled: true, key: 'placeholder_uml' },
        ...typeUMLs
    ];

    const moduleOptionsForSelect: UmlTypeOption[] = modules.map(mod => ({
        value: String(mod.id),
        label: mod.moduleName,
        key: String(mod.id)
    }));

    const moduleOptionsFromState = moduleOptionsForSelect.length > 0
        ? moduleOptionsForSelect
        : MODULE_OPTIONS;

    const selectModuleOptions = [
        { value: '', label: t('problemDetail.description.selectModule', { defaultValue: 'Chọn Module' }), disabled: true, key: 'placeholder_module' },
        ...moduleOptionsFromState
    ];

    const currentModuleData = useMemo(() => {
        const selectedModuleId = localModule;
        if (!selectedModuleId) return null;
        return modules.find(m => String(m.id) === selectedModuleId);
    }, [localModule, modules]);

    const moduleDescriptionHtml = currentModuleData?.moduleDescription
        ? DOMPurify.sanitize(currentModuleData.moduleDescription)
        : null;


    const safeHtml = React.useMemo(() => {
        const html = assignment?.commonDescription ?? "";
        return DOMPurify.sanitize(html);
    }, [assignment?.commonDescription]);


    const isDisabled = isLoading || !!error || isRenderingOrSubmitting;

    const headerStyle: React.CSSProperties = {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#333333',
        borderBottom: '1px solid #404040',
        padding: '5px 16px',
        borderRadius: '8px 8px 0 0',
        height: '48px',
    };

    const titleStyle: React.CSSProperties = {
        fontSize: '1.2em',
        fontWeight: '500',
        color: '#e0e0e0',
        margin: 0,
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
    };

    const iconColor = '#0277f6';

    const mainTitleStyle: React.CSSProperties = {
        color: '#e0e0e0',
        fontSize: '20px',
        fontWeight: '600',
    };

    const descriptionContentStyle: React.CSSProperties = {
        padding: '16px',
        overflowY: 'auto',
        flex: 1,
        color: '#b0b0b0',
        backgroundColor: '#262626',
    }

    const showModuleSelect = mode === 'practice';
    const shouldShowModuleDescription = (mode === 'test' || mode === 'practice') && moduleDescriptionHtml;

    return (
        <div className="description">
            <div className="description__header" style={headerStyle}>
                <h2 className="description__header-title" style={titleStyle}>
                    <MdOutlineDescription color={iconColor} style={{ fontSize: '20px' }} />
                    {t("problemDetail.description.title", { defaultValue: "Mô tả" })}
                </h2>

                <div className="description__controls" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Space wrap size="small">
                        <Select
                            value={umlType || undefined}
                            style={{ width: 180 }}
                            onChange={handleUmlTypeChange}
                            options={selectUmlTypeOptions}
                            disabled={isDisabled || (mode === 'test' && assignedUmlType !== null)} // Disable nếu ở mode test và đã có UML Type được gán
                            size="middle"
                            placeholder={t('problemDetail.description.selectUmlType', { defaultValue: 'Chọn UML Type' })}
                        />

                        {/* HIỂN THỊ SELECT MODULE CHỈ Ở MODE PRACTICE */}
                        {showModuleSelect && (
                            <Select
                                value={localModule || undefined}
                                style={{ width: 180 }}
                                onChange={handleModuleChange}
                                options={selectModuleOptions}
                                disabled={isDisabled}
                                size="middle"
                                placeholder={t('problemDetail.description.selectModule', { defaultValue: 'Chọn Module' })}
                            />
                        )}
                    </Space>
                </div>
            </div>

            {isLoading && (
                <div className="description__state">
                    {t("common.loading") || "Loading..."}
                </div>
            )}
            {error && !isLoading && (
                <div className="description__state description__state--error">
                    {error}
                </div>
            )}

            {assignment && (
                <div className="description__content" style={descriptionContentStyle}>
                    {assignment.title && (
                        <h2 style={mainTitleStyle}>{assignment.title}</h2>
                    )}

                    {assignment.commonDescription && (
                        <div className="description__assignment-text">
                            <div
                                className="description__assignment-html"
                                dangerouslySetInnerHTML={{ __html: safeHtml }}
                            />
                        </div>
                    )}

                    {/* HIỂN THỊ MODULE DESCRIPTION */}
                    {shouldShowModuleDescription && (
                        <>
                            <h3 style={{ color: '#e0e0e0', marginTop: '16px' }}>
                                {t('problemDetail.description.module_description_title', { defaultValue: 'Module' })} - {currentModuleData?.moduleName}
                            </h3>
                            <div className="description__module-text">
                                <div
                                    className="description__module-html"
                                    dangerouslySetInnerHTML={{ __html: moduleDescriptionHtml }}
                                />
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default Description;