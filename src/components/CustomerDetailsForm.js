'use client';
import { useState } from 'react';
import Toast from './Toast';

export default function CustomerDetailsForm({ onSubmit }) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [localToast, setLocalToast] = useState('');

  const handleSubmit = () => {
    if (!firstName.trim()) return setLocalToast('Please enter your first name');
    if (!lastName.trim()) return setLocalToast('Please enter your last name');
    if (!phone.trim() || phone.length !== 10 || isNaN(phone))
      return setLocalToast('Enter a valid 10-digit mobile number');
    
    setLocalToast('');
    onSubmit({ 
      firstName: firstName.trim(), 
      lastName: lastName.trim(), 
      phone: phone.trim(),
      email: email.trim()
    });
  };

  const inputClass =
    'w-full border border-gray-200 rounded-xl px-4 py-3 text-[13px] font-medium text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-[#059669] focus:border-[#059669] transition-all bg-white';

  const labelClass = 'block text-[11px] font-medium text-gray-600 mb-2';

  return (
    <div className="flex flex-col min-h-full">
      <div className="space-y-6">
        <p className="text-[13px] text-gray-500 leading-relaxed max-w-[90%]">
          Please enter your correct WhatsApp phone number and name for verification.
        </p>

        <div className="space-y-5">
          {/* Names Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>First Name</label>
              <input
                type="text"
                className={inputClass}
                placeholder="Enter"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </div>
            <div>
              <label className={labelClass}>Last Name</label>
              <input
                type="text"
                className={inputClass}
                placeholder="Enter"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
          </div>

          {/* Mobile */}
          <div>
            <label className={labelClass}>Mobile Number</label>
            <input
              type="tel"
              className={inputClass}
              placeholder="Enter"
              maxLength={10}
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
            />
          </div>

          {/* Email */}
          <div>
            <label className={labelClass}>Email ID (optional)</label>
            <input
              type="email"
              className={inputClass}
              placeholder="Enter"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="mt-auto pt-10">
        <button
          onClick={handleSubmit}
          className="w-full bg-[#059669] text-white font-semibold text-[15px] py-3.5 rounded-xl active:scale-95 transition-transform"
        >
          Next
        </button>
      </div>

      {localToast && (
        <Toast
          message={localToast}
          duration={2500}
        />
      )}
    </div>
  );
}
