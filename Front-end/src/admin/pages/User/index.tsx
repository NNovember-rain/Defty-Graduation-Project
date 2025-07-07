// pages/User.tsx
import React from "react";
import ManagementTemplate from "../../template/ManagementTemplate";
import type {SearchField, SortField} from "../../template/ManagementTemplate/FilterOption.tsx";
import moment from "moment"; // Import moment để xử lý ngày giờ
import { useTranslation } from "react-i18next"; // Import useTranslation

interface UserData {
    id: number;
    renderingEngine: string;
    browser: string;
    platform: string;
    engineVersion: string;
    cssGrade: string;
    creationDate: string; // Giữ kiểu string, nhưng định dạng sẽ là 'YYYY-MM-DD HH:mm:ss'
}

const User: React.FC = () => {
    const { t } = useTranslation(); // Initialize useTranslation

    // --- Mock Data (Replace with real API fetch in a real application) ---
    const allUsers: UserData[] = React.useMemo(() => [
        // Đã cập nhật trường 'creationDate' với định dạng có giờ, phút, giây
        { id: 1, renderingEngine: 'Gecko', browser: 'Firefox 1.0', platform: 'Win 98+ / OSX.2+', engineVersion: '1.7', cssGrade: 'A', creationDate: '2023-01-15 10:00:00' },
        { id: 2, renderingEngine: 'Gecko', browser: 'Firefox 1.5', platform: 'Win 98+ / OSX.2+', engineVersion: '1.8', cssGrade: 'A', creationDate: '2023-01-20 11:30:00' },
        { id: 3, renderingEngine: 'Gecko', browser: 'Firefox 2.0', platform: 'Win 98+ / OSX.2+', engineVersion: '1.7', cssGrade: 'A', creationDate: '2023-02-01 12:00:00' },
        { id: 4, renderingEngine: 'Gecko', browser: 'Firefox 3.0', platform: 'Win 2k+ / OSX.3+', engineVersion: '1.9', cssGrade: 'A', creationDate: '2023-02-10 13:45:00' },
        { id: 5, renderingEngine: 'Gecko', browser: 'Camino 1.0', platform: 'OSX.2+', engineVersion: '1.8', cssGrade: 'A', creationDate: '2023-02-15 14:00:00' },
        { id: 6, renderingEngine: 'Gecko', browser: 'Camino 1.5', platform: 'OSX.3+', engineVersion: '1.8', cssGrade: 'A', creationDate: '2023-03-01 09:15:00' },
        { id: 7, renderingEngine: 'Gecko', browser: 'Netscape 7.2', platform: 'Win 95+ / Mac OS 8.6-9.2', engineVersion: '1.7', cssGrade: 'A', creationDate: '2023-03-05 10:00:00' },
        { id: 8, renderingEngine: 'Gecko', browser: 'Netscape Browser 8', platform: 'Win 98SE+', engineVersion: '1.7', cssGrade: 'A', creationDate: '2023-03-10 11:00:00' },
        { id: 9, renderingEngine: 'Gecko', browser: 'Netscape Navigator 9', platform: 'Win 98+ / OSX.2+', engineVersion: '1.8', cssGrade: 'A', creationDate: '2023-03-15 12:30:00' },
        { id: 10, renderingEngine: 'Gecko', browser: 'Mozilla 1.0', platform: 'Win 95+ / OSX.1+', engineVersion: '1', cssGrade: 'A', creationDate: '2023-04-01 13:00:00' },
        { id: 11, renderingEngine: 'Trident', browser: 'IE 4.0', platform: 'Win 95+', engineVersion: '4', cssGrade: 'X', creationDate: '2023-04-05 14:00:00' },
        { id: 12, renderingEngine: 'Trident', browser: 'IE 5.0', platform: 'Win 95+', engineVersion: '5', cssGrade: 'C', creationDate: '2023-04-10 15:00:00' },
        { id: 13, renderingEngine: 'Trident', browser: 'IE 5.5', platform: 'Win 95+', engineVersion: '5.5', cssGrade: 'A', creationDate: '2023-04-15 16:00:00' },
        { id: 14, renderingEngine: 'Trident', browser: 'IE 6.0', platform: 'Win 98+', engineVersion: '6', cssGrade: 'A', creationDate: '2023-05-01 10:00:00' },
        { id: 15, renderingEngine: 'Trident', browser: 'IE 7.0', platform: 'Win XP', engineVersion: '7', cssGrade: 'A', creationDate: '2023-05-05 11:00:00' },
        { id: 16, renderingEngine: 'Webkit', browser: 'Safari 1.2', platform: 'OSX.3', engineVersion: '125.5', cssGrade: 'A', creationDate: '2023-05-10 12:00:00' },
        { id: 17, renderingEngine: 'Webkit', browser: 'Safari 1.3', platform: 'OSX.3', engineVersion: '312.8', cssGrade: 'A', creationDate: '2023-05-15 13:00:00' },
        { id: 18, renderingEngine: 'Webkit', browser: 'Safari 2.0', platform: 'OSX.4', engineVersion: '419.3', cssGrade: 'A', creationDate: '2023-06-01 14:00:00' },
        { id: 19, renderingEngine: 'Webkit', browser: 'Safari 3.0', platform: 'OSX.4+', engineVersion: '522.1', cssGrade: 'A', creationDate: '2023-06-05 15:00:00' },
        { id: 20, renderingEngine: 'Webkit', browser: 'Google Chrome 1.0', platform: 'Win XP+', engineVersion: '533.0', cssGrade: 'A', creationDate: '2023-06-10 16:00:00' },
        { id: 21, renderingEngine: 'Presto', browser: 'Opera 7.0', platform: 'Win 95+ / OSX.1+', engineVersion: '-', cssGrade: 'A', creationDate: '2023-06-15 09:00:00' },
        { id: 22, renderingEngine: 'Presto', browser: 'Opera 8.0', platform: 'Win 95+ / OSX.1+', engineVersion: '-', cssGrade: 'A', creationDate: '2023-07-01 10:00:00' },
        { id: 23, renderingEngine: 'Presto', browser: 'Opera 9.0', platform: 'Win 95+ / OSX.1+', engineVersion: '-', cssGrade: 'A', creationDate: '2023-07-05 11:00:00' },
        { id: 24, renderingEngine: 'Misc', browser: 'NetFront 3.1', platform: 'Win CE', engineVersion: '-', cssGrade: 'A', creationDate: '2023-07-10 12:00:00' },
        { id: 25, renderingEngine: 'Misc', browser: 'iPod Touch / iPhone', platform: 'iPod', engineVersion: '420.1', cssGrade: 'A', creationDate: '2023-07-15 13:00:00' },
        { id: 26, renderingEngine: 'Misc', browser: 'IE Mobile', platform: 'Windows Mobile', engineVersion: '-', cssGrade: 'C', creationDate: '2023-08-01 14:00:00' },
        { id: 27, renderingEngine: 'KHTML', browser: 'Konqureror 3.5', platform: 'KDE 3.5', engineVersion: '3.5', cssGrade: 'A', creationDate: '2023-08-05 15:00:00' },
        { id: 28, renderingEngine: 'KHTML', browser: 'Konqureror 3.1', platform: 'KDE 3.1', engineVersion: '3.1', cssGrade: 'A', creationDate: '2023-08-10 16:00:00' },
        { id: 29, renderingEngine: 'Tasman', browser: 'Internet Explorer 5.2', platform: 'Mac OS 8-9', engineVersion: '-', cssGrade: 'C', creationDate: '2023-08-15 10:00:00' },
        { id: 30, renderingEngine: 'Tasman', browser: 'Internet Explorer 4.5', platform: 'Mac OS 9-X', engineVersion: '-', cssGrade: 'C', creationDate: '2023-09-01 11:00:00' },
        { id: 31, renderingEngine: 'Trident', browser: 'AOL explorer 1.5', platform: 'Win XP', engineVersion: '-', cssGrade: 'A', creationDate: '2023-09-05 12:00:00' },
        { id: 32, renderingEngine: 'Trident', browser: 'Firefox 1.0', platform: 'Win 98+ / OSX.2+', engineVersion: '1.7', cssGrade: 'A', creationDate: '2023-09-10 13:00:00' },
        { id: 33, renderingEngine: 'Gecko', browser: 'Firefox 1.5', platform: 'Win 98+ / OSX.2+', engineVersion: '1.8', cssGrade: 'A', creationDate: '2023-09-15 14:00:00' },
        { id: 34, renderingEngine: 'Gecko', browser: 'Firefox 2.0', platform: 'Win 98+ / OSX.2+', engineVersion: '1.7', cssGrade: 'A', creationDate: '2023-10-01 15:00:00' },
        { id: 35, renderingEngine: 'Gecko', browser: 'Firefox 3.0', platform: 'Win 2k+ / OSX.3+', engineVersion: '1.9', cssGrade: 'A', creationDate: '2023-10-05 16:00:00' },
        { id: 36, renderingEngine: 'Gecko', browser: 'Camino 1.0', platform: 'OSX.2+', engineVersion: '1.8', cssGrade: 'A', creationDate: '2023-10-10 09:00:00' },
        { id: 37, renderingEngine: 'Gecko', browser: 'Camino 1.5', platform: 'OSX.3+', engineVersion: '1.8', cssGrade: 'A', creationDate: '2023-10-15 10:00:00' },
        { id: 38, renderingEngine: 'Gecko', browser: 'Netscape 7.2', platform: 'Win 95+ / Mac OS 8.6-9.2', engineVersion: '1.7', cssGrade: 'A', creationDate: '2023-11-01 11:00:00' },
        { id: 39, renderingEngine: 'Gecko', browser: 'Netscape Browser 8', platform: 'Win 98SE+', engineVersion: '1.7', cssGrade: 'A', creationDate: '2023-11-05 12:00:00' },
        { id: 40, renderingEngine: 'Gecko', browser: 'Netscape Navigator 9', platform: 'Win 98+ / OSX.2+', engineVersion: '1.8', cssGrade: 'A', creationDate: '2023-11-10 13:00:00' },
        { id: 41, renderingEngine: 'Gecko', browser: 'Mozilla 1.0', platform: 'Win 95+ / OSX.1+', engineVersion: '1', cssGrade: 'A', creationDate: '2023-11-15 14:00:00' },
        { id: 42, renderingEngine: 'Trident', browser: 'IE 4.0', platform: 'Win 95+', engineVersion: '4', cssGrade: 'X', creationDate: '2023-12-01 15:00:00' },
        { id: 43, renderingEngine: 'Trident', browser: 'IE 5.0', platform: 'Win 95+', engineVersion: '5', cssGrade: 'C', creationDate: '2023-12-05 16:00:00' },
        { id: 44, renderingEngine: 'Trident', browser: 'IE 5.5', platform: 'Win 95+', engineVersion: '5.5', cssGrade: 'A', creationDate: '2023-12-10 09:00:00' },
        { id: 45, renderingEngine: 'Trident', browser: 'IE 6.0', platform: 'Win 98+', engineVersion: '6', cssGrade: 'A', creationDate: '2023-12-15 10:00:00' },
        { id: 46, renderingEngine: 'Trident', browser: 'IE 7.0', platform: 'Win XP', engineVersion: '7', cssGrade: 'A', creationDate: '2024-01-01 11:00:00' },
        { id: 47, renderingEngine: 'Webkit', browser: 'Safari 1.2', platform: 'OSX.3', engineVersion: '125.5', cssGrade: 'A', creationDate: '2024-01-05 12:00:00' },
        { id: 48, renderingEngine: 'Webkit', browser: 'Safari 1.3', platform: 'OSX.3', engineVersion: '312.8', cssGrade: 'A', creationDate: '2024-01-10 13:00:00' },
        { id: 49, renderingEngine: 'Webkit', browser: 'Safari 2.0', platform: 'OSX.4', engineVersion: '419.3', cssGrade: 'A', creationDate: '2024-01-15 14:00:00' },
        { id: 50, renderingEngine: 'Webkit', browser: 'Safari 3.0', platform: 'OSX.4+', engineVersion: '522.1', cssGrade: 'A', creationDate: '2024-02-01 15:00:00' },
        { id: 51, renderingEngine: 'Webkit', browser: 'Google Chrome 1.0', platform: 'Win XP+', engineVersion: '533.0', cssGrade: 'A', creationDate: '2024-02-05 16:00:00' },
        { id: 52, renderingEngine: 'Presto', browser: 'Opera 7.0', platform: 'Win 95+ / OSX.1+', engineVersion: '-', cssGrade: 'A', creationDate: '2024-02-10 09:00:00' },
        { id: 53, renderingEngine: 'Presto', browser: 'Opera 8.0', platform: 'Win 95+ / OSX.1+', engineVersion: '-', cssGrade: 'A', creationDate: '2024-02-15 10:00:00' },
        { id: 54, renderingEngine: 'Presto', browser: 'Opera 9.0', platform: 'Win 95+ / OSX.1+', engineVersion: '-', cssGrade: 'A', creationDate: '2024-03-01 11:00:00' },
        { id: 55, renderingEngine: 'Misc', browser: 'NetFront 3.1', platform: 'Win CE', engineVersion: '-', cssGrade: 'A', creationDate: '2024-03-05 12:00:00' },
        { id: 56, renderingEngine: 'Misc', browser: 'iPod Touch / iPhone', platform: 'iPod', engineVersion: '420.1', cssGrade: 'A', creationDate: '2024-03-10 13:00:00' },
        { id: 57, renderingEngine: 'Misc', browser: 'IE Mobile', platform: 'Windows Mobile', engineVersion: '-', cssGrade: 'C', creationDate: '2024-03-15 14:00:00' },
        { id: 57, renderingEngine: 'Misc', browser: 'IE Mobile', platform: 'Windows Mobile', engineVersion: '-', cssGrade: 'C', creationDate: '2024-03-15 14:00:00' },
        { id: 57, renderingEngine: 'Misc', browser: 'IE Mobile', platform: 'Windows Mobile', engineVersion: '-', cssGrade: 'C', creationDate: '2024-03-15 14:00:00' },
        { id: 57, renderingEngine: 'Misc', browser: 'IE Mobile', platform: 'Windows Mobile', engineVersion: '-', cssGrade: 'C', creationDate: '2024-03-15 14:00:00' },
        { id: 57, renderingEngine: 'Misc', browser: 'IE Mobile', platform: 'Windows Mobile', engineVersion: '-', cssGrade: 'C', creationDate: '2024-03-15 14:00:00' },
        { id: 57, renderingEngine: 'Misc', browser: 'IE Mobile', platform: 'Windows Mobile', engineVersion: '-', cssGrade: 'C', creationDate: '2024-03-15 14:00:00' },
        { id: 57, renderingEngine: 'Misc', browser: 'IE Mobile', platform: 'Windows Mobile', engineVersion: '-', cssGrade: 'C', creationDate: '2024-03-15 14:00:00' },
        { id: 57, renderingEngine: 'Misc', browser: 'IE Mobile', platform: 'Windows Mobile', engineVersion: '-', cssGrade: 'C', creationDate: '2024-03-15 14:00:00' },
        { id: 57, renderingEngine: 'Misc', browser: 'IE Mobile', platform: 'Windows Mobile', engineVersion: '-', cssGrade: 'C', creationDate: '2024-03-15 14:00:00' },
        { id: 57, renderingEngine: 'Misc', browser: 'IE Mobile', platform: 'Windows Mobile', engineVersion: '-', cssGrade: 'C', creationDate: '2024-03-15 14:00:00' },
        { id: 57, renderingEngine: 'Misc', browser: 'IE Mobile', platform: 'Windows Mobile', engineVersion: '-', cssGrade: 'C', creationDate: '2024-03-15 14:00:00' },
        { id: 57, renderingEngine: 'Misc', browser: 'IE Mobile', platform: 'Windows Mobile', engineVersion: '-', cssGrade: 'C', creationDate: '2024-03-15 14:00:00' },
        { id: 57, renderingEngine: 'Misc', browser: 'IE Mobile', platform: 'Windows Mobile', engineVersion: '-', cssGrade: 'C', creationDate: '2024-03-15 14:00:00' },
        { id: 57, renderingEngine: 'Misc', browser: 'IE Mobile', platform: 'Windows Mobile', engineVersion: '-', cssGrade: 'C', creationDate: '2024-03-15 14:00:00' },
        { id: 57, renderingEngine: 'Misc', browser: 'IE Mobile', platform: 'Windows Mobile', engineVersion: '-', cssGrade: 'C', creationDate: '2024-03-15 14:00:00' },
        { id: 57, renderingEngine: 'Misc', browser: 'IE Mobile', platform: 'Windows Mobile', engineVersion: '-', cssGrade: 'C', creationDate: '2024-03-15 14:00:00' },
        { id: 57, renderingEngine: 'Misc', browser: 'IE Mobile', platform: 'Windows Mobile', engineVersion: '-', cssGrade: 'C', creationDate: '2024-03-15 14:00:00' },
        { id: 57, renderingEngine: 'Misc', browser: 'IE Mobile', platform: 'Windows Mobile', engineVersion: '-', cssGrade: 'C', creationDate: '2024-03-15 14:00:00' },
        { id: 57, renderingEngine: 'Misc', browser: 'IE Mobile', platform: 'Windows Mobile', engineVersion: '-', cssGrade: 'C', creationDate: '2024-03-15 14:00:00' },
        { id: 57, renderingEngine: 'Misc', browser: 'IE Mobile', platform: 'Windows Mobile', engineVersion: '-', cssGrade: 'C', creationDate: '2024-03-15 14:00:00' },
        { id: 57, renderingEngine: 'Misc', browser: 'IE Mobile', platform: 'Windows Mobile', engineVersion: '-', cssGrade: 'C', creationDate: '2024-03-15 14:00:00' },
        { id: 57, renderingEngine: 'Misc', browser: 'IE Mobile', platform: 'Windows Mobile', engineVersion: '-', cssGrade: 'C', creationDate: '2024-03-15 14:00:00' },
        { id: 57, renderingEngine: 'Misc', browser: 'IE Mobile', platform: 'Windows Mobile', engineVersion: '-', cssGrade: 'C', creationDate: '2024-03-15 14:00:00' },
        { id: 57, renderingEngine: 'Misc', browser: 'IE Mobile', platform: 'Windows Mobile', engineVersion: '-', cssGrade: 'C', creationDate: '2024-03-15 14:00:00' },
        { id: 57, renderingEngine: 'Misc', browser: 'IE Mobile', platform: 'Windows Mobile', engineVersion: '-', cssGrade: 'C', creationDate: '2024-03-15 14:00:00' },
        { id: 57, renderingEngine: 'Misc', browser: 'IE Mobile', platform: 'Windows Mobile', engineVersion: '-', cssGrade: 'C', creationDate: '2024-03-15 14:00:00' },
        { id: 57, renderingEngine: 'Misc', browser: 'IE Mobile', platform: 'Windows Mobile', engineVersion: '-', cssGrade: 'C', creationDate: '2024-03-15 14:00:00' },
        { id: 57, renderingEngine: 'Misc', browser: 'IE Mobile', platform: 'Windows Mobile', engineVersion: '-', cssGrade: 'C', creationDate: '2024-03-15 14:00:00' },
        { id: 57, renderingEngine: 'Misc', browser: 'IE Mobile', platform: 'Windows Mobile', engineVersion: '-', cssGrade: 'C', creationDate: '2024-03-15 14:00:00' },
        { id: 57, renderingEngine: 'Misc', browser: 'IE Mobile', platform: 'Windows Mobile', engineVersion: '-', cssGrade: 'C', creationDate: '2024-03-15 14:00:00' },
        { id: 57, renderingEngine: 'Misc', browser: 'IE Mobile', platform: 'Windows Mobile', engineVersion: '-', cssGrade: 'C', creationDate: '2024-03-15 14:00:00' },
        { id: 57, renderingEngine: 'Misc', browser: 'IE Mobile', platform: 'Windows Mobile', engineVersion: '-', cssGrade: 'C', creationDate: '2024-03-15 14:00:00' },
        { id: 57, renderingEngine: 'Misc', browser: 'IE Mobile', platform: 'Windows Mobile', engineVersion: '-', cssGrade: 'C', creationDate: '2024-03-15 14:00:00' },
        { id: 57, renderingEngine: 'Misc', browser: 'IE Mobile', platform: 'Windows Mobile', engineVersion: '-', cssGrade: 'C', creationDate: '2024-03-15 14:00:00' },
        { id: 57, renderingEngine: 'Misc', browser: 'IE Mobile', platform: 'Windows Mobile', engineVersion: '-', cssGrade: 'C', creationDate: '2024-03-15 14:00:00' },
        { id: 57, renderingEngine: 'Misc', browser: 'IE Mobile', platform: 'Windows Mobile', engineVersion: '-', cssGrade: 'C', creationDate: '2024-03-15 14:00:00' },
        { id: 57, renderingEngine: 'Misc', browser: 'IE Mobile', platform: 'Windows Mobile', engineVersion: '-', cssGrade: 'C', creationDate: '2024-03-15 14:00:00' },
        { id: 57, renderingEngine: 'Misc', browser: 'IE Mobile', platform: 'Windows Mobile', engineVersion: '-', cssGrade: 'C', creationDate: '2024-03-15 14:00:00' },
        { id: 57, renderingEngine: 'Misc', browser: 'IE Mobile', platform: 'Windows Mobile', engineVersion: '-', cssGrade: 'C', creationDate: '2024-03-15 14:00:00' },
        { id: 57, renderingEngine: 'Misc', browser: 'IE Mobile', platform: 'Windows Mobile', engineVersion: '-', cssGrade: 'C', creationDate: '2024-03-15 14:00:00' },
        { id: 57, renderingEngine: 'Misc', browser: 'IE Mobile', platform: 'Windows Mobile', engineVersion: '-', cssGrade: 'C', creationDate: '2024-03-15 14:00:00' },
        { id: 57, renderingEngine: 'Misc', browser: 'IE Mobile', platform: 'Windows Mobile', engineVersion: '-', cssGrade: 'C', creationDate: '2024-03-15 14:00:00' },
        { id: 57, renderingEngine: 'Misc', browser: 'IE Mobile', platform: 'Windows Mobile', engineVersion: '-', cssGrade: 'C', creationDate: '2024-03-15 14:00:00' },
        { id: 57, renderingEngine: 'Misc', browser: 'IE Mobile', platform: 'Windows Mobile', engineVersion: '-', cssGrade: 'C', creationDate: '2024-03-15 14:00:00' },
        { id: 57, renderingEngine: 'Misc', browser: 'IE Mobile', platform: 'Windows Mobile', engineVersion: '-', cssGrade: 'C', creationDate: '2024-03-15 14:00:00' },
        { id: 57, renderingEngine: 'Misc', browser: 'IE Mobile', platform: 'Windows Mobile', engineVersion: '-', cssGrade: 'C', creationDate: '2024-03-15 14:00:00' },
    ], []);

    const dataTableColumns = React.useMemo(() => [
        { key: 'renderingEngine', label: t('userPage.dataTableColumns.renderingEngine'), sortable: true },
        { key: 'browser', label: t('userPage.dataTableColumns.browser'), sortable: true },
        { key: 'platform', label: t('userPage.dataTableColumns.platform'), sortable: true },
        { key: 'engineVersion', label: t('userPage.dataTableColumns.engineVersion'), sortable: true },
        { key: 'cssGrade', label: t('userPage.dataTableColumns.cssGrade'), sortable: true },
        { key: 'creationDate', label: t('userPage.dataTableColumns.creationDate'), sortable: true }, // Thêm cột ngày tạo
    ], [t]);

    // --- Cấu hình các trường tìm kiếm ---
    const searchFields: SearchField[] = React.useMemo(() => [
        { key: 'renderingEngine', label: t('userPage.searchFields.renderingEngineLabel'), type: 'text', placeholder: t('userPage.searchFields.renderingEnginePlaceholder'), gridSpan: 1 },
        { key: 'browser', label: t('userPage.searchFields.browserNameLabel'), type: 'text', placeholder: t('userPage.searchFields.browserNamePlaceholder'), gridSpan: 1 },
        { key: 'platform', label: t('userPage.searchFields.platformLabel'), type: 'text', placeholder: t('userPage.searchFields.platformPlaceholder'), gridSpan: 1 },
        {
            key: 'cssGrade',
            label: t('userPage.searchFields.cssGradeLabel'),
            type: 'select',
            options: [
                { value: '', label: t('userPage.searchFields.cssGradeAny') },
                { value: 'A', label: t('userPage.searchFields.cssGradeA') },
                { value: 'B', label: t('userPage.searchFields.cssGradeB') },
                { value: 'C', label: t('userPage.searchFields.cssGradeC') },
                { value: 'X', label: t('userPage.searchFields.cssGradeX') },
            ],
            gridSpan: 1
        },
        { key: 'startDate', label: t('userPage.searchFields.startDate'), type: 'datetime', gridSpan: 1, format: 'YYYY-MM-DD HH:mm:ss' }, // Dùng 'datetime'
        { key: 'endDate', label: t('userPage.searchFields.endDate'), type: 'datetime', gridSpan: 1, format: 'YYYY-MM-DD HH:mm:ss' },   // Dùng 'datetime'
        { key: 'globalSearch', label: t('userPage.searchFields.generalSearchLabel'), type: 'text', placeholder: t('userPage.searchFields.generalSearchPlaceholder'), gridSpan: 2 },
    ], [t]);

    // --- Cấu hình các trường sắp xếp ---
    const sortFields: SortField[] = React.useMemo(() => [
        {
            key: 'sortOrder',
            label: t('userPage.sortFields.sortOrderLabel'),
            options: [
                { value: 'asc', label: t('userPage.sortFields.ascending') },
                { value: 'desc', label: t('userPage.sortFields.descending') },
            ],
            gridSpan: 1
        },
        {
            key: 'orderBy',
            label: t('userPage.sortFields.orderByLabel'),
            options: [
                { value: 'renderingEngine', label: t('userPage.sortFields.renderingEngine') },
                { value: 'browser', label: t('userPage.sortFields.browser') },
                { value: 'id', label: t('userPage.sortFields.id') },
                { value: 'creationDate', label: t('userPage.sortFields.creationDate') }, // Thêm option sắp xếp theo ngày tạo
            ],
            gridSpan: 1
        },
    ], [t]);

    const [currentFilters, setCurrentFilters] = React.useState<Record<string, string>>({});
    const [filteredData, setFilteredData] = React.useState<UserData[]>(allUsers);
    const [currentPage, setCurrentPage] = React.useState(1);
    const [entriesPerPage, setEntriesPerPage] = React.useState(10); // NEW: Thêm state cho số bản ghi trên mỗi trang
    const [currentSortColumn, setCurrentSortColumn] = React.useState<string | null>(null);
    const [currentSortOrder, setCurrentSortOrder] = React.useState<'asc' | 'desc' | null>(null);

    // --- Effect để áp dụng các bộ lọc và sắp xếp khi chúng thay đổi ---
    React.useEffect(() => {
        let tempData = [...allUsers];

        // Apply filters first
        Object.keys(currentFilters).forEach(key => {
            const value = currentFilters[key];
            if (value && key !== 'sortOrder' && key !== 'orderBy') { // Exclude sort fields from filtering
                if (key === 'globalSearch') {
                    // Global search logic
                    const lowerCaseValue = value.toLowerCase();
                    tempData = tempData.filter(row =>
                        Object.values(row).some(fieldValue =>
                            String(fieldValue).toLowerCase().includes(lowerCaseValue)
                        )
                    );
                } else if (key === 'startDate' || key === 'endDate') {
                    // Lọc theo ngày/giờ
                    const filterDate = moment(value); // Chuyển đổi chuỗi ngày từ filter thành Moment object
                    if (!filterDate.isValid()) return; // Bỏ qua nếu ngày không hợp lệ

                    tempData = tempData.filter(row => {
                        const rowDate = moment(row.creationDate); // Chuyển đổi chuỗi ngày từ data thành Moment object
                        if (!rowDate.isValid()) return false; // Bỏ qua nếu ngày trong hàng không hợp lệ

                        if (key === 'startDate') {
                            return rowDate.isSameOrAfter(filterDate);
                        } else if (key === 'endDate') {
                            return rowDate.isSameOrBefore(filterDate);
                        }
                        return true;
                    });
                }
                else {
                    // Specific field search logic
                    const lowerCaseValue = value.toLowerCase();
                    tempData = tempData.filter(row =>
                        String(row[key as keyof UserData]).toLowerCase().includes(lowerCaseValue)
                    );
                }
            }
        });

        // Apply sorting
        const orderByField = currentFilters['orderBy'] || currentSortColumn;
        const sortOrderField = currentFilters['sortOrder'] === 'desc' ? 'desc' : 'asc';

        if (orderByField) {
            tempData.sort((a, b) => {
                const aValue = a[orderByField as keyof UserData];
                const bValue = b[orderByField as keyof UserData];

                if (orderByField === 'creationDate') {
                    // Sắp xếp theo ngày/giờ sử dụng Moment
                    const dateA = moment(String(aValue)).valueOf(); // Giá trị số của thời gian
                    const dateB = moment(String(bValue)).valueOf();
                    return sortOrderField === 'asc' ? dateA - dateB : dateB - dateA;
                } else if (typeof aValue === 'string' && typeof bValue === 'string') {
                    return sortOrderField === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
                } else if (typeof aValue === 'number' && typeof bValue === 'number') {
                    return sortOrderField === 'asc' ? aValue - bValue : bValue - aValue;
                }
                return 0;
            });
            setCurrentSortColumn(orderByField);
            setCurrentSortOrder(sortOrderField);
        } else {
            if (currentSortColumn && currentSortOrder) {
                tempData.sort((a, b) => {
                    const aValue = a[currentSortColumn as keyof UserData];
                    const bValue = b[currentSortColumn as keyof UserData];

                    if (currentSortColumn === 'creationDate') {
                        const dateA = moment(String(aValue)).valueOf();
                        const dateB = moment(String(bValue)).valueOf();
                        return currentSortOrder === 'asc' ? dateA - dateB : dateB - dateA;
                    } else if (typeof aValue === 'string' && typeof bValue === 'string') {
                        return currentSortOrder === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
                    } else if (typeof aValue === 'number' && typeof bValue === 'number') {
                        return currentSortOrder === 'asc' ? aValue - bValue : bValue - aValue;
                    }
                    return 0;
                });
            }
        }

        setFilteredData(tempData);
        setCurrentPage(1);
    }, [currentFilters, allUsers, currentSortColumn, currentSortOrder]);

    const handleSearch = React.useCallback((filtersFromForm: Record<string, string>) => {
        setCurrentFilters(filtersFromForm);
    }, []);

    const handleClear = React.useCallback(() => {
        setCurrentFilters({});
        setCurrentPage(1);
        setCurrentSortColumn(null);
        setCurrentSortOrder(null);
        setEntriesPerPage(10); // Reset entries per page on clear
    }, []);

    const handlePageChange = React.useCallback((page: number) => {
        setCurrentPage(page);
    }, []);

    const handleTableSort = React.useCallback((columnKey: string, sortOrder: 'asc' | 'desc') => {
        setCurrentSortColumn(columnKey);
        setCurrentSortOrder(sortOrder);
        setCurrentFilters(prev => ({
            ...prev,
            orderBy: columnKey,
            sortOrder: sortOrder
        }));
    }, []);

    // NEW: Function to handle changes in entries per page
    const handleEntriesPerPageChange = React.useCallback((entries: number) => {
        setEntriesPerPage(entries);
        setCurrentPage(1); // Reset to first page when entries per page changes
    }, []);

    // NEW: Function to handle the "Create New" button click
    const handleCreateNew = React.useCallback(() => {
        alert(t('userPage.createNewAction')); // Placeholder action: show an alert
        // In a real application, you might navigate to a new route:
        // navigate('/users/new');
        // Or open a modal for creating a new user:
        // setIsCreateModalOpen(true);
    }, [t]);


    const paginatedData = React.useMemo(() => {
        const startIndex = (currentPage - 1) * entriesPerPage;
        const endIndex = startIndex + entriesPerPage;
        return filteredData.slice(startIndex, endIndex);
    }, [filteredData, currentPage, entriesPerPage]);

    return (
        <ManagementTemplate
            pageTitle={t('userPage.title')}
            breadcrumbItems={[
                { label: t('userPage.breadcrumb.home'), path: '/' },
                { label: t('userPage.breadcrumb.adminDashboard'), path: '/admin' },
                { label: t('userPage.breadcrumb.userManagement') },
            ]}
            searchFields={searchFields}
            sortFields={sortFields}
            onSearch={handleSearch}
            onClear={handleClear}
            columns={dataTableColumns}
            data={paginatedData}
            totalEntries={filteredData.length}
            entriesPerPage={entriesPerPage}
            currentPage={currentPage}
            onPageChange={handlePageChange}
            onSort={handleTableSort}
            currentSortColumn={currentSortColumn}
            currentSortOrder={currentSortOrder}
            onCreateNew={handleCreateNew}
            onEntriesPerPageChange={handleEntriesPerPageChange} // NEW: Truyền prop này
        />
    );
}

export default User;