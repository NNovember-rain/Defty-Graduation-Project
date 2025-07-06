// Header.tsx
import { forwardRef } from 'react'; // Import forwardRef
import { useTranslation } from 'react-i18next';
import { Tooltip, Dropdown } from 'antd';
import { FaBars } from 'react-icons/fa';
import { FaRegComments } from "react-icons/fa6";
import { PiSignOut } from "react-icons/pi";
import { BsBell } from "react-icons/bs";
import { IoLanguageOutline } from "react-icons/io5";

interface HeaderProps {
    onToggleSidebar: () => void;
}

const Header = forwardRef<HTMLDivElement, HeaderProps>(({ onToggleSidebar }, ref) => { // Accept ref
    const { i18n, t } = useTranslation(); // Destructure t from useTranslation()

    const changeLanguage = async (lng: 'en' | 'vi') => {
        await i18n.changeLanguage(lng);
        localStorage.setItem('language', lng);
    };

    const handleLogout = () => {
        console.log(t('header.userLoggedOut')); // Translated
        alert(t('header.logoutSuccess')); // Translated
    };

    // Get the current language from i18n
    const currentLanguage = i18n.language;

    const languageMenuItems = [
        {
            key: 'vi',
            label: (
                <>
                    <span role="img" aria-label={t('header.vietnameseFlagAlt')}>🇻🇳</span> {t('header.vietnamese')}
                </>
            ),
            // Conditionally apply 'active-language-item' class
            className: currentLanguage === 'vi' ? 'active-language-item' : '',
        },
        {
            key: 'en',
            label: (
                <>
                    <span role="img" aria-label={t('header.englishFlagAlt')}>🇺🇸</span> {t('header.english')}
                </>
            ),
            // Conditionally apply 'active-language-item' class
            className: currentLanguage === 'en' ? 'active-language-item' : '',
        },
    ];

    const languageMenuProps = {
        items: languageMenuItems,
        selectedKeys: [currentLanguage],
        onClick: ({ key }: { key: string }) => changeLanguage(key as 'en' | 'vi'),
    };

    return (
        <div className="header" ref={ref}> {/* Attach the ref here */}
            <div className="header__left">
                <button
                    className="header__icon-button"
                    onClick={(e) => {
                        e.stopPropagation(); // GIỮ NGUYÊN dòng này
                        onToggleSidebar();
                    }}
                >
                    <FaBars />
                </button>
                <p className="header__nav-item">{t('header.home')}</p>
                <div className="header__nav-item">{t('header.contact')}</div>
            </div>
            <div className="header__center">
                {/* You can add title or breadcrumbs here if needed */}
            </div>
            <div className="header__right">
                <Dropdown className='language-dropdown' menu={languageMenuProps} placement="bottom" trigger={['hover']}>
                    <button className="header__icon-button">
                        <IoLanguageOutline />
                    </button>
                </Dropdown>

                <Tooltip title={t('header.messagesTooltip')} placement="bottom">
                    <button className="header__icon-button">
                        <FaRegComments />
                        <span className="header__badge">3</span>
                    </button>
                </Tooltip>

                <Tooltip title={t('header.notificationsTooltip')} placement="bottom">
                    <button className="header__icon-button">
                        <BsBell />
                        <span className="header__badge">7</span>
                    </button>
                </Tooltip>

                <Tooltip title={t('header.logoutTooltip')} placement="bottom">
                    <button className="header__icon-button" onClick={handleLogout}>
                        <PiSignOut />
                    </button>
                </Tooltip>
            </div>
        </div>
    );
});

export default Header;