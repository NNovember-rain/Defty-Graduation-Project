// import React from 'react';
// import {useTranslation} from 'react-i18next';
// import type {FormField} from '../../template/ManagementTemplate/FormTemplate';
// import FormTemplate from '../../template/ManagementTemplate/FormTemplate';
// import './FormTemplate.scss';
// import {createSubmission, getSubmissionById, type ISubmission} from "../../../shared/services/submissionService.ts";
//
// const SubmissionForm: React.FC = () => {
//     const {t} = useTranslation();
//     const submissionFormFields: FormField[] = React.useMemo(() => [
//         {
//             key: 'studentName',
//             labelKey: 'submissionForm.studentNameLabel',
//             type: 'text',
//             placeholderKey: 'submissionForm.studentNamePlaceholder',
//             required: true,
//             gridSpan: 24,
//         },
//         {
//             key: 'assignmentTitle',
//             labelKey: 'submissionForm.assignmentTitleLabel',
//             type: 'text',
//             placeholderKey: 'submissionForm.assignmentTitlePlaceholder',
//             required: true,
//             gridSpan: 24,
//         },
//         {
//             key: 'classId',
//             labelKey: 'submissionForm.classIdLabel',
//             type: 'number',
//             placeholderKey: 'submissionForm.classIdPlaceholder',
//             required: true,
//             gridSpan: 12,
//         },
//         {
//             key: 'createdDate',
//             labelKey: 'submissionForm.createdDateLabel',
//             type: 'datetime',
//             format: 'YYYY-MM-DD HH:mm:ss',
//             placeholderKey: 'submissionForm.createdDatePlaceholder',
//             gridSpan: 12,
//             disabled: true, // Ngày tạo thường không cho chỉnh sửa
//         },
//         {
//             key: 'submissionStatus',
//             labelKey: 'submissionForm.statusLabel',
//             type: 'select',
//             options: [
//                 {value: 'PENDING', labelKey: 'submissionForm.status.pending'},
//                 {value: 'APPROVED', labelKey: 'submissionForm.status.approved'},
//                 {value: 'REJECTED', labelKey: 'submissionForm.status.rejected'},
//             ],
//             required: true,
//             gridSpan: 12,
//         },
//     ], [t]);
//
//     const submissionValidationSchema = React.useMemo(() => ({
//         studentName: (value: string, t: (key: string) => string) => {
//             if (!value?.trim()) return t('submissionForm.validation.studentNameRequired');
//             return null;
//         },
//         assignmentTitle: (value: string, t: (key: string) => string) => {
//             if (!value?.trim()) return t('submissionForm.validation.assignmentTitleRequired');
//             return null;
//         },
//         classId: (value: number | undefined, t: (key: string) => string) => {
//             if (!value) return t('submissionForm.validation.classIdRequired');
//             return null;
//         },
//         submissionStatus: (value: string, t: (key: string) => string) => {
//             if (!value) return t('submissionForm.validation.statusRequired');
//             return null;
//         },
//         file: (value: File | null, t: (key: string) => string) => {
//             if (!value) return t('submissionForm.validation.fileRequired');
//             return null;
//         },
//     }), [t]);
//
//     const breadcrumbItems = [
//         { label: t('common.breadcrumb.home'), path: '/' },
//         { label: t('common.breadcrumb.adminDashboard'), path: '/admin' },
//         { label: t('submissionPage.breadcrumb'), path: '/admin/submissions' },
//     ];
//
//     return (
//         <FormTemplate<ISubmission>
//             pageTitleKey="submissionForm.title"
//             breadcrumbItems={breadcrumbItems}
//             formFields={submissionFormFields}
//             serviceGetById={getSubmissionById}
//             serviceCreate={createSubmission}
//             validationSchema={submissionValidationSchema}
//             redirectPath="/admin/submissions"
//         />
//     );
// };