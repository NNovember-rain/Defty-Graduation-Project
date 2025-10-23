import React from "react";
import { MdOutlineDescription } from "react-icons/md";
import { useTranslation } from "react-i18next";
import DOMPurify from "dompurify";
import type { IAssignment } from "../../../shared/services/assignmentService";

type Props = {
    assignment: IAssignment | null;
    isLoading?: boolean;
    error?: string | null;
};

const Description: React.FC<Props> = ({ assignment, isLoading, error }) => {
    const { t } = useTranslation();

    const safeHtml = React.useMemo(() => {
        const html = assignment?.commonDescription ?? "";
        return DOMPurify.sanitize(html);
    }, [assignment?.commonDescription]);

    return (
        <div className="description">
            <div className="description__header">
                <h2 className="description__header-title">
                    <MdOutlineDescription color="#0277f6" />
                    {t("problemDetail.description.title")}
                </h2>
            </div>

            {isLoading && (
                <div className="description__state">
                    {t("common.loading") || "Loading..."}
                </div>
            )}
            {error && !isLoading && (
                <div className="description__state description__state--error">
                    {error}
                </div>
            )}

            {assignment && (
                <div className="description__content">
                    {assignment.title && (
                        <h2>{assignment.title}</h2>
                    )}

                    {assignment.commonDescription && (
                        <div className="description__assignment-text">
                            <div
                                className="description__assignment-html"
                                dangerouslySetInnerHTML={{ __html: safeHtml }}
                            />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default Description;