import React, { useState } from "react";
import "./Login.scss";
import { FaEnvelope, FaLock } from "react-icons/fa";
import { postLogin } from "../../../shared/services/authService.ts";
import { Spin, message } from 'antd';
import 'antd/dist/reset.css';
import { useTranslation } from 'react-i18next'; // Import useTranslation

const Login: React.FC = () => {
    const { t } = useTranslation(); // Khởi tạo hook useTranslation

    const [email, setEmail] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(false);
    const [emailError, setEmailError] = useState<string | null>(null);
    const [passwordError, setPasswordError] = useState<string | null>(null);

    // Basic email validation function
    const validateEmail = (email: string): string | null => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email) {
            return t("login.emailRequired"); // Sử dụng t()
        } else if (!emailRegex.test(email)) {
            return t("login.invalidEmailFormat"); // Sử dụng t()
        }
        return null;
    };

    // Password validation function
    const validatePassword = (password: string): string | null => {
        if (!password) {
            return t("login.passwordRequired"); // Sử dụng t()
        }
        if (password.length < 8) {
            return t("login.passwordMinLength"); // Sử dụng t()
        }
        if (!/[a-z]/.test(password)) {
            return t("login.passwordLowercase"); // Sử dụng t()
        }
        if (!/[A-Z]/.test(password)) {
            return t("login.passwordUppercase"); // Sử dụng t()
        }
        if (!/[0-9]/.test(password)) {
            return t("login.passwordNumber"); // Sử dụng t()
        }
        if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
            return t("login.passwordSpecialChar"); // Sử dụng t()
        }
        return null;
    };

    // Handle email input change
    const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newEmail = e.target.value;
        setEmail(newEmail);
        if (emailError) {
            setEmailError(null);
        }
    };

    // Handle email input blur
    const handleEmailBlur = () => {
        const error = validateEmail(email);
        setEmailError(error);
    };

    // Handle password input change
    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newPassword = e.target.value;
        setPassword(newPassword);
        if (passwordError) {
            setPasswordError(null);
        }
    };

    // Handle password input blur
    const handlePasswordBlur = () => {
        const error = validatePassword(password);
        setPasswordError(error);
    };

    const handleLogin = async (event: React.MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();

        const emailValidationMessage = validateEmail(email);
        if (emailValidationMessage) {
            setEmailError(emailValidationMessage);
            message.error(emailValidationMessage);
            return;
        }

        const passwordValidationMessage = validatePassword(password);
        if (passwordValidationMessage) {
            setPasswordError(passwordValidationMessage);
            message.error(passwordValidationMessage);
            return;
        }

        setLoading(true);
        try {
            const response = await postLogin({ email: email, password: password });
            //TODO: SOLVE LOGIN, ZUSTAND STATE

            console.log("Login successful:", response);
            message.success(t("login.loginSuccessful"));
        } catch (error: any) {
            console.error("Login failed:", error);
            const errorMessage = error.response?.data?.message || t("login.loginFailed");
            message.error(errorMessage);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="login-page">
            <div className="login-box">
                <div className="login-logo">
                    <p>{t("login.adminLTE")}</p> {t("login.defty")}
                </div>
                <div className="card">
                    <div className="card-body login-card-body">
                        <p className="login-box-msg">{t("login.signInMessage")}</p>

                        <form>
                            <div className="input-group mb-3">
                                <input
                                    type="email"
                                    className={`form-control ${emailError ? 'is-invalid' : ''}`}
                                    placeholder={t("login.emailPlaceholder")}
                                    value={email}
                                    onChange={handleEmailChange}
                                    onBlur={handleEmailBlur}
                                    disabled={loading}
                                />
                                <div className="input-group-append">
                                    <div className="input-group-text">
                                        <FaEnvelope />
                                    </div>
                                </div>
                                {emailError && <div className="invalid-feedback">{emailError}</div>}
                            </div>
                            <div className="input-group mb-3">
                                <input
                                    type="password"
                                    className={`form-control ${passwordError ? 'is-invalid' : ''}`}
                                    placeholder={t("login.passwordPlaceholder")}
                                    value={password}
                                    onChange={handlePasswordChange}
                                    onBlur={handlePasswordBlur}
                                    disabled={loading}
                                />
                                <div className="input-group-append">
                                    <div className="input-group-text">
                                        <FaLock />
                                    </div>
                                </div>
                                {passwordError && <div className="invalid-feedback">{passwordError}</div>}
                            </div>
                            <div className="row">
                                <div className="col-12">
                                    <button
                                        onClick={handleLogin}
                                        className="btn btn-primary btn-block"
                                        disabled={loading}
                                    >
                                        {loading ? <Spin size="small" /> : t("login.signInButton")} {/* Sử dụng t() */}
                                    </button>
                                </div>
                            </div>
                        </form>
                        <p className="mb-1">
                            <a href="#">{t("login.forgotPassword")}</a> {/* Sử dụng t() */}
                        </p>
                    </div>
                </div>
            </div>
            {/* /.login-box */}
        </div>
    );
}

export default Login;