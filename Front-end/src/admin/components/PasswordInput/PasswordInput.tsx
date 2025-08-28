import {useState} from "react";
import {AiOutlineEye, AiOutlineEyeInvisible} from "react-icons/ai";

const PasswordInput: React.FC<{
    value: string;
    onChange: (val: string) => void;
    placeholder?: string;
    disabled?: boolean;
}> = ({ value, onChange, placeholder, disabled }) => {
    const [showPassword, setShowPassword] = useState(false);

    return (
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <input
                type={showPassword ? 'text' : 'password'}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                disabled={disabled}
                style={{
                    width: '100%',
                    padding: '8px 36px 8px 12px',
                    borderRadius: 4,
                    border: '1px solid #ccc',
                    fontSize: 14,
                }}
            />
            <span
                onClick={() => setShowPassword(!showPassword)}
                style={{
                    position: 'absolute',
                    right: 10,
                    cursor: 'pointer',
                    fontSize: 18,
                    color: '#555',
                    userSelect: 'none',
                }}
            >
                {showPassword ? <AiOutlineEyeInvisible /> : <AiOutlineEye />}
            </span>
        </div>
    );
};

export default PasswordInput;