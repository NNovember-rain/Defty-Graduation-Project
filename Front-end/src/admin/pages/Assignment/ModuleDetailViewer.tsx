import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {Button, Card, Divider, Result, Space, Spin, Tag, Typography} from 'antd';
import {useTranslation} from 'react-i18next';
import {ArrowLeftOutlined, BookOutlined, FileTextOutlined, TagsOutlined} from '@ant-design/icons'; // Import icon Quay lại
import DOMPurify from 'dompurify';
import {useNavigate, useParams} from 'react-router-dom'; // Import useNavigate
import {
    getAssignmentClassDetail,
    type IAssignmentClassDetailResponse
} from "../../../shared/services/assignmentService.ts";


const { Title, Paragraph } = Typography;

interface ModuleDetailProps {
    assignmentTitle: string;
    assignmentDescriptionHtml: string;
    moduleName: string;
    moduleDescriptionHtml: string;
    typeUml: string;
    solutionCode: string;
    checkedTest?: boolean;
    startDate?: string | Date | null;
    endDate?: string | Date | null;
}

const ModuleDetailViewer: React.FC<ModuleDetailProps> = ({
                                                             assignmentTitle,
                                                             assignmentDescriptionHtml,
                                                             moduleName,
                                                             moduleDescriptionHtml,
                                                             typeUml,
                                                             checkedTest,
                                                             startDate,
                                                             endDate,
                                                         }) => {
    const { t } = useTranslation();

    const sanitizedModuleDescription = useMemo(() => {
        return moduleDescriptionHtml ? DOMPurify.sanitize(moduleDescriptionHtml) : '';
    }, [moduleDescriptionHtml]);

    const sanitizedAssignmentDescription = useMemo(() => {
        return assignmentDescriptionHtml ? DOMPurify.sanitize(assignmentDescriptionHtml) : '';
    }, [assignmentDescriptionHtml]);


    const formatDateTime = (dateString?: string | Date | null) => {
        if (!dateString) return t('common.na');
        try {
            return new Date(dateString).toLocaleString();
        } catch {
            return String(dateString);
        }
    };

    return (
        <Card
            title={
                <Title level={3} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 10, color: '#1890ff' }}>
                    <FileTextOutlined style={{ fontSize: '24px' }} />
                    {assignmentTitle || t('assignment.untitled')}
                </Title>
            }
            bordered={false}
            style={{ borderRadius: 10, boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)' }}
        >

            <Title level={4} style={{ margin: '16px 0 8px 0', color: '#595959' }}>
                {t('assignmentForm.commonDescriptionLabel') || 'Mô tả Bài tập Chung'}
            </Title>
            <Paragraph style={{ marginBottom: 30 }}>
                {sanitizedAssignmentDescription ? (
                    <div dangerouslySetInnerHTML={{ __html: sanitizedAssignmentDescription }} />
                ) : (
                    <Text type="secondary">{t('assignment.noCommonDescription') || 'Không có mô tả chung cho bài tập này.'}</Text>
                )}
            </Paragraph>

            <Divider style={{ margin: '20px 0' }} />

            <Title level={4} style={{ margin: '0 0 20px 0', display: 'flex', alignItems: 'center', gap: 8, color: '#52c41a' }}>
                <BookOutlined />
                {t('assignmentForm.moduleDescriptionsLabel') || 'Chi tiết Module'}: {moduleName || t('module.untitled')}
            </Title>


            <Space size="middle" wrap style={{ marginBottom: 20 }}>
                <Tag icon={<TagsOutlined />} color="processing" style={{ padding: '4px 8px', fontSize: '13px' }}>
                    {t('assignmentForm.typeUmlLabel')}: {typeUml || t('common.none')}
                </Tag>
                {checkedTest !== undefined && (
                    <Tag color={checkedTest ? 'success' : 'warning'} style={{ padding: '4px 8px', fontSize: '13px' }}>
                        {t('assignmentForm.mode')}: {checkedTest ? t('common.test') : t('common.practice')}
                    </Tag>
                )}
                {startDate && (
                    <Tag color="default" style={{ padding: '4px 8px', fontSize: '13px' }}>
                        {t('assignmentForm.startDate')}: {formatDateTime(startDate)}
                    </Tag>
                )}
                {endDate && (
                    <Tag color="default" style={{ padding: '4px 8px', fontSize: '13px' }}>
                        {t('assignmentForm.endDate')}: {formatDateTime(endDate)}
                    </Tag>
                )}
            </Space>

            <Title level={4} style={{ margin: '16px 0 8px 0', color: '#595959' }}>
                {t('assignmentForm.descriptionLabel') || 'Mô tả Module'}
            </Title>

            <Paragraph style={{ marginBottom: 30 }}>
                {sanitizedModuleDescription ? (
                    <div dangerouslySetInnerHTML={{ __html: sanitizedModuleDescription }} />
                ) : (
                    <Text type="secondary">{t('module.noDescription')}</Text>
                )}
            </Paragraph>
        </Card>
    );
};

interface AssignmentPathParams {
    assignmentClassDetailId: string;
}

const ModuleDetailFetcher: React.FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate(); // Khởi tạo useNavigate
    const [moduleData, setModuleData] = useState<IAssignmentClassDetailResponse | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const { assignmentClassDetailId } = useParams<AssignmentPathParams>();

    const isValidId = (param: string | undefined): param is string => {
        return !!param && param.toLowerCase() !== 'undefined';
    };

    const isIdValid = isValidId(assignmentClassDetailId);

    const handleGoBack = useCallback(() => {
        navigate(-1);
    }, [navigate]);

    const fetchData = useCallback(async () => {
        if (!isIdValid) {
            setError(t('common.missingParams') || "Thiếu ID chi tiết bài tập trong URL.");
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const data = await getAssignmentClassDetail(assignmentClassDetailId!);
            setModuleData(data);
        } catch (err) {
            console.error("Failed to fetch assignment class detail:", err);
            if (err instanceof Error && err.message.includes('NumberFormatException')) {
                setError(t('common.invalidId') || "ID bài tập không hợp lệ (Không phải là số).");
            } else {
                setError(t('common.fetchError') || "Không thể tải chi tiết module.");
            }
        } finally {
            setLoading(false);
        }
    }, [assignmentClassDetailId, isIdValid, t]);

    useEffect(() => {
        if (isIdValid) {
            fetchData();
        } else {
            fetchData();
        }
    }, [fetchData, isIdValid]);


    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '50px 0' }}>
                <Spin tip={t('common.loading') || "Đang tải dữ liệu..."} size="large" />
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ padding: 24, backgroundColor: '#f0f2f5', minHeight: '100vh' }}>
                <Button
                    onClick={handleGoBack}
                    icon={<ArrowLeftOutlined />}
                    style={{ marginBottom: 20 }}
                >
                    {t('common.back') || 'Quay lại'}
                </Button>
                <Result
                    status="error"
                    title={t('common.loadFailed') || "Tải thất bại"}
                    subTitle={error}
                    extra={
                        isIdValid && (
                            <Button type="primary" key="retry" onClick={fetchData}>
                                {t('common.retry') || "Thử lại"}
                            </Button>
                        )
                    }
                />
            </div>
        );
    }

    if (!moduleData) {
        return (
            <div style={{ padding: 24, backgroundColor: '#f0f2f5', minHeight: '100vh' }}>
                <Button
                    onClick={handleGoBack}
                    icon={<ArrowLeftOutlined />}
                    style={{ marginBottom: 20 }}
                >
                    {t('common.back') || 'Quay lại'}
                </Button>
                <Result
                    status="warning"
                    title={t('module.dataNotFound') || "Không tìm thấy dữ liệu Module"}
                    subTitle={t('module.checkId') || "Vui lòng kiểm tra ID bài tập trong URL."}
                />
            </div>
        );
    }

    const commonAssignmentDescriptionHtml = moduleData.assignmentDescriptionHtml || moduleData.assignmentDescription || '';

    return (
        <div style={{ padding: 18, minHeight: '100vh' }}>
            <Button
                onClick={handleGoBack}
                icon={<ArrowLeftOutlined />}
                style={{ marginBottom: 20 }}
            >
                {t('common.back') || 'Quay lại'}
            </Button>

            <ModuleDetailViewer
                assignmentTitle={moduleData.titleAssignment}
                assignmentDescriptionHtml={commonAssignmentDescriptionHtml}
                moduleName={moduleData.moduleName}
                moduleDescriptionHtml={moduleData.moduleDescription || ''}
                typeUml={moduleData.typeUml}
                solutionCode={moduleData.solutionCode}
                checkedTest={moduleData.checkedTest}
                startDate={moduleData.startDate}
                endDate={moduleData.endDate}
            />
        </div>
    );
};

export default ModuleDetailFetcher;