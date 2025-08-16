import React, {useEffect, useState} from "react";
import {useNavigate, useParams} from "react-router-dom";
import {Button, Divider, message, Space, Spin, Tag, Typography} from "antd";
import {useTranslation} from "react-i18next";
import dayjs from "dayjs";
import {getAssignmentById, type IAssignment} from "../../../../../shared/services/assignmentService.ts";
import {ArrowLeftOutlined} from "@ant-design/icons";

const { Title, Text } = Typography;

const AssignmentDetail: React.FC = () => {
    const { t } = useTranslation();
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [assignment, setAssignment] = useState<IAssignment | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) {
            fetchData(Number(id));
        }
    }, [id]);

    const fetchData = async (assignmentId: number) => {
        try {
            setLoading(true);
            const data = await getAssignmentById(assignmentId);
            console.log("Assignment data:", data);
            setAssignment(data);
        } catch (error) {
            console.error(error);
            message.error(t("assignmentDetail.loadError") || "Failed to load assignment details");
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div style={{ textAlign: "center", marginTop: "20vh" }}>
                <Spin size="large" />
            </div>
        );
    }

    if (!assignment) {
        return (
            <div style={{ textAlign: "center", marginTop: "20vh" }}>
                <Text type="danger">{t("common.notFound") || "Assignment not found"}</Text>
            </div>
        );
    }

    return (
        <div style={{ padding: "2rem", maxWidth: 900, margin: "0 auto" }}>
            {/* Thay Card bằng div */}
            <div
                style={{
                    boxShadow: "0 4px 12px rgb(0 0 0 / 0.15)",
                    borderRadius: 12,
                    padding: "2rem",
                    backgroundColor: "white",
                }}
            >
                <Space direction="vertical" size="large" style={{width: "100%"}}>
                    <Title level={2} style={{marginBottom: 0}}>
                        {assignment.title}
                    </Title>

                    <div>
                        <Tag color="blue" style={{fontWeight: "bold", fontSize: 14}}>
                            {assignment.typeUmlName}
                        </Tag>
                        <Text type="secondary" style={{marginLeft: 16, fontSize: 14}}>
                            {t("assignmentPage.columns.creationDate")}:{" "}
                            {dayjs(assignment.createdDate).format("DD/MM/YYYY HH:mm")}
                        </Text>
                    </div>
                    <div style={{marginTop: 8}}>
                        <Text type="secondary" style={{fontSize: 14, marginRight: 16}}>
                            {t("assignmentForm.startDate")}: {assignment.startDate ? dayjs(assignment.startDate).format("DD/MM/YYYY") : "-"}
                        </Text>
                        <Text type="secondary" style={{fontSize: 14}}>
                            {t("assignmentForm.endDate")}: {assignment.endDate ? dayjs(assignment.endDate).format("DD/MM/YYYY") : "-"}
                        </Text>
                    </div>

                    {assignment.description && (
                        <>
                            <Divider/>
                            <div
                                style={{fontSize: 16, lineHeight: 1.6, whiteSpace: "normal"}}
                                dangerouslySetInnerHTML={{__html: assignment.description}}
                            />
                        </>
                    )}

                    <Divider/>

                    <Space size="middle" style={{justifyContent: "flex-end", width: "100%"}}>
                        <Button
                            icon={<ArrowLeftOutlined/>}
                            size="large"
                            onClick={() => navigate(-1)}
                        >
                            {t("common.back") || "Back"}
                        </Button>
                    </Space>
                </Space>
            </div>
        </div>
    );
};

export default AssignmentDetail;
