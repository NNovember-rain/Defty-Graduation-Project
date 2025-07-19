import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Dropdown, Menu, type MenuProps } from 'antd';
import { FaUserCircle } from "react-icons/fa";
import { RiArrowDropDownLine } from "react-icons/ri";
import { IoIosNotificationsOutline } from "react-icons/io";
import { useTranslation } from 'react-i18next';
import {IoLanguageOutline} from "react-icons/io5";
import i18n from "i18next";

interface NavLinkItem {
    type: 'link';
    labelKey: string;
    linkTo: string;
}

interface NavDropdownItem {
    type: 'dropdown';
    labelKey: string;
    items: { key: string; labelKey: string; linkTo: string }[];
}

type NavItem = NavLinkItem | NavDropdownItem;

const NAV_ITEMS: NavItem[] = [
    { type: 'link', labelKey: 'header.home', linkTo: '/home' },
    { type: 'link', labelKey: 'header.assignments', linkTo: '/problems' },
    { type: 'link', labelKey: 'header.test', linkTo: '/test' },
    { type: 'link', labelKey: 'header.quiz', linkTo: '/quiz' },
    {
        type: 'dropdown',
        labelKey: 'header.class',
        items: [
            // Các khóa này chưa có trong file JSON của bạn, bạn cần thêm chúng.
            { key: '1', labelKey: 'classes.ise', linkTo: '/class/ise' },
            { key: '2', labelKey: 'classes.isad', linkTo: '/class/isad' },
            { key: '3', labelKey: 'classes.sad', linkTo: '/class/sad' },
        ],
    },
];

const Header: React.FC = () => {
    const location = useLocation();
    const { t } = useTranslation();

    const renderDropdownMenu = (items: NavDropdownItem['items']) => {
        const menuItems: MenuProps['items'] = items.map(item => ({
            key: item.key,
            label: <Link to={item.linkTo}>{t(item.labelKey)}</Link>,
        }));

        return <Menu items={menuItems} className="header-dropdown-menu" />;
    };

    const currentLanguage = i18n.language;

    const languageMenuItems = [
        {
            key: 'vi',
            label: (
                <>
                    <span role="img" aria-label={t('header.vietnameseFlagAlt')}>🇻🇳</span> {t('header.vietnamese')}
                </>
            ),
            className: currentLanguage === 'vi' ? 'active-language-item' : '',
        },
        {
            key: 'en',
            label: (
                <>
                    <span role="img" aria-label={t('header.englishFlagAlt')}>🇺🇸</span> {t('header.english')}
                </>
            ),
            className: currentLanguage === 'en' ? 'active-language-item' : '',
        },
    ];

    const changeLanguage = async (lng: 'en' | 'vi') => {
        await i18n.changeLanguage(lng);
        localStorage.setItem('language', lng);
    };

    const languageMenuProps: MenuProps = {
        items: languageMenuItems,
        selectedKeys: [currentLanguage],
        onClick: ({ key }: { key: string }) => changeLanguage(key as 'en' | 'vi'),
        className: 'client__language-menu', // Thêm class riêng cho menu ngôn ngữ
    };

    return (
        <header className="header">
            <div className="header-left">
                <div className="header-logo">
                    <img className="header-logo__image" src="/assets/images/defty.jpg" alt="logo"/>
                </div>
                <nav className="header-nav">
                    {NAV_ITEMS.map((item) => {
                        const isActive = item.type === 'link'
                            ? location.pathname.startsWith(item.linkTo)
                            : item.items.some(subItem => location.pathname.startsWith(subItem.linkTo));

                        if (item.type === 'link') {
                            return (
                                <Link
                                    key={item.labelKey}
                                    to={item.linkTo}
                                    className={`nav-item ${isActive ? 'active' : ''}`}
                                >
                                    {t(item.labelKey)}
                                </Link>
                            );
                        }

                        if (item.type === 'dropdown') {
                            return (
                                <Dropdown
                                    key={item.labelKey}
                                    overlay={renderDropdownMenu(item.items)}
                                    trigger={['hover']}
                                    placement="bottomCenter"
                                >
                                    <div className={`nav-item with-dropdown ${isActive ? 'active' : ''}`}>
                                        {t(item.labelKey)}
                                        <RiArrowDropDownLine />
                                    </div>
                                </Dropdown>
                            );
                        }
                        return null;
                    })}
                </nav>
            </div>
            <div className="header-right">
                <div className="header-icons">
                    <Dropdown className='client__language-dropdown' menu={languageMenuProps} placement="bottom" trigger={['hover']}>
                        <button className="client__language-dropdown--icon-button">
                            <IoLanguageOutline />
                        </button>
                    </Dropdown>

                    <div className="icon-wrapper">
                        <IoIosNotificationsOutline size={25} />
                        <span className="notification-badge">9</span>
                    </div>
                    <div className="icon-wrapper">
                        <FaUserCircle size={25} />
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;