import {useEffect, useState} from 'react'
import {Button, Card, Checkbox, Dropdown, Input, Layout, List, Menu, Space, Statistic, Switch, Tag, Tooltip} from 'antd'
import {
    DownOutlined,
    FileTextOutlined,
    FolderOutlined,
    InboxOutlined,
    InfoCircleOutlined,
    MailOutlined,
    RightOutlined,
    SettingOutlined,
    TeamOutlined,
    UserOutlined
} from '@ant-design/icons'
import {useNavigate, useParams} from 'react-router-dom'
import {getSubmissionsByClassAndAssignment} from "../../../../../shared/services/submissionService.ts";


const { Header, Content, Sider } = Layout

const StudentAssignmentManagerAntD = () => {
    const navigate = useNavigate()
    const [isAccepting, setIsAccepting] = useState(true)
    const [selectedStudentId, setSelectedStudentId] = useState<string>()
    const [filterSubmitted, setFilterSubmitted] = useState(false)
    const [loading, setLoading] = useState(false)

    const [students, setStudents] = useState<any[]>([])
    const [assignmentData, setAssignmentData] = useState({
        title: 'Bài tập Chương 1',
        totalAssigned: 0,
        totalSubmitted: 0,
        totalGraded: 0,
        maxScore: 100
    })
    const { classId, assignmentId } = useParams();

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true)
            try {
                if (!classId || !assignmentId) {
                    throw new Error('Missing classId or assignmentId');
                }
                const result = await getSubmissionsByClassAndAssignment(Number(classId), Number(assignmentId))
                // console.log(result)
                const submissions = result.submissions.map((s) => ({
                    id: s.id.toString(),
                    name: s.studentName,
                    submitted: true,
                    score: s.score,
                    status: s.score != null ? 'Đã chấm' : 'Đã nộp'
                }))
                setStudents(submissions)
                setAssignmentData({
                    title: result.submissions[0]?.assignmentTitle || 'Bài tập',
                    totalAssigned: result.total,
                    totalSubmitted: submissions.length,
                    totalGraded: submissions.filter((s) => s.score != null).length,
                    maxScore: 100
                })
                setSelectedStudentId(submissions[0]?.id)
            } catch (error) {
                console.error('Error fetching submissions:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [])

    const filteredStudents = students.filter((s) => !filterSubmitted || s.submitted)
    const selectedStudent = students.find((s) => s.id === selectedStudentId)

    const goToAssignmentDetails = (submissionId: string) => {
        navigate(`/admin/assignments/${submissionId}/details`)
    }

    const sortMenu = (
        <Menu
            items={[
                { key: 'name', label: 'Theo tên' },
                { key: 'status', label: 'Theo trạng thái' },
                { key: 'score', label: 'Theo điểm số' }
            ]}
        />
    )

    const studentMenuItems = filteredStudents.map((student) => ({
        key: student.id,
        icon: <UserOutlined style={{ color: student.id === selectedStudentId ? '#1890ff' : '#999' }} />,
        label: (
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                <span style={{ fontWeight: 500 }}>{student.name}</span>
                <span style={{ color: student.score != null ? '#52c41a' : '#999', fontSize: '12px' }}>
          {student.score != null ? `${student.score}/${assignmentData.maxScore}` : '--'}
        </span>
            </div>
        ),
        className: student.id === selectedStudentId ? 'ant-menu-item-selected' : ''
    }))

    return (
        <Layout style={{ minHeight: '100vh', backgroundColor: '#f0f2f5' }}>
            {/* --- HEADER --- */}
            <Header style={{ backgroundColor: '#fff', borderBottom: '1px solid #f0f0f0', padding: '0 24px', height: '56px' }}>
                <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
                    <Menu
                        mode="horizontal"
                        defaultSelectedKeys={['student-work']}
                        style={{ borderBottom: 'none', flexGrow: 1, lineHeight: '56px' }}
                    >
                        <Menu.Item key="guide">Hướng dẫn</Menu.Item>
                        <Menu.Item key="student-work">Bài tập của học viên</Menu.Item>
                    </Menu>
                    <Tooltip title="Cài đặt">
                        <SettingOutlined style={{ fontSize: '18px', color: 'rgba(0, 0, 0, 0.65)', cursor: 'pointer' }} />
                    </Tooltip>
                </div>
            </Header>

            <Layout>
                <Sider width={280} style={{ backgroundColor: '#fff', borderRight: '1px solid #f0f0f0' }}>
                    <div style={{ padding: '16px 24px', borderBottom: '1px solid #f0f0f0' }}>
                        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                            <Button type="default" icon={<TeamOutlined />} style={{ width: '100%', fontWeight: 500 }}>
                                Tất cả học viên
                            </Button>
                            <Dropdown overlay={sortMenu} trigger={['click']} placement="bottomLeft">
                                <Button style={{ width: '100%', textAlign: 'left' }}>
                                    Sắp xếp theo... <DownOutlined style={{ float: 'right', marginTop: '4px' }} />
                                </Button>
                            </Dropdown>
                            <Checkbox checked={filterSubmitted} onChange={(e) => setFilterSubmitted(e.target.checked)}>
                                <InboxOutlined /> Đã nộp
                            </Checkbox>
                        </Space>
                    </div>

                    <Menu
                        mode="inline"
                        selectedKeys={[selectedStudentId || '']}
                        onClick={(e) => setSelectedStudentId(e.key)}
                        items={studentMenuItems}
                        style={{ borderRight: 0 }}
                    />
                </Sider>

                {/* --- MAIN CONTENT --- */}
                <Content style={{ padding: 32, backgroundColor: '#f0f2f5' }}>
                    <Card bordered={false} style={{ marginBottom: 24 }} loading={loading}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <h2 style={{ fontSize: '24px', fontWeight: 600, margin: '0 0 16px 0' }}>{assignmentData.title}</h2>
                                <Space size="large">
                                    <Statistic title="Đã nộp" value={assignmentData.totalSubmitted} suffix={`/${assignmentData.totalAssigned}`} />
                                    <Statistic title="Đã giao" value={assignmentData.totalAssigned - assignmentData.totalSubmitted} />
                                    <Statistic title="Đã chấm" value={assignmentData.totalGraded} />
                                </Space>
                            </div>

                            <Space size="middle">
                                <Button type="default" icon={<MailOutlined />}>
                                    Gửi Email
                                </Button>
                                <Button type="primary">Trả bài</Button>
                                <Input addonBefore="Điểm" defaultValue={assignmentData.maxScore} style={{ width: 120, textAlign: 'center' }} disabled />
                            </Space>
                        </div>
                    </Card>

                    <Card bordered={false} style={{ marginBottom: 24 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Space size="large">
                                <FileTextOutlined style={{ fontSize: '18px', color: '#1890ff' }} />
                                <span style={{ fontWeight: 500 }}>Trạng thái nộp bài</span>
                            </Space>
                            <Space>
                                <Switch
                                    checkedChildren="On"
                                    unCheckedChildren="Off"
                                    checked={isAccepting}
                                    onChange={setIsAccepting}
                                />
                                <Tooltip title="Cho phép học viên nộp bài sau thời hạn">
                                    <InfoCircleOutlined style={{ color: 'rgba(0, 0, 0, 0.45)' }} />
                                </Tooltip>
                            </Space>
                        </div>
                    </Card>

                    <Card bordered={false} title={<Space><FolderOutlined /> Bài nộp của học viên</Space>}>
                        {selectedStudent && (
                            <List
                                grid={{ gutter: 16, column: 3 }}
                                dataSource={[selectedStudent]}
                                renderItem={(item) => (
                                    <List.Item>
                                        <Card
                                            hoverable
                                            style={{ width: '100%' }}
                                            actions={[
                                                <Tooltip title="Xem chi tiết">
                                                    <RightOutlined onClick={() => goToAssignmentDetails(item.id)} />
                                                </Tooltip>
                                            ]}
                                        >
                                            <Card.Meta
                                                avatar={<UserOutlined style={{ fontSize: '24px', color: '#1890ff' }} />}
                                                title={item.name}
                                                description={
                                                    <>
                                                        <Tag
                                                            color={
                                                                item.status === 'Đã chấm'
                                                                    ? 'green'
                                                                    : item.status === 'Đã nộp'
                                                                        ? 'blue'
                                                                        : 'default'
                                                            }
                                                            style={{ marginBottom: '8px' }}
                                                        >
                                                            {item.status}
                                                        </Tag>
                                                        <div style={{ color: '#595959' }}>
                                                            {item.status === 'Đã chấm'
                                                                ? `Điểm: ${item.score}/${assignmentData.maxScore}`
                                                                : 'Chờ giáo viên chấm'}
                                                        </div>
                                                    </>
                                                }
                                            />
                                        </Card>
                                    </List.Item>
                                )}
                            />
                        )}
                    </Card>
                </Content>
            </Layout>
        </Layout>
    )
}

export default StudentAssignmentManagerAntD
