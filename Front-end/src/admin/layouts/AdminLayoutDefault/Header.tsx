import React from 'react';
import { FaBars, FaExpandArrowsAlt, FaTh, FaBell, FaComments, FaSearch } from 'react-icons/fa';

const Header: React.FC = () => {
    return (
        <div className='header'>
            <div className="header__left">
                <button className="header__icon-button">
                    <FaBars />
                </button>
                <div className="header__nav-item">Home</div>
                <div className="header__nav-item">Contact</div>
            </div>
            <div className="header__center">
                {/* You can add a title or breadcrumbs here if needed */}
            </div>
            <div className="header__right">
                <button className="header__icon-button">
                    <FaSearch />
                </button>
                <button className="header__icon-button">
                    <FaComments />
                    <span className="header__badge">3</span>
                </button>
                <button className="header__icon-button">
                    <FaBell />
                    <span className="header__badge">7</span>
                </button>
                <button className="header__icon-button">
                    <FaExpandArrowsAlt />
                </button>
                <button className="header__icon-button">
                    <FaTh />
                </button>
            </div>
        </div>
    );
};

export default Header;