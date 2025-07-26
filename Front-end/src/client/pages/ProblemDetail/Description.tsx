import React from "react";
import { MdOutlineDescription } from "react-icons/md";
import { useTranslation } from "react-i18next";

const Description: React.FC = () => {
    const { t } = useTranslation();
    return (
        <div className="description">
            <div className="description__header">
                <h2 className="description__header-title">
                    <MdOutlineDescription color={'#0277f6'} />
                    {t('problemDetail.description.title')}
                </h2>
            </div>

            <div className="description__content">
                <h1 className="description__title">{t('problemDetail.description.viewerTitle')}</h1>

                <p>
                    {t('problemDetail.description.introParagraph1')}
                </p>

                <p>
                    {t('problemDetail.description.introParagraph2_part1')}
                    <code>{t('problemDetail.description.runButton')}</code>
                    {t('problemDetail.description.introParagraph2_part2')}
                </p>

                <div className="description__example">
                    <h3>{t('problemDetail.description.exampleTitle')}</h3>
                    <div className="description__example-box">
                        <div><strong>Input:</strong></div>
                        <div>@startuml</div>
                        <div>Alice -{">"} Bob : Authentication Request</div>
                        <div>Bob --{">"} Alice : Authentication Response</div>
                        <div>Alice -{">"} Bob : Another request</div>
                        <div>@enduml</div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Description;