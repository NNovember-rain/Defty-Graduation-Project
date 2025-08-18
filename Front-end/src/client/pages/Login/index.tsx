import React, { useState } from "react";
import "./Login.scss";
import { FaEnvelope, FaEye, FaEyeSlash } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { getCurrentAccount, postLogin } from "../../../shared/services/authService";
import { type UserProfile, useUserStore } from "../../../shared/authentication/useUserStore.ts";
import { setLocalStorageItem } from "../../../shared/utils/localStorage.ts";
import { useNotification } from "../../../shared/notification/useNotification.ts";
import { Spin } from 'antd';
// import 'antd/dist/reset.css';

const Login: React.FC = () => {
    const { message, notification } = useNotification();
    const navigate = useNavigate();
    const { setUser } = useUserStore();
    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const [loginLoading, setLoginLoading] = useState<boolean>(false);
    const [emailError, setEmailError] = useState<string | null>(null);
    const [passwordError, setPasswordError] = useState<string | null>(null);

    const toggleShowPassword = () => {
        setShowPassword(prev => !prev);
    };

    // Hàm kiểm tra định dạng email
    const validateEmail = (email: string): string | null => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email) {
            return "Email không được để trống";
        } else if (!emailRegex.test(email)) {
            return "Định dạng email không hợp lệ";
        }
        return null;
    };

    // Hàm kiểm tra định dạng mật khẩu
    const validatePassword = (password: string): string | null => {
        if (!password) {
            return "Mật khẩu không được để trống";
        }
        if (password.length < 8) {
            return "Mật khẩu phải có ít nhất 8 ký tự";
        }
        if (!/[a-z]/.test(password)) {
            return "Mật khẩu phải chứa ít nhất một ký tự thường";
        }
        if (!/[A-Z]/.test(password)) {
            return "Mật khẩu phải chứa ít nhất một ký tự hoa";
        }
        if (!/[0-9]/.test(password)) {
            return "Mật khẩu phải chứa ít nhất một chữ số";
        }
        if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
            return "Mật khẩu phải chứa ít nhất một ký tự đặc biệt";
        }
        return null;
    };

    // Xử lý thay đổi input, không validate ngay lập tức
    const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setEmail(e.target.value);
        // Xóa lỗi ngay khi người dùng bắt đầu gõ
        if (emailError) setEmailError(null);
    };

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPassword(e.target.value);
        // Xóa lỗi ngay khi người dùng bắt đầu gõ
        if (passwordError) setPasswordError(null);
    };

    // Logic validate chỉ xảy ra khi bấm nút
    const handleLogin = async (event: React.MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();

        // Thực hiện validation cho cả hai trường
        const emailValidationMessage = validateEmail(email);
        const passwordValidationMessage = validatePassword(password);

        // Cập nhật state lỗi
        setEmailError(emailValidationMessage);
        setPasswordError(passwordValidationMessage);

        // Dừng lại nếu có lỗi
        if (emailValidationMessage || passwordValidationMessage) {
            if (emailValidationMessage) message.error(emailValidationMessage);
            if (passwordValidationMessage) message.error(passwordValidationMessage);
            return;
        }

        // Nếu không có lỗi, tiến hành đăng nhập
        setLoginLoading(true);
        try {
            const response = await postLogin({ email: email, password: password });

            if (!response.ok) {
                const errorData = await response.json();
                setPasswordError(errorData.message || "Email hoặc mật khẩu không đúng.");
                message.error(errorData.message || "Đăng nhập thất bại.");
                return;
            }

            const data = await response.json();
            const token = data.result.token;
            setLocalStorageItem("token", token);

            const myInfo = await getCurrentAccount();
            const result = await myInfo.json();
            const userData: UserProfile = result.result;
            const isLogin = result.code === 200;

            if (isLogin) {
                setUser({
                    id: userData.id,
                    username: userData.username,
                    email: userData.email,
                    firstName: userData.firstName,
                    lastName: userData.lastName,
                    roles: userData.roles
                });
                navigate(`/`);
            }

            notification.success(
                "Đăng nhập thành công",
                `Chào mừng ${userData.firstName ?? ''} đến với Defty!`,
                { duration: 5, placement: 'topRight' }
            );

        } catch (error: any) {
            console.error("Lỗi đăng nhập:", error);
            const errorMessage = error.response?.data?.message || "Có lỗi xảy ra, vui lòng thử lại.";
            message.error(errorMessage);
        } finally {
            setLoginLoading(false);
        }
    };

    const handleForgotPassword = () => {
        alert('📧 Demo: Liên kết khôi phục mật khẩu sẽ được gửi đến email của bạn');
    };

    return (
        <div className="client-login-page">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="floating-icon floating-icon--top-left">📚</div>
                <div className="floating-icon floating-icon--top-right">🎓</div>
                <div className="floating-icon floating-icon--bottom-left">💡</div>
                <div className="floating-icon floating-icon--bottom-right">🚀</div>
                <div className="floating-icon floating-icon--mid-left">📝</div>
                <div className="floating-icon floating-icon--mid-right">🏆</div>
            </div>

            <div className="client-login-card">
                <div className="client-login-header">
                    <div className="client-logo-text">DEFTY</div>
                    <div className="client-tagline">
                        <span>📖</span>
                        <span className="client-tagline__text">Hệ thống học tập thông minh</span>
                    </div>
                    <h2 className="client-title">Đăng nhập vào hệ thống</h2>
                    <p className="client-subtitle">Khám phá kiến thức mới mỗi ngày</p>
                </div>

                <form className="client-login-form">
                    <div className="client-form-field">
                        <label className="client-form-field__label" htmlFor="email">Email</label>
                        <div className="input-icon-group">
                            <input
                                type="email"
                                id="email"
                                name="email"
                                required
                                className={`client-form-field__input ${emailError ? 'is-invalid' : ''}`}
                                placeholder="Nhập email của bạn"
                                value={email}
                                onChange={handleEmailChange}
                                disabled={loginLoading}
                            />
                            <div className="input-group-end">
                                <span className="input-icon-wrapper">
                                    <FaEnvelope />
                                </span>
                            </div>
                        </div>
                        {emailError && <div className="invalid-message">{emailError}</div>}
                    </div>

                    <div className="client-form-field">
                        <label className="client-form-field__label" htmlFor="password">Mật khẩu</label>
                        <div className="input-icon-group">
                            <input
                                type={showPassword ? "text" : "password"}
                                id="password"
                                name="password"
                                required
                                className={`client-form-field__input ${passwordError ? 'is-invalid' : ''}`}
                                placeholder="Nhập mật khẩu"
                                value={password}
                                onChange={handlePasswordChange}
                                disabled={loginLoading}
                            />
                            <div className="input-group-end">
                                <span
                                    className="input-icon-wrapper"
                                    style={{cursor: 'pointer'}}
                                    onClick={toggleShowPassword}
                                >
                                    {showPassword ? <FaEyeSlash/> : <FaEye/>}
                                </span>
                            </div>
                        </div>
                        {passwordError && <div className="invalid-message">{passwordError}</div>}
                    </div>

                    <button
                        type="submit"
                        className="client-login-button gradient-button"
                        onClick={handleLogin}
                        disabled={loginLoading}
                    >
                        {loginLoading ?
                            <Spin size="small"/> : "Bắt đầu học tập"}
                    </button>

                    <div className="client-link-group">
                        <a
                            href="#"
                            onClick={handleForgotPassword}
                            className="client-link-group__forgot-password"
                        >
                            Quên mật khẩu?
                        </a>
                    </div>
                </form>

                <div className="client-footer-text">
                    <p className="client-footer-text__slogan">
                        <span>✨</span>
                        <span>Nơi tri thức không giới hạn</span>
                        <span>✨</span>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;