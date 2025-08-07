import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Spinner } from 'react-bootstrap';

// Giả định có các interface dữ liệu từ backend
interface ITeacher {
    id: number;
    name: string;
    avatarUrl: string;
}

interface IStudent {
    id: number;
    name: string;
    avatarUrl: string;
}

// Giả định mock data cho ví dụ
const mockTeachers: ITeacher[] = [
    { id: 1, name: 'Michael John', avatarUrl: 'https://via.placeholder.com/40' }
];

const mockStudents: IStudent[] = [
    { id: 101, name: 'B21DCCN233_Dương Văn Dư', avatarUrl: 'https://via.placeholder.com/40' },
];

interface ClassPeopleTabProps {
    classId: number;
}

const ClassPeopleTab: React.FC<ClassPeopleTabProps> = ({ classId }) => {
    const { t } = useTranslation();
    const [teachers, setTeachers] = useState<ITeacher[]>([]);
    const [students, setStudents] = useState<IStudent[]>([]);
    const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchPeople = async () => {
            setLoading(true);
            setError(null);
            try {
                // Sử dụng mock data cho ví dụ
                setTeachers(mockTeachers);
                setStudents(mockStudents);
                setLoading(false);
            } catch (err: any) {
                console.error("Failed to fetch class people:", err);
                setError(err.message || t('common.errorFetchingData'));
                setLoading(false);
            }
        };

        fetchPeople();
    }, [classId, t]);

    const handleSelectStudent = (studentId: number) => {
        if (selectedStudents.includes(studentId)) {
            setSelectedStudents(selectedStudents.filter(id => id !== studentId));
        } else {
            setSelectedStudents([...selectedStudents, studentId]);
        }
    };

    if (loading) {
        return <div style={{ padding: '1rem', display: 'flex', justifyContent: 'center' }}><Spinner animation="border" /></div>;
    }

    if (error) {
        return <div style={{ padding: '1rem', color: '#dc3545', backgroundColor: '#f8d7da', border: '1px solid #f5c6cb' }}>{error}</div>;
    }

    return (
        <div style={{ padding: '1rem' }}>
            {/* Phần Giáo viên */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e0e0e0', paddingBottom: '0.5rem', marginBottom: '1.5rem' }}>
                <h4 style={{ margin: 0, fontWeight: 500 }}>{t('classDetail.peopleTab.teachersTitle')}</h4>
                <div style={{ width: '24px', height: '24px', backgroundColor: '#e0e0e0', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                    <span style={{ fontSize: '1.2rem' }}>+</span>
                </div>
            </div>
            <div style={{ marginBottom: '2rem' }}>
                {teachers.map(teacher => (
                    <div key={teacher.id} style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
                        <img src={teacher.avatarUrl} alt={teacher.name} style={{ width: '48px', height: '48px', borderRadius: '50%', marginRight: '1rem' }} />
                        <span style={{ fontSize: '1.1rem' }}>{teacher.name}</span>
                    </div>
                ))}
            </div>

            {/* Phần Học sinh */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e0e0e0', paddingBottom: '0.5rem', marginBottom: '1.5rem' }}>
                <h4 style={{ margin: 0, fontWeight: 500 }}>{t('classDetail.peopleTab.studentsTitle')}</h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ color: '#6c757d' }}>{students.length} {t('classDetail.peopleTab.studentCount')}</span>
                    <div style={{ width: '24px', height: '24px', backgroundColor: '#e0e0e0', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                        <span style={{ fontSize: '1.2rem' }}>+</span>
                    </div>
                </div>
            </div>

            {/* Thanh hành động hàng loạt */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input type="checkbox" onChange={() => { /* logic chọn tất cả */ }} />
                    <select style={{ padding: '0.5rem', border: '1px solid #e0e0e0', borderRadius: '4px' }}>
                        <option value="">{t('classDetail.peopleTab.actions')}</option>
                        {/* Thêm các tùy chọn khác */}
                    </select>
                </div>
                <div style={{ padding: '0.5rem', border: '1px solid #e0e0e0', borderRadius: '4px', cursor: 'pointer' }}>
                    A-Z
                </div>
            </div>

            {/* Danh sách học sinh */}
            <div>
                {students.map(student => (
                    <div key={student.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 0', borderBottom: '1px solid #e0e0e0' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <input
                                type="checkbox"
                                checked={selectedStudents.includes(student.id)}
                                onChange={() => handleSelectStudent(student.id)}
                            />
                            <img src={student.avatarUrl} alt={student.name} style={{ width: '48px', height: '48px', borderRadius: '50%', marginRight: '0.5rem' }} />
                            <span style={{ fontSize: '1.1rem' }}>{student.name}</span>
                        </div>
                        <div style={{ cursor: 'pointer' }}>...</div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ClassPeopleTab;