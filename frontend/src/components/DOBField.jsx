import React, { forwardRef } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import '../styles/datepicker-custom.css'; // For additional custom styling if needed

const DOBField = ({ value, onChange, error, required = false, ...props }) => {
    const currentYear = new Date().getFullYear();
    const minYear = currentYear - 100;
    const maxDate = new Date(); // Max date is today
    const minDate = new Date(minYear, 0, 1); // Exact 100 years prior

    // `value` is expected to be "YYYY-MM-DD", similar to native `<input type="date" />` output,
    // so it doesn't break parent components passing native date string format.
    const selectedDate = value ? new Date(value) : null;

    const handleChange = (date) => {
        if (date) {
             // Handle local timezone without shifting the date backward
             const offset = date.getTimezoneOffset();
             const adjustedDate = new Date(date.getTime() - (offset * 60 * 1000));
             onChange(adjustedDate.toISOString().split('T')[0]);
        } else {
            onChange('');
        }
    };

    return (
        <div className="mb-4 w-full">
            <label className="block text-gray-400 text-sm font-bold mb-2">
                DOB {required && <span className="text-red-500">*</span>}
            </label>
            <div className="relative">
                <DatePicker
                    selected={selectedDate}
                    onChange={handleChange}
                    dateFormat="dd/MM/yyyy"
                    placeholderText="DD/MM/YYYY"
                    maxDate={maxDate}
                    minDate={minDate}
                    showYearDropdown
                    showMonthDropdown
                    dropdownMode="select"
                    yearDropdownItemNumber={100}
                    scrollableYearDropdown
                    required={required}
                    className={`w-full px-4 py-3 rounded-lg bg-gray-800 border ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-700 focus:border-purple-500 focus:ring-purple-500'} text-white focus:outline-none focus:ring-1 transition-colors`}
                    wrapperClassName="w-full"
                    popperClassName="!z-[100]"
                    {...props}
                />
            </div>
            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
        </div>
    );
};

export default DOBField;
