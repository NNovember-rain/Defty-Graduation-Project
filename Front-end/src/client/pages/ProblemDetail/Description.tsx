import React, {useEffect, useState, useMemo} from "react";
import {MdOutlineDescription} from "react-icons/md";
import {useTranslation} from "react-i18next";
import DOMPurify from "dompurify";
import {getAssignmentByClassId, getAssignmentById, type IAssignment} from "../../../shared/services/assignmentService";
import {Select, Space} from "antd";
import {useNotification} from "../../../shared/notification/useNotification.ts";
import {getTypeUmls, type ITypeUml} from "../../../shared/services/typeUmlService.ts";
import "./Description.scss";

// Định nghĩa các loại UML được hỗ trợ bởi Kroki
const UML_TYPES = [
    { key: "plantuml", label: "PlantUML (Default)" },
    { key: "mermaid", label: "Mermaid" },
    { key: "graphviz", label: "Graphviz" },
    { key: "ditaa", label: "Ditaa" },
];

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

interface IAssignmentClassModule {
    moduleName: string;
    moduleDescription: string;
}

const MODULE_OPTIONS: UmlTypeOption[] = [
    { value: 'default', label: 'Module: Default', key: 'default' },
    { value: 'server-side', label: 'Module: Server Side', key: 'server-side' },
];

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
                                          onModuleNameChange
                                      }) => {
    const { t } = useTranslation();
    const { message } = useNotification();
    const [typeUMLs, setTypeUMLs] = useState<UmlTypeOption[]>([]);
    const [modules, setModules] = useState<IModuleResponse[]>([]);
    const [module, setModule] = useState<string>('');

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
                // Set initial typeUmlName if umlType matches
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
    }, [t, onTypeUmlNameChange]);


    useEffect(() => {
        const fetchModules = async (assignmentId: number, classId: number, currentMode: 'practice' | 'test') => {
            try {
                // 1. GỌI API ĐỂ LẤY DỮ LIỆU ĐẦY ĐỦ
                const data = await getAssignmentByClassId(classId, assignmentId);

                console.log('Fetched Assignment Data for Mode:', currentMode, data);

                let modulesToUse: IModuleResponse[] = [];

                if (currentMode === 'test') {
                    // CHẾ ĐỘ TEST: Lấy modules từ assignmentClasses[0].moduleResponses
                    const assignmentClasses = data.assignmentClasses;
                    if (
                        Array.isArray(assignmentClasses) &&
                        assignmentClasses.length > 0 &&
                        Array.isArray(assignmentClasses[0].moduleResponses)
                    ) {
                        // Thêm logic loại bỏ module bị trùng lặp ở đây
                        const uniqueModulesMap = new Map();
                        assignmentClasses[0].moduleResponses.forEach((mod: IModuleResponse) => {
                            if (!uniqueModulesMap.has(mod.id)) {
                                uniqueModulesMap.set(mod.id, mod);
                            }
                        });
                        modulesToUse = Array.from(uniqueModulesMap.values());
                    }
                } else {
                    // CHẾ ĐỘ PRACTICE (hoặc mode khác): Lấy modules từ modules chung (đã loại bỏ trùng lặp từ server)
                    if (data && Array.isArray(data.modules)) {
                        modulesToUse = data.modules;
                    }
                }

                setModules(modulesToUse);

            } catch (error) {
                console.error('Error fetching Modules:', error);
                message.error(t('common.errorFetchingModules') || 'Lỗi khi tải modules');
            }
        };

        // CHỈ GỌI KHI assignment.id VÀ classId ĐỀU CÓ GIÁ TRỊ
        if (assignment?.id && classId !== null && classId !== undefined) {
            // Truyền cả mode vào hàm fetchModules
            fetchModules(assignment.id, classId, mode);
        }

    }, [assignment?.id, classId, mode, t]);

    useEffect(() => {
        if (modules.length > 0 && !module) {
            const firstModuleId = String(modules[0].id);
            onModuleChange(firstModuleId);
            onModuleNameChange(modules[0].moduleName);
        }
    }, [modules, module, onModuleChange, onModuleNameChange]);

    const handleModuleChange = (value: string) => { // Sửa IModuleResponse thành string
        setModule(value);
        onModuleChange(value);
        // Gọi callback để set moduleName
        const selectedModule = modules.find(m => String(m.id) === value);
        if (selectedModule) {
            onModuleNameChange(selectedModule.moduleName);
        }
    };

    const handleUmlTypeChange = (value: string) => {
        onUmlTypeChange(value);
        // Gọi callback để set typeUmlName
        const selectedType = typeUMLs.find(t => t.value === value);
        if (selectedType) {
            onTypeUmlNameChange(selectedType.label);
        } else {
            // Fallback to UML_TYPES
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
        const selectedModuleId = module;
        if (!selectedModuleId) return null;
        return modules.find(m => String(m.id) === selectedModuleId);
    }, [module, modules]);

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
                            disabled={isDisabled}
                            size="middle"
                            placeholder={t('problemDetail.description.selectUmlType', { defaultValue: 'Chọn UML Type' })}
                        />

                        <Select
                            value={module || undefined}
                            style={{ width: 180 }}
                            onChange={handleModuleChange}
                            options={selectModuleOptions}
                            disabled={isDisabled}
                            size="middle"
                            placeholder={t('problemDetail.description.selectModule', { defaultValue: 'Chọn Module' })}
                        />
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

                    {moduleDescriptionHtml && (
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