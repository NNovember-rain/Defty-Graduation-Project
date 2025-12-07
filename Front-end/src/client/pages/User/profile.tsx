import {useEffect, useState} from 'react';
import {FaEdit, FaEye, FaTimes, FaUser} from 'react-icons/fa';
import moment from 'moment';
import {getUserDetail, type IUser, updateUserDetail} from "../../../shared/services/userService.ts";
import {message} from "antd";

const styles = {
    container: {
        padding: '30px',
        maxWidth: '750px',
        margin: '0 auto',
        fontFamily: 'Arial, sans-serif',
        color: '#f0f0f0',
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '30px',
        borderBottom: '1px solid #444',
        paddingBottom: '20px',
    },
    title: {
        fontSize: '24px',
        margin: 0,
        fontWeight: 500,
        color: '#fff',
    },
    avatarSection: {
        textAlign: 'center',
        marginBottom: '40px',
    },
    avatar: {
        width: '100px',
        height: '100px',
        borderRadius: '50%',
        backgroundColor: '#1890ff',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '40px',
        color: 'white',
        marginBottom: '10px',
    },
    fullName: {
        fontSize: '22px',
        fontWeight: 500,
        color: '#fff',
        marginTop: '10px',
    },
    divider: {
        border: 'none',
        borderBottom: '1px solid #3a3a3a',
        margin: '30px 0 20px 0',
    },
    sectionTitle: {
        textAlign: 'center',
        fontSize: '14px',
        color: '#aaa',
        textTransform: 'uppercase',
        letterSpacing: '1px',
        marginBottom: '20px',
    },
    row: {
        display: 'flex',
        gap: '20px',
        marginBottom: '20px',
    },
    col: {
        flex: 1,
    },
    formGroup: {
        marginBottom: 0,
    },
    label: {
        display: 'block',
        marginBottom: '8px',
        fontSize: '14px',
        fontWeight: 500,
        color: '#fff',
    },
    inputWrapper: {
        display: 'flex',
        alignItems: 'center',
        backgroundColor: '#2b2b2b',
        borderRadius: '6px',
        overflow: 'hidden',
        border: '1px solid #3a3a3a',
    },
    input: {
        flexGrow: 1,
        padding: '10px 12px',
        backgroundColor: 'transparent',
        border: 'none',
        color: '#f0f0f0',
        fontSize: '16px',
        outline: 'none',
    },
    prefixIcon: {
        padding: '0 10px',
        color: '#bbb',
    },
    buttonPrimary: {
        backgroundColor: '#1890ff',
        color: 'white',
        border: 'none',
        borderRadius: '5px',
        padding: '5px 10px',
        cursor: 'pointer',
        fontSize: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
    },
    buttonSecondary: {
        backgroundColor: 'transparent',
        color: '#1890ff',
        border: '1px solid #1890ff',
        borderRadius: '6px',
        padding: '10px 20px',
        cursor: 'pointer',
        fontSize: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginRight: '10px',
    },
    inputReadonly: {
        cursor: 'default',
        backgroundColor: '#252525',
    },
    apiKeyGroup: {
        display: 'flex',
        width: '100%',
    },
    apiKeyInput: {
        flexGrow: 1,
        padding: '10px 12px',
        backgroundColor: '#2b2b2b',
        border: '1px solid #3a3a3a',
        borderTopLeftRadius: '6px',
        borderBottomLeftRadius: '6px',
        color: '#f0f0f0',
        fontSize: '16px',
        outline: 'none',
        borderRight: 'none',
    },
    apiKeyButton: {
        backgroundColor: '#4a4a4a',
        color: '#f0f0f0',
        border: '1px solid #3a3a3a',
        borderLeft: 'none',
        borderTopRightRadius: '6px',
        borderBottomRightRadius: '6px',
        padding: '0 15px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
    },
    extraText: {
        marginTop: '5px',
        fontSize: '12px',
        color: '#888',
        lineHeight: 1.4,
    },
};

// @ts-ignore
const CustomInput = ({ label, name, value, onChange, type = 'text', readOnly, icon: Icon, required = false, isEditing }) => (
    <div style={styles.formGroup}>
        <label style={styles.label} htmlFor={name}>
            {required && <span style={{ color: '#ff4d4f', marginRight: '4px' }}>*</span>}
            {label}
        </label>
        <div style={styles.inputWrapper}>
            {Icon && <Icon style={styles.prefixIcon} size={16} />}
            {type === 'date' ? (
                <input
                    id={name}
                    name={name}
                    type="date"
                    value={value ? moment(value).format('YYYY-MM-DD') : ''}
                    onChange={onChange}
                    readOnly={readOnly || !isEditing}
                    style={{ ...styles.input, ...(readOnly || !isEditing ? styles.inputReadonly : {}) }}
                />
            ) : (
                <input
                    id={name}
                    name={name}
                    type={type}
                    value={value || ''}
                    onChange={onChange}
                    readOnly={readOnly || !isEditing}
                    style={{ ...styles.input, ...(readOnly || !isEditing ? styles.inputReadonly : {}) }}
                />
            )}
        </div>
    </div>
);

const UserProfileForm = () => {

    const [userData, setUserData] = useState<IUser | null>(null);
    const [originalData, setOriginalData] = useState<IUser | null>(null);

    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    const [showApiKey, setShowApiKey] = useState(false);

    useEffect(() => {
        loadUser();
    }, []);

    const loadUser = async () => {
        setFetching(true);
        try {
            const data = await getUserDetail();
            console.log('Loaded user data:', data);
            setUserData(data);
            setOriginalData(data);
        } catch (e) {
            console.error('Lỗi load user:', e);
        } finally {
            setFetching(false);
        }
    };

    const handleChange = (e) => {
        setUserData({ ...userData, [e.target.name]: e.target.value });
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            await updateUserDetail(userData);
            await loadUser();
            message.success('Cập nhật thông tin người dùng thành công!');
            setIsEditing(false);
        } catch (error) {
            console.error('Lỗi khi cập nhật người dùng:', error);
            alert('Lỗi khi cập nhật thông tin. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        setUserData(originalData);
        setIsEditing(false);
    };

    if (fetching) {
        return (
            <div style={{ color: '#fff', padding: '40px', textAlign: 'center' }}>
                Đang tải dữ liệu người dùng...
            </div>
        );
    }

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <h2 style={styles.title}>{isEditing ? 'Chỉnh sửa Hồ sơ' : 'Chi tiết Hồ sơ Người dùng'}</h2>

                <button
                    style={styles.buttonPrimary}
                    onClick={() => {
                        if (isEditing) handleCancel();
                        else setIsEditing(true);
                    }}
                >
                    {isEditing ? <FaTimes size={16} /> : <FaEdit size={16} />}
                    {isEditing ? 'Hủy' : 'Chỉnh sửa'}
                </button>
            </div>

            <form onSubmit={handleSave}>
                <div style={styles.avatarSection}>
                    <div style={styles.avatar}>
                        {userData.avatarUrl ? (
                            <img
                                src={userData.avatarUrl}
                                alt="Avatar"
                                style={{ width: '100%', height: '100%', borderRadius: '50%' }}
                            />
                        ) : (
                            <FaUser />
                        )}
                    </div>
                </div>

                <div style={styles.sectionTitle}>Thông tin cơ bản</div>
                <div style={styles.divider}></div>

                {/* ROW 1 */}
                <div style={styles.row}>
                    <div style={styles.col}>
                        <CustomInput
                            label="Tên đăng nhập"
                            name="username"
                            value={userData.username}
                            onChange={handleChange}
                            required={true}
                            isEditing={isEditing}
                        />
                    </div>

                    <div style={styles.col}>
                        <CustomInput
                            label="Mã người dùng"
                            name="userCode"
                            value={userData.userCode}
                            readOnly={true}
                        />
                    </div>
                </div>

                {/* ROW 2 */}
                <div style={styles.row}>
                    <div style={styles.col}>
                        <CustomInput
                            label="Họ và Tên"
                            name="fullName"
                            value={userData.fullName}
                            onChange={handleChange}
                            required={true}
                            isEditing={isEditing}
                        />
                    </div>

                    <div style={styles.col}>
                        <CustomInput
                            label="Ngày sinh"
                            name="dob"
                            value={userData.dob}
                            onChange={handleChange}
                            type="date"
                            isEditing={isEditing}
                        />
                    </div>
                </div>

                <CustomInput
                    label="Email"
                    name="email"
                    value={userData.email}
                    onChange={handleChange}
                    required={true}
                    isEditing={isEditing}
                />

                <div style={styles.divider}></div>

                {/* API KEY */}
                <div style={styles.formGroup}>
                    <label style={styles.label}>API Key</label>

                    <div style={styles.apiKeyGroup}>
                        <input
                            type={showApiKey || isEditing ? 'text' : 'password'}
                            value={userData.apiKey}
                            onChange={handleChange}
                            name="apiKey"
                            readOnly={!isEditing}
                            style={styles.apiKeyInput}
                        />

                        {!isEditing && (
                            <button
                                type="button"
                                onClick={() => setShowApiKey(!showApiKey)}
                                style={styles.apiKeyButton}
                            >
                                <FaEye size={16} />
                            </button>
                        )}
                    </div>
                </div>

                {isEditing && (
                    <>
                        <div style={{ marginTop: '10px' }}>
                            <a
                                href="https://aistudio.google.com/apikey"
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                    color: '#1a73e8',
                                    textDecoration: 'underline',
                                    fontSize: '14px',
                                    cursor: 'pointer'
                                }}
                            >
                                Tạo API Key mới
                            </a>
                        </div>

                        <div style={{ marginTop: '30px', textAlign: 'center' }}>
                            <button
                                type="submit"
                                style={{ ...styles.buttonPrimary }}
                                disabled={loading || isGenerating}
                            >
                                {loading ? 'Đang lưu...' : 'Lưu Thay Đổi'}
                            </button>
                        </div>
                    </>
                )}

            </form>
        </div>
    );
};

export default UserProfileForm;