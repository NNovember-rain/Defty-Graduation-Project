import React, {useCallback, useEffect, useState} from 'react';
import {useNavigate, useParams} from 'react-router-dom';
import {useTranslation} from 'react-i18next';
import Breadcrumb from './Breadcrumb';
import AntdDatePicker from '../../components/DatePicker';
import dayjs, {Dayjs} from 'dayjs';
import {Spin, Tag} from 'antd';
import {useNotification} from "../../../shared/notification/useNotification.ts";

import './FormTemplate.scss';
import DualListBox from "../../components/DualListBox/DualListBox.tsx";
import TextEditor from "../../components/TextEditor/TextEditor.tsx";
import PasswordInput from "../../components/PasswordInput/PasswordInput.tsx";
import AssignmentModulesEditor from "../../pages/Assignment/AssignmentModulesEditor.tsx";

export interface FormField {
    key: string;
    labelKey: string; // Key dịch thuật cho label
    type: 'text' | 'textarea' | 'select' | 'number' | 'datetime' | 'date' | 'password' | 'duallistbox' | 'textEditor' | 'dynamicList' | 'multiSelect';
    placeholderKey?: string; // Key dịch thuật cho placeholder
    options?: { value: string; label: string; [key: string]: any };
    required?: boolean;
    gridSpan?: number; // Cho layout grid
    format?: string;
    hideOnEdit?: boolean;
    itemFields?: FormField[];
}

interface BreadcrumbItem {
    label: string;
    path?: string;
}

// Định nghĩa kiểu cho validation schema
type ValidationSchema<T> = {
    [K in keyof T]?: (value: T[K], t: (key: string) => string) => string | null;
};

interface FormTemplateProps<T extends Record<string, any>> {
    pageTitleKey: string; // Key dịch thuật cho tiêu đề trang
    breadcrumbItems: BreadcrumbItem[];
    formFields: FormField[];
    serviceGetById?: (id: string | number) => Promise<T>;
    serviceCreate?: (data: Omit<T, '_id' | 'createdAt' | 'updatedAt'>) => Promise<T>;
    serviceUpdate?: (id: string | number, data: Partial<Omit<T, '_id' | 'createdAt' | 'updatedAt'>>) => Promise<T>;
    validationSchema?: ValidationSchema<T>;
    redirectPath: string;
    initialData?: T | null;
    customErrorExtractor?: (error: any) => Promise<string> | string;
}

const FormTemplate = <T extends Record<string, any>>({
                                                         pageTitleKey,
                                                         breadcrumbItems,
                                                         formFields,
                                                         serviceGetById,
                                                         serviceCreate,
                                                         serviceUpdate,
                                                         validationSchema,
                                                         redirectPath,
                                                         initialData,
                                                         customErrorExtractor
                                                     }: React.PropsWithChildren<FormTemplateProps<T>>) => {
    const { t } = useTranslation();
    const { id } = useParams<{ id?: string }>();
    const navigate = useNavigate();
    const { message } = useNotification();

    const isEditMode = !!id;

    // State cho dữ liệu form
    const [formData, setFormData] = useState<Partial<T>>({});
    // State cho trạng thái loading (fetch và save)
    const [loading, setLoading] = useState(false);
    // State cho lỗi khi fetch dữ liệu
    const [fetchError, setFetchError] = useState<string | null>(null);
    // State cho lỗi khi lưu dữ liệu
    const [saveError, setSaveError] = useState<string | null>(null);
    // State cho lỗi validation client-side
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

    const getInitialFormState = useCallback(() => {
        const initialFormState: Partial<T> = {};
        formFields.forEach(field => {
            if (field.type === 'select') {
                // Không tự động chọn giá trị đầu tiên, để trống để hiển thị placeholder
                initialFormState[field.key as keyof T] = '' as T[keyof T];
            } else if (field.type === 'number') {
                initialFormState[field.key as keyof T] = undefined as T[keyof T];
            } else {
                initialFormState[field.key as keyof T] = '' as T[keyof T];
            }
        });
        return initialFormState;
    }, [formFields]);

    useEffect(() => {
        const fetchInitialData = async () => {
            if (isEditMode && serviceGetById && id) {
                setLoading(true);
                setFetchError(null);
                try {
                    const data = await serviceGetById(id);
                    console.log(data)
                    setFormData(data);
                } catch (err: any) {
                    console.error("Failed to fetch data:", err);
                    message.error(t('apiMessages.fail'));
                    setFetchError(t('formTemplate.fetchError', { message: err.message || '' }));
                } finally {
                    setLoading(false);
                }
            } else if (!isEditMode) {
                // Reset form data for create mode
                setFormData(getInitialFormState());
            }
            setValidationErrors({}); // Clear validation errors on mode change
        };

        fetchInitialData();
    }, [id, isEditMode, serviceGetById, getInitialFormState, t]);

    // Hàm xử lý thay đổi input
    const handleChange = (key: string, value: any) => {
        setFormData(prev => ({ ...prev, [key]: value }));
        // Xóa lỗi validation khi người dùng bắt đầu nhập
        if (validationErrors[key]) {
            setValidationErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[key];
                return newErrors;
            });
        }
    };

    // Handler cho Ant Design DatePicker với type safety
    const handleDateChange = (key: string, _date: Dayjs | null, dateString: string | string[]) => {
        const finalDateString = Array.isArray(dateString) ? dateString[0] : dateString;
        handleChange(key, finalDateString || '');
    };

    // Hàm xử lý validation client-side
    const validateForm = (): boolean => {
        if (!validationSchema) return true; // Bỏ qua validation nếu không có schema

        const errors: Record<string, string> = {};
        for (const field of formFields) {
            if (field.hideOnEdit) continue;

            if (field.required && (!formData[field.key as keyof T] || formData[field.key as keyof T]?.toString().trim() === '')) {
                errors[field.key] = t(`${field.labelKey}Required`); // Sử dụng labelKey cho thông báo lỗi
            }
            // Áp dụng validation từ schema
            const validator = validationSchema[field.key as keyof T];
            if (validator) {
                // @ts-ignore
                const error = validator(formData[field.key as keyof T], t);
                if (error) {
                    errors[field.key] = error;
                }
            }
        }

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const extractErrorMessage = async (error: any): Promise<string> => {
        try {
            if (error?.response?.data) {
                const data = error.response.data;
                return data.message || data.error || t('formTemplate.unknownError');
            }
            if (error?.data) {
                const data = error.data;
                return data.message || data.error || t('formTemplate.unknownError');
            }
            if (error?.json && typeof error.json === 'function') {
                const errorData = await error.json();
                return errorData.message || errorData.error || t('formTemplate.unknownError');
            }
            if (error?.message) {
                return error.message;
            }
            return t('formTemplate.unknownError');
        } catch (parseError) {
            console.error('Error parsing error message:', parseError);
            return t('formTemplate.parseError');
        }
    };

    // --- Hàm xử lý submit form (Tạo mới hoặc Cập nhật) ---
    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        setSaveError(null);

        if (!validateForm()) {
            return;
        }

        setLoading(true);
        try {
            if (isEditMode && serviceUpdate && id) {
                const response = await serviceUpdate(id, formData);
                message.success(t('apiMessages.updateSuccess'));
                let finalRedirectPath = redirectPath;
                if (response && response.result && redirectPath.includes(':id')) {
                    finalRedirectPath = redirectPath.replace(':id', response.result.toString());
                } else if (response && response.result && redirectPath.endsWith('/id')) {
                    finalRedirectPath = redirectPath.replace('/id', `/${response.result}`);
                }

                navigate(finalRedirectPath);
            } else if (!isEditMode && serviceCreate) {
                const response = await serviceCreate(formData as Omit<T, '_id' | 'createdAt' | 'updatedAt'>);
                message.success(t('apiMessages.createSuccess'));

                // Support dynamic redirectPath với placeholder
                let finalRedirectPath = redirectPath;
                if (response && response.result && redirectPath.includes(':id')) {
                    finalRedirectPath = redirectPath.replace(':id', response.result.toString());
                } else if (response && response.result && redirectPath.endsWith('/id')) {
                    finalRedirectPath = redirectPath.replace('/id', `/${response.result}`);
                }

                navigate(finalRedirectPath);
            } else {
                message.error(t('apiMessages.fail'));
                throw new Error("Service functions not provided for this operation.");
            }
        } catch (err: any) {
            let errorMessage = "";

            if (customErrorExtractor) {
                errorMessage = await Promise.resolve(customErrorExtractor(err));
            } else {
                errorMessage = await extractErrorMessage(err);
            }

            message.error(t('apiMessages.fail'));
            setSaveError(t('formTemplate.saveError', { message: errorMessage }));
        } finally {
            setLoading(false);
        }
    }, [validateForm, isEditMode, serviceUpdate, id, formData, serviceCreate, message, t, navigate, redirectPath, extractErrorMessage]);

    // --- Hàm xử lý Clear form ---
    const handleClear = useCallback(() => {
        setFormData(getInitialFormState()); // Reset form về trạng thái ban đầu
        setValidationErrors({}); // Xóa lỗi validation
        setSaveError(null); // Xóa lỗi lưu
        setFetchError(null); // Xóa lỗi fetch
    }, [getInitialFormState]);

    // Tiêu đề trang
    const currentPageTitle = t(pageTitleKey);
    const pageHeading = isEditMode ? t('formTemplate.editTitle', { title: currentPageTitle }) : t('formTemplate.createTitle', { title: currentPageTitle });

    if (loading && isEditMode && Object.keys(formData).length === 0) {
        return (
            <div className="form-template">
                <div className="form-template__header-container">
                    <h1 className="form-template__page-title">{pageHeading}</h1>
                    <Breadcrumb items={breadcrumbItems} />
                </div>
                <div className="form-template__content text-center py-8">
                    <Spin size="large" />
                    <p className="mt-4">{t('common.loadingData')}</p>
                </div>
            </div>
        );
    }

    if (fetchError) {
        return (
            <div className="form-template">
                <div className="form-template__header-container">
                    <h1 className="form-template__page-title">{pageHeading}</h1>
                    <Breadcrumb items={breadcrumbItems} />
                </div>
                <div className="form-template__content text-red-500 text-center py-8">
                    {fetchError}
                </div>
            </div>
        );
    }

    return (
        <div className="form-template">
            <div className="form-template__header-container">
                <div className="form-template__left">
                    <h1 className="form-template__page-title">{pageHeading}</h1>
                </div>
                <div className="form-template__right">
                    <Breadcrumb items={breadcrumbItems} />
                </div>
            </div>
            <div className="form-template__content">
                <div className="form-template__form-container">
                    {saveError && (
                        <div className="form-template__error-message" role="alert">
                            <strong className="font-bold">{t('common.error')}: </strong>
                            <span className="block sm:inline">{saveError}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="form-template__grid-layout">
                            {formFields
                                .filter(field => !(field.hideOnEdit && isEditMode))
                                .map(field => (
                                <div
                                    key={field.key}
                                    className={`form-template__form-group ${field.gridSpan ? `form-template__col-span-${field.gridSpan}` : ''} ${validationErrors[field.key] ? 'has-error' : ''}`}
                                >
                                    <label htmlFor={field.key} className="form-template__label">
                                        {t(field.labelKey)} {field.required && <span className="required-star">*</span>}
                                    </label>

                                    {field.type === 'text' && (
                                        <input
                                            type="text"
                                            id={field.key}
                                            name={field.key}
                                            value={(formData && formData[field.key as keyof T]) ?? ''}
                                            onChange={(e) => handleChange(field.key, e.target.value)}
                                            className="form-template__input"
                                            placeholder={field.placeholderKey ? t(field.placeholderKey) : ''}
                                            disabled={loading}
                                        />
                                    )}

                                    {field.type === 'number' && (
                                        <input
                                            type="number"
                                            id={field.key}
                                            name={field.key}
                                            value={formData[field.key as keyof T] || ''}
                                            onChange={(e) => handleChange(field.key, e.target.value === '' ? undefined : Number(e.target.value))}
                                            className="form-template__input"
                                            placeholder={field.placeholderKey ? t(field.placeholderKey) : ''}
                                            disabled={loading}
                                        />
                                    )}

                                    {field.type === 'textarea' && (
                                        <textarea
                                            id={field.key}
                                            name={field.key}
                                            value={(formData && formData[field.key as keyof T]) ?? ''}
                                            onChange={(e) => handleChange(field.key, e.target.value)}
                                            rows={field.key === 'templateString' ? 8 : 3}
                                            className={`form-template__input form-template__textarea ${field.key === 'templateString' ? 'form-template__font-mono form-template__text-sm' : ''}`}
                                            placeholder={field.placeholderKey ? t(field.placeholderKey) : ''}
                                            disabled={loading}
                                        ></textarea>
                                    )}

                                    {field.type === 'select' && (
                                        <div className="form-template__select-wrapper">
                                            {field.loading && (
                                                <div className="form-template__select-loading">
                                                    <Spin size="small" />
                                                </div>
                                            )}
                                            <select
                                                id={field.key}
                                                name={field.key}
                                                value={formData[field.key as keyof T]?.toString() ?? ''}
                                                onChange={(e) => {
                                                    const value = e.target.value;
                                                    if (value === '') {
                                                        handleChange(field.key, '');
                                                        return;
                                                    }

                                                    const option = field.options?.find(opt => opt.value.toString() === value);
                                                    if (option) {
                                                        handleChange(field.key, option.value);
                                                    } else {
                                                        handleChange(field.key, value);
                                                    }
                                                }}
                                                className="form-template__input form-template__select"
                                                disabled={loading || field.disabled || field.loading}
                                            >
                                                <option value="">
                                                    {field.loading
                                                        ? t('common.loading')
                                                        : (field.placeholder || (field.placeholderKey ? t(field.placeholderKey) : ''))
                                                    }
                                                </option>
                                                {field.options?.map(option => (
                                                    <option key={option.value} value={option.value}>
                                                        {option.label}
                                                    </option>
                                                ))}
                                            </select>
                                            {field.error && (
                                                <p className="form-template__error-text">{field.error}</p>
                                            )}
                                        </div>
                                    )}

                                    {field.type === 'datetime' && (
                                        <AntdDatePicker
                                            id={field.key}
                                            showTime={{
                                                defaultValue: dayjs('00:00:00', 'HH:mm:ss')
                                            }}
                                            format={field.format || 'YYYY-MM-DD HH:mm:ss'}
                                            value={
                                                formData[field.key as keyof T]
                                                    ? dayjs(formData[field.key as keyof T] as string, field.format || 'YYYY-MM-DD HH:mm:ss')
                                                    : null
                                            }
                                            onChange={(date, dateString) => handleDateChange(field.key, date, dateString)}
                                            className="form-template__input form-template__date-picker"
                                            disabled={loading}
                                            placeholder={field.placeholderKey ? t(field.placeholderKey) : ''}
                                        />
                                    )}

                                    {field.type === 'duallistbox' && (
                                        <DualListBox
                                            dataSource={(field.options || []).map((opt: any) => ({
                                                key: opt.value.toString(),
                                                name: opt.name,
                                                description: opt.description,
                                                tag: opt.value,
                                            }))}
                                            targetKeys={
                                                Array.isArray(formData[field.key as keyof T])
                                                    ? (formData[field.key as keyof T] as any[]).map((p) =>
                                                        typeof p === "object" ? p.id.toString() : p.toString()
                                                    )
                                                    : []
                                            }
                                            onChange={(nextKeys) => handleChange(field.key, nextKeys)}
                                            leftColumns={[
                                                {
                                                    dataIndex: 'name',
                                                    title: t('roleForm.permissionsTable.name'),
                                                    render: (text: string) => <Tag color="blue">{text}</Tag>,
                                                },
                                                {
                                                    dataIndex: 'description',
                                                    title: t('roleForm.permissionsTable.description'),
                                                },
                                            ]}
                                            rightColumns={[
                                                {
                                                    dataIndex: 'name',
                                                    title: t('roleForm.permissionsTable.name'),
                                                    render: (text: string) => <Tag color="green">{text}</Tag>,
                                                },
                                                {
                                                    dataIndex: 'description',
                                                    title: t('roleForm.permissionsTable.description'),
                                                },
                                            ]}

                                            showSearch
                                        />
                                    )}
                                    {field.type === 'password' && (
                                        <PasswordInput
                                            value={(formData && formData[field.key as keyof T]) ?? ''}
                                            onChange={(val) => handleChange(field.key, val)}
                                            placeholder={field.placeholderKey ? t(field.placeholderKey) : ''}
                                            disabled={loading}
                                        />
                                    )}

                                    {field.type === 'date' && (
                                        <AntdDatePicker
                                            id={field.key}
                                            showTime={false}
                                            format={field.format || 'YYYY-MM-DD'}
                                            value={
                                                formData[field.key as keyof T]
                                                    ? dayjs(formData[field.key as keyof T] as string, field.format || 'YYYY-MM-DD')
                                                    : null
                                            }
                                            onChange={(date, dateString) => handleDateChange(field.key, date, dateString)}
                                            className="form-template__input form-template__date-picker"
                                            disabled={loading}
                                            placeholder={field.placeholderKey ? t(field.placeholderKey) : ''}
                                        />
                                    )}

                                    {field.type === 'dynamicList' && field.itemFields && (
                                        <div style={{ marginBottom: 24 }}>
                                            {(formData[field.key as keyof T] as any[] || []).map((item, index) => (
                                                <div
                                                    key={index}
                                                    style={{
                                                        border: '1px solid #ccc',
                                                        borderRadius: 8,
                                                        padding: 16,
                                                        marginBottom: 16,
                                                        backgroundColor: '#f9f9f9',
                                                    }}
                                                >
                                                    <div
                                                        style={{
                                                            display: 'flex',
                                                            justifyContent: 'space-between',
                                                            alignItems: 'center',
                                                            fontWeight: 600,
                                                            marginBottom: 12,
                                                        }}
                                                    >
                                                        <span>{`${t(field.labelKey)} ${index + 1}`}</span>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                const newList = [...(formData[field.key as keyof T] as any[])];
                                                                newList.splice(index, 1);
                                                                handleChange(field.key, newList);
                                                            }}
                                                            style={{
                                                                backgroundColor: '#ff4d4f',
                                                                color: '#fff',
                                                                border: 'none',
                                                                padding: '4px 12px',
                                                                borderRadius: 4,
                                                                cursor: 'pointer',
                                                            }}
                                                        >
                                                            {t('common.delete')}
                                                        </button>
                                                    </div>

                                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
                                                        {field.itemFields!.map(subField => (
                                                            <div key={subField.key} style={{ flex: `1 1 ${subField.gridSpan ? (subField.gridSpan / 24) * 100 + '%' : '100%'}` }}>
                                                                <label style={{ display: 'block', marginBottom: 4 }}>
                                                                    {t(subField.labelKey)}
                                                                    {subField.required && <span style={{ color: 'red', marginLeft: 4 }}>*</span>}
                                                                </label>
                                                                {subField.type === 'select' && (
                                                                    <select
                                                                        value={item[subField.key] || ''}
                                                                        onChange={e => {
                                                                            const newList = [...(formData[field.key as keyof T] as any[])];
                                                                            newList[index][subField.key] = e.target.value;
                                                                            handleChange(field.key, newList);
                                                                        }}
                                                                        style={{ width: '100%', padding: '6px 8px', borderRadius: 4, border: '1px solid #ccc', boxSizing: 'border-box' }}
                                                                        disabled={loading}
                                                                    >
                                                                        {subField.options?.map((option: any) => (
                                                                            <option key={option.value} value={option.value}>
                                                                                {option.label}
                                                                            </option>
                                                                        ))}
                                                                    </select>
                                                                )}

                                                                {subField.type === 'text' && (
                                                                    <input
                                                                        type="text"
                                                                        value={item[subField.key] || ''}
                                                                        onChange={e => {
                                                                            const newList = [...(formData[field.key as keyof T] as any[])];
                                                                            newList[index][subField.key] = e.target.value;
                                                                            handleChange(field.key, newList);
                                                                        }}
                                                                        placeholder={subField.placeholderKey ? t(subField.placeholderKey) : ''}
                                                                        style={{ width: '100%', padding: '6px 8px', borderRadius: 4, border: '1px solid #ccc', boxSizing: 'border-box' }}
                                                                        disabled={loading}
                                                                    />
                                                                )}

                                                                {subField.type === 'textEditor' && (
                                                                    <TextEditor
                                                                        value={item[subField.key] || ''}
                                                                        onChange={(val) => {
                                                                            const newList = [...(formData[field.key as keyof T] as any[])];
                                                                            newList[index][subField.key] = val;
                                                                            handleChange(field.key, newList);
                                                                        }}
                                                                        disabled={loading}
                                                                        placeholder={subField.placeholderKey ? t(subField.placeholderKey) : ''}
                                                                        style={{ minHeight: 120, width: '100%', border: '1px solid #ccc', borderRadius: 4, padding: 6, boxSizing: 'border-box' }}
                                                                    />
                                                                )}


                                                                {subField.type === 'multiSelect' && (
                                                                    <div
                                                                        style={{
                                                                            border: '1px solid #ccc',
                                                                            borderRadius: 6,
                                                                            padding: 8,
                                                                            minHeight: 40,
                                                                            maxHeight: 160,
                                                                            overflowY: 'auto',
                                                                            display: 'flex',
                                                                            flexWrap: 'wrap',
                                                                            gap: 8,
                                                                            backgroundColor: '#fff',
                                                                        }}
                                                                    >
                                                                        {subField.options?.map(opt => {
                                                                            const checked = (item[subField.key] || []).includes(opt.value);
                                                                            return (
                                                                                <label
                                                                                    key={opt.value}
                                                                                    style={{
                                                                                        display: 'flex',
                                                                                        alignItems: 'center',
                                                                                        padding: '4px 8px',
                                                                                        borderRadius: 4,
                                                                                        border: checked ? '1px solid #1890ff' : '1px solid #ddd',
                                                                                        backgroundColor: checked ? '#e6f7ff' : '#f9f9f9',
                                                                                        cursor: 'pointer',
                                                                                        transition: 'all 0.2s',
                                                                                        fontSize: 14,
                                                                                    }}
                                                                                    onMouseEnter={e => {
                                                                                        (e.currentTarget as HTMLLabelElement).style.backgroundColor = checked ? '#bae7ff' : '#f0f0f0';
                                                                                    }}
                                                                                    onMouseLeave={e => {
                                                                                        (e.currentTarget as HTMLLabelElement).style.backgroundColor = checked ? '#e6f7ff' : '#f9f9f9';
                                                                                    }}
                                                                                >
                                                                                    <input
                                                                                        type="checkbox"
                                                                                        value={opt.value}
                                                                                        checked={checked}
                                                                                        disabled={loading}
                                                                                        onChange={() => {
                                                                                            const newList = [...(formData[field.key as keyof T] as any[])];
                                                                                            const selectedValues = newList[index][subField.key] || [];
                                                                                            if (checked) {
                                                                                                newList[index][subField.key] = selectedValues.filter((v: string) => v !== opt.value);
                                                                                            } else {
                                                                                                newList[index][subField.key] = [...selectedValues, opt.value];
                                                                                            }
                                                                                            handleChange(field.key, newList);
                                                                                        }}
                                                                                        style={{ marginRight: 6 }}
                                                                                    />
                                                                                    {t(opt.label)}
                                                                                </label>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                )}


                                                                {validationErrors[`${field.key}.${index}.${subField.key}`] && (
                                                                    <p style={{ color: 'red', fontSize: 12, marginTop: 4 }}>
                                                                        {validationErrors[`${field.key}.${index}.${subField.key}`]}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}

                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const newItem = field.itemFields!.reduce((acc, f) => {
                                                        acc[f.key] = f.type === 'select' && f.options ? f.options[0].value : '';
                                                        return acc;
                                                    }, {} as any);
                                                    const newList = [...(formData[field.key as keyof T] as any[] || []), newItem];
                                                    handleChange(field.key, newList);
                                                }}
                                                style={{
                                                    width: '100%',
                                                    padding: '8px 16px',
                                                    backgroundColor: '#1890ff',
                                                    color: '#fff',
                                                    border: 'none',
                                                    borderRadius: 4,
                                                    cursor: 'pointer',
                                                    fontWeight: 600,
                                                }}
                                            >
                                                {t('common.add')} {t(field.labelKey)}
                                            </button>
                                        </div>
                                    )}


                                    {field.type === 'textEditor' && (
                                        <TextEditor
                                            value={(formData && formData[field.key as keyof T]) ?? ''}
                                            onChange={(content) => handleChange(field.key, content)}
                                            disabled={loading}
                                            placeholder={field.placeholderKey ? t(field.placeholderKey) : ''}
                                        />
                                    )}

                                    {field.type === 'assignmentModules' as 'text' && (
                                        <AssignmentModulesEditor
                                            value={formData[field.key as keyof T] as any[]}
                                            onChange={val => handleChange(field.key, val)}
                                            disabled={loading}
                                            typeUmlOptions={field.props?.typeUmlOptions || []}
                                        />
                                    )}

                                    {validationErrors[field.key] && (
                                        <p className="form-template__error-text">{validationErrors[field.key]}</p>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Nút hành động */}
                        <div className="form-template__actions-container">
                            <button
                                type="button"
                                onClick={handleClear}
                                className="form-template__cancel-button"
                                disabled={loading}
                            >
                                {t('common.clear')}
                            </button>
                            <button
                                type="submit"
                                className="form-template__save-button"
                                disabled={loading}
                            >
                                {loading ? t('common.saving') : t('common.save')}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default FormTemplate;