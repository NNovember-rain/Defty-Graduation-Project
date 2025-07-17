import React from 'react';
import {Link} from "react-router-dom";

interface BreadcrumbItem {
    label: string;
    path?: string; // Optional path if it's a link
}

interface BreadcrumbProps {
    items: BreadcrumbItem[];
}

const Breadcrumb: React.FC<BreadcrumbProps> = ({ items }) => {
    return (
        <nav aria-label="breadcrumb">
            <ol className="breadcrumb">
                {items.map((item, index) => (
                    <li key={index} className="breadcrumb__item">
                        {item.path ? (
                            <Link to={item.path} className="breadcrumb__item--link">
                                {item.label}
                            </Link>
                        ) : (
                            <span>{item.label}</span>
                        )}
                    </li>
                ))}
            </ol>
        </nav>
    );
};

export default Breadcrumb;