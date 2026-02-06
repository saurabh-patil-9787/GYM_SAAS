import React from 'react';

const Input = ({ label, type = "text", value, onChange, placeholder, required = false, className = "" }) => {
    return (
        <div className={`mb-4 w-full ${className}`}>
            {label && <label className="block text-gray-400 text-sm font-bold mb-2">{label}</label>}
            <input
                type={type}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                required={required}
                className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
            />
        </div>
    );
};

export default Input;
