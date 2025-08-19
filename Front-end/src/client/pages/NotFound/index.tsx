import React from "react";
import { useNavigate, Link } from "react-router-dom";
import { MdHome, MdArrowBack } from "react-icons/md";
import { useTranslation } from "react-i18next";
import "./NotFound.scss";

const NotFound: React.FC = () => {
    const navigate = useNavigate();
    const { t } = useTranslation();

    return (
        <div className="notfound" role="main" aria-labelledby="notfound-title">
            <div className="notfound__card">
                <div className="notfound__code">404</div>
                <h1 id="notfound-title" className="notfound__title">
                    {t("notfound.title")}
                </h1>
                <p className="notfound__desc">
                    {t("notfound.description")}
                </p>

                <div className="notfound__actions">
                    <button
                        className="notfound__btn notfound__btn--secondary"
                        onClick={() => navigate(-2)}
                    >
                        <MdArrowBack /> {t("notfound.back")}
                    </button>

                    <Link to="/" className="notfound__btn notfound__btn--primary">
                        <MdHome /> {t("notfound.home")}
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default NotFound;