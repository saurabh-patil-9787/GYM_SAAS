import React from 'react';

const Input = ({ label, name, type = "text", value, onChange, placeholder, required = false, className = "", error, ...props }) => {
    return (
        <div className={`mb-4 w-full ${className}`}>
            {label && <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">{label}</label>}
            <input
                type={type}
                name={name}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                required={required}
                className={`w-full px-4 py-3 rounded-xl bg-white/[0.05] border text-white text-sm placeholder:text-gray-600 focus:outline-none focus:bg-white/[0.07] focus:ring-1 transition-all duration-200 ${
                    error 
                    ? 'border-red-500/50 focus:border-red-500/70 focus:ring-red-500/20' 
                    : 'border-white/[0.09] focus:border-purple-500/60 focus:ring-purple-500/30'
                }`}
                {...props}
            />
            {error && <p className="text-red-500 text-xs mt-1 font-medium">{error}</p>}
        </div>
    );
};

export default Input;
