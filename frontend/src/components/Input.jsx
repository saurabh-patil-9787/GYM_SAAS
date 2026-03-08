import React from 'react';

const Input = ({ label, name, type = "text", value, onChange, placeholder, required = false, className = "", error, ...props }) => {
    return (
        <div className={`mb-4 w-full ${className}`}>
            {label && <label className="block text-gray-400 text-sm font-bold mb-2">{label}</label>}
            <input
                type={type}
                name={name}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                required={required}
                className={`w-full px-4 py-3 rounded-lg bg-gray-800 border ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-700 focus:border-purple-500 focus:ring-purple-500'} text-white focus:outline-none focus:ring-1 transition-colors`}
                {...props}
            />
            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
        </div>
    );
};

export default Input;
