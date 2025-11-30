import {useEffect, useMemo, useState} from 'react'
import {useNavigate, useParams, useSearchParams} from 'react-router-dom'
import {getSubmissionsByClassAndAssignment} from "../../../../../shared/services/submissionService.ts";
import {getStudentsInClass} from "../../../../../shared/services/classManagementService.ts";
import {ArrowLeftOutlined, DownOutlined, UpOutlined} from '@ant-design/icons'
import {IoMailOutline, IoPeopleOutline} from 'react-icons/io5'
import {message, Spin} from 'antd';
import SubmissionDetailViewer from "../../../Submission/SubmissionDetailViewer.tsx";


interface StudentAssignmentData {
    id: string;
    name: string;
    submitted: boolean;
    score: number | null;
    status: 'Đã chấm' | 'Đã nộp' | 'Chưa nộp';
    submissionId: string | null;
}

interface AssignmentSummary {
    title: string;
    totalAssigned: number;
    totalSubmitted: number;
    totalGraded: number;
    maxScore: number;
}

const StudentAssignment = () => {
    const navigate = useNavigate()
    const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null)
    const [filterSubmitted, setFilterSubmitted] = useState(false)
    const [loading, setLoading] = useState(false)
    const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);

    const [students, setStudents] = useState<StudentAssignmentData[]>([])
    const [assignmentData, setAssignmentData] = useState<AssignmentSummary>({
        title: 'Bài tập',
        totalAssigned: 0,
        totalSubmitted: 0,
        totalGraded: 0,
        maxScore: 100
    })
    const { classId, assignmentId } = useParams<{ classId: string, assignmentId: string }>();
    const [searchParams] = useSearchParams();

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true)
            setSelectedStudentId(null);

            if (!classId || !assignmentId) {
                console.error('Missing classId or assignmentId');
                setLoading(false);
                return;
            }

            const assignmentClassDetailIdParam = searchParams.get('assignmentClassDetailId');

            if (!assignmentClassDetailIdParam) {
                console.error('assignmentClassDetailId not found in URL params');
                setLoading(false);
                return;
            }

            try {
                const classIdNum = Number(classId);
                const assignmentClassDetailId = Number(assignmentClassDetailIdParam);

                const [studentsInClassResult, submissionsResult] = await Promise.all([
                    getStudentsInClass(classIdNum, { limit: 100 } as any),
                    getSubmissionsByClassAndAssignment(classIdNum, assignmentClassDetailId)
                ]);

                const studentsInClass = studentsInClassResult.content;
                const submissions = submissionsResult.submissions;

                const submittedMap = new Map();
                submissions.forEach((sub: any) => {
                    submittedMap.set(sub.studentId.toString(), sub);
                });

                const mergedStudents: StudentAssignmentData[] = studentsInClass.map((student: any) => {
                    const submission = submittedMap.get(student.studentId.toString());
                    const submitted = !!submission;
                    const score = submission?.score ?? null;
                    const submissionId = submission?.id.toString() ?? null;

                    const status: 'Đã chấm' | 'Đã nộp' | 'Chưa nộp' = score != null
                        ? 'Đã chấm'
                        : submitted
                            ? 'Đã nộp'
                            : 'Chưa nộp';

                    return {
                        id: student.studentId.toString(),
                        name: student.fullName,
                        submitted: submitted,
                        score: score,
                        status: status,
                        submissionId: submissionId,
                    };
                });


                setStudents(mergedStudents)

                const totalSubmitted = submissions.length;
                const totalGraded = submissions.filter((s: any) => s.score != null).length;

                setAssignmentData({
                    title: submissions[0]?.assignmentTitle || 'Bài tập',
                    totalAssigned: mergedStudents.length,
                    totalSubmitted: totalSubmitted,
                    totalGraded: totalGraded,
                    maxScore: 100
                })

            } catch (error) {
                console.error('Error fetching data:', error)
                message.error('Lỗi khi tải dữ liệu bài tập và học viên.');
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [classId, assignmentId, searchParams])
    const updateStudentScore = (studentId: string, newScore: number) => {
        let wasGradedBefore = false;
        setStudents(prevStudents => prevStudents.map(student => {
            if (student.id === studentId) {
                wasGradedBefore = student.score !== null;
                return {
                    ...student,
                    score: newScore,
                    status: 'Đã chấm'
                };
            }
            return student;
        }));

        setAssignmentData(prev => {
            return {
                ...prev,
                totalGraded: wasGradedBefore ? prev.totalGraded : prev.totalGraded + 1
            };
        });
    }

    const filteredStudents = useMemo(() => {
        return students.filter((s) => !filterSubmitted || s.submitted)
    }, [students, filterSubmitted]);

    const selectedStudent = useMemo(() => {
        return students.find((s) => s.id === selectedStudentId)
    }, [students, selectedStudentId]);

    const renderSortMenu = () => (
        <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-20">
            <div className="py-1">
                <button className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                    Theo ngày nộp
                </button>
                <button className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                    Theo điểm số
                </button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col">
            <header className="bg-white border-b border-gray-200 h-14 flex items-center px-6 sticky top-0 z-10">
                <div className="flex items-center h-full flex-grow">
                    <button
                        className="p-2 mr-4 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                        onClick={() => navigate(-1)}
                        aria-label="Quay lại"
                    >
                        <ArrowLeftOutlined className="text-lg" />
                    </button>

                    <nav className="h-full flex-grow">
                        <ul className="flex h-full space-x-6">
                            <li className="h-full border-b-2 border-blue-500">
                                <span className="flex items-center h-full text-sm font-semibold text-blue-600">
                                    Bài tập của học viên
                                </span>
                            </li>
                        </ul>
                    </nav>
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden">
                <aside className="w-72 bg-white border-r border-gray-200 flex-shrink-0 overflow-y-auto">
                    <div className="p-4 border-b border-gray-200">
                        {/*<h2 className="text-base font-bold text-gray-800 mb-2">{assignmentData.title}</h2>*/}

                        <div className="grid grid-cols-3 gap-2 text-center text-sm">
                            <div className="p-2 bg-blue-50 rounded-lg">
                                <p className="text-xl font-bold text-blue-600">{assignmentData.totalSubmitted}</p>
                                <p className="text-xs text-blue-600 mt-0.5">Đã nộp</p>
                            </div>
                            <div className="p-2 bg-red-50 rounded-lg">
                                <p className="text-xl font-bold text-red-600">{assignmentData.totalAssigned - assignmentData.totalSubmitted}</p>
                                <p className="text-xs text-red-600 mt-0.5">Chưa nộp</p>
                            </div>
                            <div className="p-2 bg-green-50 rounded-lg">
                                <p className="text-xl font-bold text-green-600">{assignmentData.totalGraded}</p>
                                <p className="text-xs text-green-600 mt-0.5">Đã chấm</p>
                            </div>

                        </div>
                        <p className="text-xs text-gray-500 mt-2 text-right">Tổng: {assignmentData.totalAssigned} HV | Điểm tối đa: {assignmentData.maxScore}</p>
                    </div>

                    <div className="p-4 border-b border-gray-200 space-y-3">

                        <button className="w-full bg-gray-100 text-gray-700 font-medium py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors">
                            <IoPeopleOutline className="text-lg" />
                            Tất cả học viên ({students.length})
                        </button>

                        <div className="relative">
                            <button
                                className="w-full bg-white border border-gray-300 text-gray-700 py-2 px-3 rounded-lg text-left text-sm flex justify-between items-center hover:bg-gray-50 transition-colors"
                                onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
                            >
                                Sắp xếp theo...
                                {isSortDropdownOpen ? <UpOutlined className="text-xs" /> : <DownOutlined className="text-xs" />}
                            </button>
                            {isSortDropdownOpen && renderSortMenu()}
                        </div>

                        <label className="flex items-center space-x-2 text-sm text-gray-700 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={filterSubmitted}
                                onChange={(e) => setFilterSubmitted(e.target.checked)}
                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <IoMailOutline className="text-base text-gray-500" />
                            <span>Chỉ Đã nộp</span>
                        </label>

                    </div>

                    {/* KHỐI 3: DANH SÁCH HỌC VIÊN */}
                    <ul className="py-2">
                        {filteredStudents.map((student) => {
                            let statusColor = 'text-gray-500';
                            let statusText = 'Chưa nộp';
                            let scoreDisplay = '';

                            if (student.score != null) {
                                statusColor = 'text-green-600';
                                statusText = 'Đã chấm';
                                scoreDisplay = `${student.score}/${assignmentData.maxScore}`;
                            } else if (student.submitted) {
                                statusColor = 'text-yellow-600';
                                statusText = 'Đã nộp';
                            }

                            const isSelected = student.id === selectedStudentId;

                            return (
                                <li
                                    key={student.id}
                                    className={`
                                        flex items-center justify-between px-4 py-2 cursor-pointer border-l-4 transition-colors 
                                        ${isSelected
                                        ? 'bg-blue-50 border-blue-600 text-blue-800'
                                        : 'border-transparent hover:bg-gray-50 text-gray-800'
                                    }
                                    `}
                                    onClick={() => setSelectedStudentId(student.id)}
                                >
                                    <div className="flex items-center min-w-0 flex-grow">
                                        <IoPeopleOutline className={`text-lg mr-2 ${isSelected ? 'text-blue-600' : 'text-gray-500'}`} />
                                        <span className={`font-medium truncate ${isSelected ? 'font-bold' : ''}`}>{student.name}</span>
                                    </div>

                                    <div className={`text-xs font-semibold flex-shrink-0 ${statusColor} ml-2`}>
                                        {scoreDisplay || statusText}
                                    </div>
                                </li>
                            );
                        })}
                        {loading && (
                            <div className="flex justify-center p-4">
                                <Spin size="small" />
                            </div>
                        )}
                        {filteredStudents.length === 0 && !loading && (
                            <p className="text-center text-sm text-gray-500 p-4">Không tìm thấy học viên.</p>
                        )}
                    </ul>
                </aside>

                <main className="flex-1 p-6 overflow-y-auto">
                    <div className="bg-white rounded-xl shadow-lg p-6 min-h-full">
                        {selectedStudentId === null || !selectedStudent ? (
                            <div className="text-center p-12 text-gray-500">
                                <IoPeopleOutline className="text-5xl mx-auto mb-4" />
                                <p className="text-lg font-semibold text-gray-700">Chọn một học viên</p>
                                <p>Vui lòng chọn một học viên từ danh sách bên trái để xem chi tiết bài nộp và tiến hành chấm điểm.</p>
                            </div>
                        ) : (
                            <SubmissionDetailViewer
                                selectedStudent={selectedStudent}
                                maxScore={assignmentData.maxScore}
                                onScoreUpdate={updateStudentScore}
                            />
                        )}
                    </div>
                </main>
            </div>
        </div>
    )
}

export default StudentAssignment