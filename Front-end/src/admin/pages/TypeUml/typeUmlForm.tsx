import React from 'react';
import {useTranslation} from 'react-i18next';
import type {FormField} from '../../template/ManagementTemplate/FormTemplate';
import FormTemplate from '../../template/ManagementTemplate/FormTemplate';
import {createTypeUml, getTypeUmlById, type ITypeUml, updateTypeUml} from "../../../shared/services/typeUmlService.ts";

const TypeUMlForm: React.FC = () => {
    const { t } = useTranslation();

    const typeUmlFormFields: FormField[] = React.useMemo(() => [
        {
            key: 'name',
            labelKey: 'typeUmlForm.nameLabel',
            type: 'text',
            placeholderKey: 'typeUmlForm.namePlaceholder',
            required: true,
            gridSpan: 24,
        },
        {
            key: 'description',
            labelKey: 'typeUmlForm.descriptionLabel',
            type: 'textarea',
            placeholderKey: 'typeUmlForm.descriptionPlaceholder',
            gridSpan: 24,
        },
    ], []);

    const typeUmlValidationSchema = React.useMemo(() => ({
        name: (value: string, t: (key: string) => string) => {
            if (!value?.trim()) return t('typeUmlForm.validation.nameRequired');
            return null;
        },
        type: (value: 'system' | 'user' | 'template', t: (key: string) => string) => {
            if (!value) return t('typeUmlForm.validation.typeRequired');
            return null;
        },
    }), []);


    const breadcrumbItems = [
        { label: t('common.breadcrumb.home'), path: '/' },
        { label: t('common.breadcrumb.adminDashboard'), path: '/admin' },
        { label: t('typeUmlPage.breadcrumb'), path: '/admin/content/type-uml' },
    ];

    return (
        <FormTemplate<ITypeUml>
            pageTitleKey="typeUmlForm.title"
            breadcrumbItems={breadcrumbItems}
            formFields={typeUmlFormFields}
            serviceGetById={getTypeUmlById}
            serviceCreate={createTypeUml}
            serviceUpdate={updateTypeUml}
            validationSchema={typeUmlValidationSchema}
            redirectPath="/admin/content/type-uml"
        />
    );
};

export default TypeUMlForm;