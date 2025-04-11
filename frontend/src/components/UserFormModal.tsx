'use client';

import React, { useState, useEffect } from 'react';
import { User, Education, SecondaryEmail } from '@/types'; // Assuming base types are defined

// Define the shape of the data the form will handle (excluding IDs for creation)
export interface UserFormData { // Add export keyword
    full_name: string;
    birth_date: string; // Use string for date input
    address: string;
    high_school?: string;
    primary_email: string;
    secondary_emails: Omit<SecondaryEmail, 'id' | 'user_id'>[]; // Emails to be created
    educations: Omit<Education, 'id' | 'user_id'>[]; // Educations to be created
    remark1?: string; // Added remarks
    remark2?: string;
    remark3?: string;
}

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: UserFormData) => Promise<void>; // Function to handle form submission (API call)
  initialData?: User | null; // For editing existing user (optional)
  isSubmitting: boolean; // To disable button during submission
}

const UserFormModal: React.FC<UserFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isSubmitting,
}) => {
  const [formData, setFormData] = useState<UserFormData>({
    full_name: '',
    birth_date: '',
    address: '',
    high_school: '',
    primary_email: '',
    secondary_emails: [],
    educations: [],
    remark1: '',
    remark2: '',
    remark3: '',
  });

  // Populate form if initialData (for editing) is provided
  useEffect(() => {
    if (initialData) {
      setFormData({
        full_name: initialData.full_name,
        birth_date: initialData.birth_date, // Assuming date is already in 'YYYY-MM-DD' string format from API or needs conversion
        address: initialData.address,
        high_school: initialData.high_school || '',
        primary_email: initialData.primary_email,
        // For editing, secondary emails and educations might need separate handling
        // or pre-population if the form supports modifying them directly.
        // For simplicity in this example, we'll clear them for 'edit' mode,
        // assuming edits happen on details page or via separate actions.
        // Pre-fill secondary emails and educations for editing
        // Map them to the format needed by the form (without id/user_id)
        secondary_emails: initialData.secondary_emails.map(({ email, description }) => ({ email, description: description || '' })),
        educations: initialData.educations.map(({ institution_name, student_id, institution_type }) => ({ institution_name, student_id: student_id || '', institution_type: institution_type || '' })),
        remark1: initialData.remark1 || '', // Populate remarks
        remark2: initialData.remark2 || '',
        remark3: initialData.remark3 || '',
      });
    } else {
      // Reset form for 'add' mode
       setFormData({
        full_name: '', birth_date: '', address: '', high_school: '',
        primary_email: '', secondary_emails: [], educations: [],
        remark1: '', remark2: '', remark3: '', // Reset remarks
      });
    }
  }, [initialData, isOpen]); // Re-run effect if initialData or isOpen changes

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Basic handlers for adding/removing secondary emails and educations (can be expanded)
  const addSecondaryEmail = () => {
     setFormData(prev => ({
         ...prev,
         secondary_emails: [...prev.secondary_emails, { email: '', description: '' }]
     }));
  };
   const addEducation = () => {
     setFormData(prev => ({
         ...prev,
         educations: [...prev.educations, { institution_name: '', student_id: '', institution_type: '' }]
     }));
  };
  const handleSecondaryEmailChange = (index: number, field: keyof Omit<SecondaryEmail, 'id' | 'user_id'>, value: string) => {
    setFormData(prev => {
        const updatedEmails = [...prev.secondary_emails];
        updatedEmails[index] = { ...updatedEmails[index], [field]: value };
        return { ...prev, secondary_emails: updatedEmails };
    });
  };

  const removeSecondaryEmail = (index: number) => {
     setFormData(prev => ({
         ...prev,
         secondary_emails: prev.secondary_emails.filter((_, i) => i !== index)
     }));
  };

  const handleEducationChange = (index: number, field: keyof Omit<Education, 'id' | 'user_id'>, value: string) => {
    setFormData(prev => {
        const updatedEducations = [...prev.educations];
        updatedEducations[index] = { ...updatedEducations[index], [field]: value };
        return { ...prev, educations: updatedEducations };
    });
  };

   const removeEducation = (index: number) => {
     setFormData(prev => ({
         ...prev,
         educations: prev.educations.filter((_, i) => i !== index)
     }));
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
     // Optionally reset form here if modal stays open, or rely on useEffect when isOpen changes
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
          {initialData ? 'Edit User' : 'Add New User'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Basic Info */}
          <div>
            <label htmlFor="full_name" className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Full Name</label>
            <input type="text" id="full_name" name="full_name" value={formData.full_name} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
          </div>
          <div>
            <label htmlFor="birth_date" className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Birth Date</label>
            <input type="date" id="birth_date" name="birth_date" value={formData.birth_date} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
          </div>
           <div>
            <label htmlFor="address" className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Address</label>
            <textarea id="address" name="address" value={formData.address} onChange={handleChange} required rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
          </div>
           <div>
            <label htmlFor="high_school" className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">High School (Optional)</label>
            <input type="text" id="high_school" name="high_school" value={formData.high_school} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
          </div>
          <div>
            <label htmlFor="primary_email" className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Primary Email</label>
            <input type="email" id="primary_email" name="primary_email" value={formData.primary_email} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
          </div>
          {/* Remarks */}
          <div>
            <label htmlFor="remark1" className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Remark 1</label>
            <textarea id="remark1" name="remark1" value={formData.remark1} onChange={handleChange} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
          </div>
           <div>
            <label htmlFor="remark2" className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Remark 2</label>
            <textarea id="remark2" name="remark2" value={formData.remark2} onChange={handleChange} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
          </div>
           <div>
            <label htmlFor="remark3" className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Remark 3</label>
            <textarea id="remark3" name="remark3" value={formData.remark3} onChange={handleChange} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
          </div>

          {/* TODO: Add sections for Secondary Emails and Educations with add/remove buttons and inputs */}
          {/* Example placeholder */}
           <div className="border-t pt-4 mt-4">
             <h3 className="text-lg font-medium mb-2 dark:text-white">Secondary Emails</h3>
             {formData.secondary_emails.map((email, index) => (
                 <div key={index} className="flex items-center gap-2 mb-2 border p-2 rounded">
                     <div className="flex-grow space-y-1">
                         <input
                             type="email"
                             placeholder="Secondary Email Address"
                             value={email.email}
                             onChange={(e) => handleSecondaryEmailChange(index, 'email', e.target.value)}
                             required // Make secondary email address required if added
                             className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                         />
                         <input
                             type="text"
                             placeholder="Description (Optional)"
                             value={email.description || ''}
                             onChange={(e) => handleSecondaryEmailChange(index, 'description', e.target.value)}
                             className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                         />
                     </div>
                     <button
                         type="button"
                         onClick={() => removeSecondaryEmail(index)}
                         className="text-red-500 hover:text-red-700 text-sm font-medium p-1"
                         aria-label="Remove secondary email"
                     >
                         Remove
                     </button>
                 </div>
             ))}
             <button type="button" onClick={addSecondaryEmail} className="text-sm text-blue-600 hover:underline">Add Secondary Email</button>
           </div>
           <div className="border-t pt-4 mt-4">
             <h3 className="text-lg font-medium mb-2 dark:text-white">Education History</h3>
             {formData.educations.map((edu, index) => (
                 <div key={index} className="flex items-center gap-2 mb-2 border p-2 rounded">
                     <div className="flex-grow space-y-1">
                         <input
                             type="text"
                             placeholder="Institution Name"
                             value={edu.institution_name}
                             onChange={(e) => handleEducationChange(index, 'institution_name', e.target.value)}
                             required // Institution name is required
                             className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                         />
                         <input
                             type="text"
                             placeholder="Student ID (Optional)"
                             value={edu.student_id || ''}
                             onChange={(e) => handleEducationChange(index, 'student_id', e.target.value)}
                             className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                         />
                          <input
                             type="text"
                             placeholder="Type (e.g., University, HighSchool)"
                             value={edu.institution_type || ''}
                             onChange={(e) => handleEducationChange(index, 'institution_type', e.target.value)}
                             className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                         />
                     </div>
                     <button
                         type="button"
                         onClick={() => removeEducation(index)}
                         className="text-red-500 hover:text-red-700 text-sm font-medium p-1"
                         aria-label="Remove education entry"
                     >
                         Remove
                     </button>
                 </div>
             ))}
             <button type="button" onClick={addEducation} className="text-sm text-blue-600 hover:underline">Add Education</button>
           </div>


          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t mt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Submitting...' : (initialData ? 'Save Changes' : 'Add User')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserFormModal;