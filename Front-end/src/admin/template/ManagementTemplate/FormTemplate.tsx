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

export interface FormField {
    key: string;
    labelKey: string; // Key dịch thuật cho label
    type: 'text' | 'textarea' | 'select' | 'number' | 'datetime' | 'duallistbox';
    placeholderKey?: string; // Key dịch thuật cho placeholder
    options?: { value: string; labelKey: string }[]; // labelKey cho options
    required?: boolean;
    gridSpan?: number; // Cho layout grid
    format?: string;
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
            if (field.type === 'select' && field.options && field.options.length > 0) {
                initialFormState[field.key as keyof T] = field.options[0].value as T[keyof T];
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
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaveError(null); // Reset lỗi lưu trước khi submit

        if (!validateForm()) {
            return; // Dừng nếu validation thất bại
        }

        setLoading(true);
        try {
            if (isEditMode && serviceUpdate && id) {
                await serviceUpdate(id, formData);
                message.success(t('apiMessages.updateSuccess'));
            } else if (!isEditMode && serviceCreate) {
                await serviceCreate(formData as Omit<T, '_id' | 'createdAt' | 'updatedAt'>);
                message.success(t('apiMessages.createSuccess'));
                navigate(redirectPath);
            } else {
                message.error(t('apiMessages.fail'));
                throw new Error("Service functions not provided for this operation.");
            }
        } catch (err: any) {
            const errorMessage = await extractErrorMessage(err);
            message.error(t('apiMessages.fail'));
            setSaveError(t('formTemplate.saveError', { message: errorMessage }));
        } finally {
            setLoading(false);
        }
    };

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
                            {formFields.map(field => (
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
                                        <select
                                            id={field.key}
                                            name={field.key}
                                            value={formData[field.key as keyof T] || ''}
                                            onChange={(e) => handleChange(field.key, e.target.value)}
                                            className="form-template__input form-template__select"
                                            disabled={loading}
                                        >
                                            {field.options?.map(option => (
                                                <option key={option.value} value={option.value}>
                                                    {t(option.labelKey)}
                                                </option>
                                            ))}
                                        </select>
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
                                            dataSource={(field.options || []).map((opt) => ({
                                                key: opt.value,
                                                title: t(opt.labelKey),
                                                description: t(opt.labelKey),
                                                tag: opt.value,
                                            }))}
                                            targetKeys={formData[field.key as keyof T] as string[] || []}
                                            onChange={(nextKeys) => handleChange(field.key, nextKeys)}
                                            leftColumns={[
                                                { dataIndex: 'title', title: t('roleForm.permissionsTable.title') },
                                                { dataIndex: 'tag', title: t('roleForm.permissionsTable.tag'), render: (tag: string) => <Tag color="blue">{tag}</Tag> }
                                            ]}
                                            rightColumns={[
                                                { dataIndex: 'title', title: t('roleForm.permissionsTable.title') },
                                                { dataIndex: 'tag', title: t('roleForm.permissionsTable.tag'), render: (tag: string) => <Tag color="green">{tag}</Tag> }
                                            ]}
                                            showSearch
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