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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-start sm:items-center p-0 sm:p-4">
      <div className="modal-content w-full sm:w-[95%] max-w-lg min-h-screen sm:min-h-0 sm:max-h-[90vh] overflow-y-auto rounded-none sm:rounded-xl">
        <div className="sticky top-0 bg-white dark:bg-gray-800 z-10 px-4 py-4 sm:px-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {initialData ? 'Edit User' : 'Add New User'}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              aria-label="Close"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="px-4 py-5 sm:px-6 space-y-6">
          {/* Basic Info Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Basic Information</h3>
            <div className="space-y-4">
              <div className="form-group">
                <label htmlFor="full_name" className="form-label">Full Name</label>
                <input type="text" id="full_name" name="full_name" value={formData.full_name} onChange={handleChange} required className="touch-target w-full" />
              </div>
              <div className="form-group">
                <label htmlFor="birth_date" className="form-label">Birth Date</label>
                <input type="date" id="birth_date" name="birth_date" value={formData.birth_date} onChange={handleChange} required className="touch-target w-full" />
              </div>
              <div className="form-group">
                <label htmlFor="address" className="form-label">Address</label>
                <textarea id="address" name="address" value={formData.address} onChange={handleChange} required rows={3} className="w-full" />
              </div>
              <div className="form-group">
                <label htmlFor="high_school" className="form-label">High School (Optional)</label>
                <input type="text" id="high_school" name="high_school" value={formData.high_school} onChange={handleChange} className="touch-target w-full" />
              </div>
              <div className="form-group">
                <label htmlFor="primary_email" className="form-label">Primary Email</label>
                <input type="email" id="primary_email" name="primary_email" value={formData.primary_email} onChange={handleChange} required className="touch-target w-full" />
              </div>
            </div>
          </div>

          {/* Remarks Section */}
          <div className="form-section">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Additional Notes</h3>
            <div className="space-y-4">
              {[1, 2, 3].map((num) => (
                <div key={num} className="form-group">
                  <label htmlFor={`remark${num}`} className="form-label">Remark {num}</label>
                  <textarea
                    id={`remark${num}`}
                    name={`remark${num}`}
                    value={formData[`remark${num}` as keyof typeof formData] as string}
                    onChange={handleChange}
                    rows={2}
                    className="w-full"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Secondary Emails Section */}
          <div className="form-section">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Secondary Emails</h3>
              <button
                type="button"
                onClick={addSecondaryEmail}
                className="btn btn-secondary touch-target"
              >
                Add Email
              </button>
            </div>
            <div className="space-y-4">
              {formData.secondary_emails.map((email, index) => (
                <div key={index} className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                  <div className="space-y-4">
                    <div className="flex-grow space-y-3">
                      <input
                        type="email"
                        placeholder="Secondary Email Address"
                        value={email.email}
                        onChange={(e) => handleSecondaryEmailChange(index, 'email', e.target.value)}
                        required
                        className="touch-target w-full"
                      />
                      <input
                        type="text"
                        placeholder="Description (Optional)"
                        value={email.description || ''}
                        onChange={(e) => handleSecondaryEmailChange(index, 'description', e.target.value)}
                        className="touch-target w-full"
                      />
                    </div>
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => removeSecondaryEmail(index)}
                        className="btn btn-danger touch-target"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Education History Section */}
          <div className="form-section">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Education History</h3>
              <button
                type="button"
                onClick={addEducation}
                className="btn btn-secondary touch-target"
              >
                Add Education
              </button>
            </div>
            <div className="space-y-4">
              {formData.educations.map((edu, index) => (
                <div key={index} className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                  <div className="space-y-4">
                    <div className="flex-grow space-y-3">
                      <input
                        type="text"
                        placeholder="Institution Name"
                        value={edu.institution_name}
                        onChange={(e) => handleEducationChange(index, 'institution_name', e.target.value)}
                        required
                        className="touch-target w-full"
                      />
                      <input
                        type="text"
                        placeholder="Student ID (Optional)"
                        value={edu.student_id || ''}
                        onChange={(e) => handleEducationChange(index, 'student_id', e.target.value)}
                        className="touch-target w-full"
                      />
                      <input
                        type="text"
                        placeholder="Type (e.g., University)"
                        value={edu.institution_type || ''}
                        onChange={(e) => handleEducationChange(index, 'institution_type', e.target.value)}
                        className="touch-target w-full"
                      />
                    </div>
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => removeEducation(index)}
                        className="btn btn-danger touch-target"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons - Fixed to bottom on mobile */}
          <div className="fixed bottom-0 left-0 right-0 sm:relative bg-white dark:bg-gray-800 p-4 border-t border-gray-200 dark:border-gray-700 flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="btn btn-secondary touch-target flex-1 sm:flex-none"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary touch-target flex-1 sm:flex-none"
            >
              {isSubmitting ? (
                <span className="inline-flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Submitting...</span>
                </span>
              ) : (
                initialData ? 'Save Changes' : 'Add User'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserFormModal;