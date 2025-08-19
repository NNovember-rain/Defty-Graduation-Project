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
    const [loginError, setLoginError] = useState<string | null>(null);

    const toggleShowPassword = () => {
        setShowPassword(prev => !prev);
    };

    // Xử lý thay đổi input
    const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setEmail(e.target.value);
        // Xóa lỗi khi người dùng bắt đầu gõ
        setLoginError(null);
    };

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPassword(e.target.value);
        // Xóa lỗi khi người dùng bắt đầu gõ
        setLoginError(null);
    };

    // Logic xử lý đăng nhập
    const handleLogin = async (event: React.MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();

        // Kiểm tra xem email và mật khẩu có trống không
        if (!email || !password) {
            const errorMessage = "Vui lòng nhập đầy đủ email và mật khẩu.";
            setLoginError(errorMessage);
            message.error(errorMessage);
            return;
        }

        setLoginLoading(true);
        debugger;
        try {
            const response = await postLogin({ email: email, password: password });

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
            const errorMessage = error.data.code === 1008 ? "Thông tin đăng nhập không chính xác" :
                "Đăng nhập thất bại. Vui lòng kiểm tra lại kết nối mạng hoặc thử lại sau.";
            setLoginError(errorMessage);
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
                                className={`client-form-field__input ${loginError ? 'is-invalid' : ''}`}
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
                    </div>

                    <div className="client-form-field">
                        <label className="client-form-field__label" htmlFor="password">Mật khẩu</label>
                        <div className="input-icon-group">
                            <input
                                type={showPassword ? "text" : "password"}
                                id="password"
                                name="password"
                                required
                                className={`client-form-field__input ${loginError ? 'is-invalid' : ''}`}
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
                    </div>
                    {loginError && <div className="invalid-message">{loginError}</div>}


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