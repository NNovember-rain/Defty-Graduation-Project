import React, {useCallback, useEffect, useState} from 'react';
import {useTranslation} from 'react-i18next';
import type {FormField} from '../../template/ManagementTemplate/FormTemplate';
import FormTemplate from '../../template/ManagementTemplate/FormTemplate';
import {createRole, getRoleById, type IRole, updateRole} from "../../../shared/services/roleService.ts";
import {
    getPermissions,
    type GetPermissionsOptions,
    type IPermission
} from "../../../shared/services/permissionService.ts";
import dayjs from "dayjs";
import {useNavigate} from "react-router-dom";
import {useNotification} from "../../../shared/notification/useNotification.ts";

const RoleForm: React.FC = () => {
    const { t } = useTranslation(); const navigate = useNavigate();
    const { message, modal } = useNotification();

    const [permissions, setPermissions] = useState<IPermission[]>([]);
    const [totalPermissions, setTotalPermissions] = React.useState(0);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);

    const [currentFilters, setCurrentFilters] = React.useState<Record<string, string>>({});
    const [currentPage, setCurrentPage] = useState(1);
    const [entriesPerPage, setEntriesPerPage] = useState(10);
    const [currentSortColumn, setCurrentSortColumn] = useState<string | null>(null);
    const [currentSortOrder, setCurrentSortOrder] = useState<'asc' | 'desc' | null>(null);


    const updateUrl = useCallback(() => {
        const params = new URLSearchParams();

        for (const key in currentFilters) {
            if (currentFilters[key]) {
                params.set(key, currentFilters[key]);
            }
        }

        if (currentPage !== 1) {
            params.set('page', currentPage.toString());
        }
        if (entriesPerPage !== 10) { // Giả sử 10 là giá trị mặc định ban đầu
            params.set('limit', entriesPerPage.toString());
        }
        if (currentSortColumn) {
            params.set('sortBy', currentSortColumn);
        }
        if (currentSortOrder) {
            params.set('sortOrder', currentSortOrder);
        }

        window.history.pushState({}, '', `${window.location.pathname}?${params.toString()}`);
    }, [currentFilters, currentPage, entriesPerPage, currentSortColumn, currentSortOrder]);


    // Logic đọc trạng thái từ URL khi component được tải
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);

        const filters: Record<string, string> = {};
        params.forEach((value, key) => {
            if (!['page', 'limit', 'sortBy', 'sortOrder'].includes(key)) {
                filters[key] = value;
            }
        });
        setCurrentFilters(filters);

        setCurrentPage(parseInt(params.get('page') || '1', 10));
        setEntriesPerPage(parseInt(params.get('limit') || '10', 10));
        setCurrentSortColumn(params.get('sortBy'));
        setCurrentSortOrder(params.get('sortOrder') as 'asc' | 'desc' || null);

        const handlePopState = () => {
            const newParams = new URLSearchParams(window.location.search);
            const newFilters: Record<string, string> = {};
            newParams.forEach((value, key) => {
                if (!['page', 'limit', 'sortBy', 'sortOrder'].includes(key)) {
                    newFilters[key] = value;
                }
            });
            setCurrentFilters(newFilters);
            setCurrentPage(parseInt(newParams.get('page') || '1', 10));
            setEntriesPerPage(parseInt(newParams.get('limit') || '10', 10));
            setCurrentSortColumn(newParams.get('sortBy'));
            setCurrentSortOrder(newParams.get('sortOrder') as 'asc' | 'desc' || null);
        };

        window.addEventListener('popstate', handlePopState);

        return () => {
            window.removeEventListener('popstate', handlePopState);
        };
    }, []);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const options: GetPermissionsOptions = {
                page: currentPage,
                limit: entriesPerPage,
                sortBy: currentSortColumn || undefined,
                sortOrder: currentSortOrder || undefined,
                name: currentFilters.name || undefined
            };

            const response = await getPermissions(options);
            const formattedPermissions = (response.permissions || []).map(permission => ({
                ...permission,
                createdDate: permission.createdDate
                    ? dayjs(permission.createdDate).format('YYYY-MM-DD')
                    : '',
            }));

            // console.log("Fetched permissions:", formattedPermissions);
            setPermissions(formattedPermissions);
            setTotalPermissions(response.total || 0);
            setLoading(false);
        } catch (err) {
            console.error("Failed to fetch permissions:", err);
            setError(t('common.errorFetchingData'));
            setLoading(false);
        }
    }, [currentPage, entriesPerPage, currentSortColumn, currentSortOrder, currentFilters, t]);

    useEffect(() => {
        fetchData();
        updateUrl();
    }, [fetchData, updateUrl, currentPage, entriesPerPage, currentSortColumn, currentSortOrder, currentFilters]);

    const roleFormFields: FormField[] = React.useMemo(() => [
        {
            key: 'name',
            labelKey: 'roleForm.nameLabel',
            type: 'text',
            placeholderKey: 'roleForm.namePlaceholder',
            required: true,
            gridSpan: 24,
        },
        {
            key: 'description',
            labelKey: 'roleForm.descriptionLabel',
            type: 'textarea',
            placeholderKey: 'roleForm.descriptionPlaceholder',
            gridSpan: 24,
        },
        {
            key: 'permissions',
            labelKey: 'roleForm.permissionsLabel',
            type: 'duallistbox',
            required: true,
            gridSpan: 24,
            options: permissions.map(p => ({
                value: String(p.id),
                name: p.name,
                description: p.description,
            }))

        },
    ], [permissions]);

    const roleValidationSchema = React.useMemo(() => ({
        name: (value: string, t: (key: string) => string) => {
            if (!value?.trim()) return t('roleForm.validation.nameRequired');
            return null;
        },
        type: (value: 'system' | 'user' | 'template', t: (key: string) => string) => {
            if (!value) return t('roleForm.validation.typeRequired');
            return null;
        },
        version: (value: string, t: (key: string) => string) => {
            if (!value?.trim()) return t('roleForm.validation.versionRequired');
            return null;
        },
        permissions: (value: string[] | undefined, t: (key: string) => string) => {
            if (!value || value.length === 0) {
                return t('roleForm.validation.permissionsRequired');
            }
            return null;
        }
    }), []);


    const breadcrumbItems = [
        { label: t('common.breadcrumb.home'), path: '/' },
        { label: t('common.breadcrumb.adminDashboard'), path: '/admin' },
        { label: t('rolePage.breadcrumb'), path: '/admin/auth/roles' },
    ];

    return (
        <FormTemplate<IRole>
            pageTitleKey="roleForm.title"
            breadcrumbItems={breadcrumbItems}
            formFields={roleFormFields}
            serviceGetById={getRoleById}
            serviceCreate={createRole}
            serviceUpdate={updateRole}
            validationSchema={roleValidationSchema}
            redirectPath="/admin/auth/roles"
        />
    );
};

export default RoleForm;