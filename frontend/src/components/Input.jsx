import React from 'react';

const Input = ({ label, name, type = "text", value, onChange, placeholder, required = false, className = "", error, ...props }) => {
    return (
        <div className={`mb-4 w-full ${className}`}>
            {label && <label className="block text-sm font-medium text-slate-600 mb-1.5">{label}</label>}
            <input
                type={type}
                name={name}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                required={required}
                className={`w-full px-4 py-3 rounded-xl bg-white border text-slate-800 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all duration-200 ${
                    error 
                    ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/20' 
                    : 'border-slate-300 focus:border-indigo-500 focus:ring-indigo-500/20'
                }`}
                {...props}
            />
            {error && <p className="text-rose-500 text-xs mt-1 font-medium">{error}</p>}
        </div>
    );
};

export default Input;
