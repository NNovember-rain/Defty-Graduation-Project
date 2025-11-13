import React, {useCallback, useEffect, useMemo, useState} from "react";
import {MdOutlineDescription} from "react-icons/md";
import {useTranslation} from "react-i18next";
import DOMPurify from "dompurify";
import {
    getAssignmentAllModule,
    getAssignmentDetail,
    type IAssignment
} from "../../../shared/services/assignmentService";
import {Select, Space, Tag, Typography} from "antd";
import {useNotification} from "../../../shared/notification/useNotification.ts";
import {getTypeUmls, type ITypeUml} from "../../../shared/services/typeUmlService.ts";
import "./Description.scss";

const { Title } = Typography;

export type UmlTypeOption = {
    value: string;
    label: string;
    key: string;
};

interface ISolutionResponse {
    typeUml: string;
}

interface IModuleResponse {
    id: number;
    moduleName: string;
    moduleDescription: string;
    typeUmls: string[];
    solutionResponses?: ISolutionResponse[];
    checkedTest: boolean;
}

interface ITypeUmlResponse {
    id: number;
    name: string;
}

interface IConsolidatedModuleResponse extends IModuleResponse {
    typeUmlIds: Set<number>;
}

const MODULE_OPTIONS: UmlTypeOption[] = [
    { value: 'default', label: 'Module: Default', key: 'default' },
    { value: 'server-side', label: 'Module: Server Side', key: 'server-side' },
];

interface Option {
    value: string;
    label: string;
}


type Props = {
    assignment: IAssignment | null;
    isLoading?: boolean;
    error?: string | null;
    onUmlTypeChange: (value: string) => void;
    module: string;
    onModuleChange: (value: string) => void;
    umlTypes?: UmlTypeOption[];
    isRenderingOrSubmitting: boolean;
    mode: 'practice' | 'test';
    classId: number | null;
    onTypeUmlNameChange: (name: string) => void;
    onModuleNameChange: (name: string) => void;
    assignmentClassDetailId: number | null;
    assignmentClassId?: number | null;
};

const Description: React.FC<Props> = ({
                                          assignment,
                                          isLoading,
                                          assignmentClassId,
                                          error,
                                          onUmlTypeChange,
                                          onModuleChange,
                                          isRenderingOrSubmitting,
                                          mode,
                                          onTypeUmlNameChange,
                                          onModuleNameChange,
                                          module: propModule,
                                          assignmentClassDetailId
                                      }) => {
    const { t } = useTranslation();
    const { message } = useNotification();
    const [allTypeUMLs, setAllTypeUMLs] = useState<ITypeUml[]>([]);
    const [typeUMLs, setTypeUMLs] = useState<UmlTypeOption[]>([]);
    const [modules, setModules] = useState<IConsolidatedModuleResponse[]>([]);
    const [localModule, setLocalModule] = useState<string>(propModule);
    const [assignedUmlType, setAssignedUmlType] = useState<ITypeUmlResponse | null>(null);

    const [localUmlType, setLocalUmlType] = useState<string>('');


    const currentModuleData = useMemo(() => {
        const selectedModuleId = localModule;
        if (!selectedModuleId) return null;
        return modules.find(m => String(m.id) === selectedModuleId);
    }, [localModule, modules]);

    // Fetch TypeUMLs chỉ một lần khi component mount
    useEffect(() => {
        let isMounted = true;
        
        const fetchTypeUMLs = async () => {
            try {
                const res = await getTypeUmls();
                if (!isMounted) return;
                
                const list = Array.isArray(res.typeUmls) ? res.typeUmls : [];

                const mapped = list.map((item, index) => ({
                    key: item.name || String(index),
                    value: item.name,
                    label: item.name,
                }));

                setAllTypeUMLs(list);
                setTypeUMLs(mapped);

            } catch (err) {
                if (isMounted) {
                    console.error("Lỗi khi load UML Types:", err);
                    message.error(t("common.errorFetchingData"));
                }
            }
        };

        fetchTypeUMLs();
        
        return () => {
            isMounted = false;
        };
    }, []); // Chỉ chạy một lần khi mount

    const typeUmlOptions: UmlTypeOption[] = useMemo(() => {
        return allTypeUMLs.map((uml, index) => ({
            value: uml.name,
            label: uml.name,
            key: uml.name || String(index), // dùng name làm key
        }));
    }, [allTypeUMLs]);


    const fetchModules = useCallback(async () => {
        let data: any;
        let modulesToUse: IConsolidatedModuleResponse[] = [];
        let defaultUmlType: ITypeUmlResponse | null = null;

        try {
            const isTestCondition = mode === 'test' && assignmentClassDetailId !== null && !isNaN(assignmentClassDetailId);
            const isPracticeCondition = mode === 'practice' && assignmentClassId;

            if (!isTestCondition && !isPracticeCondition) {
                return;
            }

            if (isTestCondition) {
                data = await getAssignmentDetail(assignmentClassDetailId!);

                const assignmentClasses = data.assignmentClasses || [];
                const assignmentClass = assignmentClasses[0];

                if (assignmentClass) {
                    defaultUmlType = assignmentClass.typeUmlResponse || null;
                    modulesToUse = (assignmentClass.moduleResponses || []).map((mod: IModuleResponse) => ({
                        ...mod,
                        typeUmlIds: new Set<number>(),
                    } as IConsolidatedModuleResponse));
                } else if (data.modules && Array.isArray(data.modules)) {
                    modulesToUse = data.modules.map((mod: any) => ({
                        id: mod.moduleId,
                        moduleName: mod.moduleName,
                        moduleDescription: mod.moduleDescription,
                        typeUmls: mod.typeUmls || [],
                        checkedTest: mod.checkedTest,
                        typeUmlIds: new Set<number>(),
                    } as IConsolidatedModuleResponse));
                }
            }
            else if (isPracticeCondition) {
                data = await getAssignmentAllModule(assignmentClassId!);

                if (data?.result?.modules && Array.isArray(data.result.modules)) {
                    modulesToUse = data.result.modules.map((mod: any) => ({
                        id: mod.id,
                        moduleName: mod.moduleName,
                        moduleDescription: mod.moduleDescription,
                        typeUmls: mod.solutionResponses?.map((sol: ISolutionResponse) => sol.typeUml) || [],
                        checkedTest: false,
                        typeUmlIds: new Set<number>(),
                    } as IConsolidatedModuleResponse));
                } else if (data?.modules && Array.isArray(data.modules)) {
                    modulesToUse = data.modules.map((mod: any) => ({
                        id: mod.id,
                        moduleName: mod.moduleName,
                        moduleDescription: mod.moduleDescription,
                        typeUmls: mod.solutionResponses?.map((sol: ISolutionResponse) => sol.typeUml) || [],
                        checkedTest: false,
                        typeUmlIds: new Set<number>(),
                    } as IConsolidatedModuleResponse));
                }
            }

            setModules(modulesToUse);
            setAssignedUmlType(defaultUmlType);

        } catch (error) {
            console.error('Error fetching Modules:', error);
        }
    }, [assignmentClassDetailId, assignmentClassId, mode]);

    useEffect(() => {
        fetchModules();
    }, [fetchModules]);


    // Xử lý module selection và UML type assignment
    useEffect(() => {
        const moduleOptionsList = modules.filter(m => mode !== 'practice' || m.checkedTest === false);

        const uniqueModuleMap = new Map<string, IConsolidatedModuleResponse>();
        moduleOptionsList.forEach(m => {
            if (!uniqueModuleMap.has(String(m.id))) {
                uniqueModuleMap.set(String(m.id), m);
            }
        });
        const uniqueModules = Array.from(uniqueModuleMap.values());

        if (uniqueModules.length > 0) {
            const firstModuleId = String(uniqueModules[0].id);
            let selectedModuleId = propModule || firstModuleId;

            const isValidModule = uniqueModules.some(m => String(m.id) === selectedModuleId);
            if (!isValidModule) {
                selectedModuleId = firstModuleId;
            }

            if (localModule !== selectedModuleId) {
                setLocalModule(selectedModuleId);
                onModuleChange(selectedModuleId);
                const selectedModule = uniqueModules.find(m => String(m.id) === selectedModuleId);
                if (selectedModule) {
                    onModuleNameChange(selectedModule.moduleName);
                }
            }
        } else if (localModule) {
            setLocalModule('');
            onModuleChange('');
            onModuleNameChange('');
        }

        // Chỉ set UML type trong test mode nếu chưa có
        if (mode === 'test' && assignedUmlType && localUmlType !== String(assignedUmlType.id)) {
            setLocalUmlType(String(assignedUmlType.id));
            onUmlTypeChange(String(assignedUmlType.id));
            onTypeUmlNameChange(assignedUmlType.name);
        }
    }, [modules, propModule, mode, assignedUmlType, localModule, localUmlType, onModuleChange, onModuleNameChange, onUmlTypeChange, onTypeUmlNameChange]);

    // Khởi tạo UML type mặc định khi có dữ liệu
    useEffect(() => {
        if (allTypeUMLs.length > 0 && !localUmlType && mode === 'practice') {
            const firstUml = allTypeUMLs[0];
            setLocalUmlType(firstUml.name);
            onUmlTypeChange(firstUml.name);
            onTypeUmlNameChange(firstUml.name);
        }
    }, [allTypeUMLs, localUmlType, mode, onUmlTypeChange, onTypeUmlNameChange]);


    const handleModuleChange = (value: string) => {
        setLocalModule(value);
        onModuleChange(value);
        const selectedModule = modules.find(m => String(m.id) === value);
        if (selectedModule) {
            onModuleNameChange(selectedModule.moduleName);
        }
        if (mode === 'practice') {
            setLocalUmlType('');
            onUmlTypeChange('');
            onTypeUmlNameChange('');
        }
    };

    const moduleDescriptionHtml = useMemo(() => {
        const html = currentModuleData?.moduleDescription;
        return html ? DOMPurify.sanitize(html) : null;
    }, [currentModuleData?.moduleDescription]);

    const assignmentDescriptionHtml = useMemo(() => {
        const html = assignment?.assignmentDescription ?? "";
        return DOMPurify.sanitize(html);
    }, [assignment?.assignmentDescription]);


    const moduleOptionsForSelect: UmlTypeOption[] = useMemo(() => {
        const moduleOptionsList = modules.filter(m => mode !== 'practice' || m.checkedTest === false);

        const uniqueModuleMap = new Map<string, IConsolidatedModuleResponse>();
        moduleOptionsList.forEach(m => {
            if (!uniqueModuleMap.has(String(m.id))) {
                uniqueModuleMap.set(String(m.id), m);
            }
        });

        return Array.from(uniqueModuleMap.values()).map(mod => ({
            value: String(mod.id),
            label: mod.moduleName,
            key: String(mod.id)
        }));
    }, [modules, mode]);

    const handleUmlTypeChange = (value: string) => {
        console.log("User chọn UML Type:", value);
        setLocalUmlType(value);
        onUmlTypeChange(value);
        onTypeUmlNameChange(value);
    };


    const moduleOptionsFromState = moduleOptionsForSelect.length > 0
        ? moduleOptionsForSelect
        : MODULE_OPTIONS;

    const selectModuleOptions = [
        { value: '', label: t('problemDetail.description.selectModule', { defaultValue: 'Chọn Module' }), disabled: true, key: 'placeholder_module' },
        ...moduleOptionsFromState
    ];

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
        marginBottom: '10px'
    };

    const descriptionContentStyle: React.CSSProperties = {
        padding: '16px',
        overflowY: 'auto',
        flex: 1,
        color: '#b0b0b0',
        backgroundColor: '#262626',
    }

    const showModuleSelect = moduleOptionsForSelect.length > 0;

    const shouldShowModuleDescription = (mode === 'test' && moduleDescriptionHtml) ||
        (mode === 'practice' && localModule && moduleDescriptionHtml);


    return (
        <div className="description">
            <div className="description__header" style={headerStyle}>
                <h2 className="description__header-title" style={titleStyle}>
                    <MdOutlineDescription color={iconColor} style={{fontSize: '20px'}}/>
                    {t("problemDetail.description.title", {defaultValue: "Mô tả"})}
                </h2>

                <div className="description__controls" style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                    <Space wrap size="small">
                        {mode === 'practice' && (
                            <Select
                                value={localUmlType || undefined}
                                style={{width: 180}}
                                options={typeUMLs}
                                onChange={(val) => {
                                    setLocalUmlType(val);
                                    onUmlTypeChange(val);
                                    const selected = typeUmlOptions.find(opt => opt.value === val);
                                    if (selected) onTypeUmlNameChange(selected.label);
                                }}
                                placeholder="Chọn UML Type"
                            />

                        )}

                        {showModuleSelect && mode === 'practice' && (
                            <Select
                                value={localModule || undefined}
                                style={{width: 180}}
                                onChange={handleModuleChange}
                                options={selectModuleOptions}
                                disabled={isDisabled}
                                size="middle"
                                placeholder={t('problemDetail.description.selectModule', {defaultValue: 'Chọn Module'})}
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
                    <Title level={4} style={mainTitleStyle}>{assignment.assignmentTitle}</Title>
                    <Space size={[0, 8]} wrap style={{display: 'flex', marginTop: '8px', marginBottom: '10px'}}>
                        {mode === "test" && (
                            <Tag color="blue">
                                {currentModuleData?.moduleName || t('common.not_selected', {defaultValue: 'Chưa chọn'})}
                            </Tag>
                        )}

                        {mode === "test" && currentModuleData && Array.isArray(currentModuleData.typeUmls) && (
                            currentModuleData.typeUmls
                                .filter(uml => assignedUmlType?.name !== uml)
                                .map((uml: string) => (
                                    <Tag key={uml} color="purple">
                                        {uml}
                                    </Tag>
                                ))
                        )}
                    </Space>

                    {assignmentDescriptionHtml && (
                        <>
                            <Title level={5} style={{ color: '#e0e0e0', marginTop: '16px' }}>
                                {t('problemDetail.description.assignment_description_title', { defaultValue: 'Mô tả bài tập' })}
                            </Title>
                            <div className="description__assignment-text">
                                <div
                                    dangerouslySetInnerHTML={{ __html: assignmentDescriptionHtml }}
                                />
                            </div>
                        </>
                    )}

                    {shouldShowModuleDescription && (
                        <>
                            <Title level={5} style={{ color: '#e0e0e0', marginTop: '16px' }}>
                                {t('problemDetail.description.module_description_title', { defaultValue: 'Mô tả Module' })}: {currentModuleData?.moduleName}
                            </Title>
                            <div className="description__module-text">
                                <div
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