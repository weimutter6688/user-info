'use client'; // Make this a Client Component

import React, { useState, useEffect } from 'react'; // Import useEffect
import UserTable from '@/components/UserTable';
import UserFormModal, { UserFormData } from '@/components/UserFormModal'; // Import the modal component and its form data type
import { User } from '@/types'; // Import the User type

// Removed sampleUsers


export default function Home() {
  const [users, setUsers] = useState<User[]>([]); // Initialize with empty array
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [editingUser, setEditingUser] = useState<User | null>(null); // State to hold the user being edited
  // API_BASE_URL is no longer needed here, calls will use relative paths to Next.js API routes
  const [selectedFile, setSelectedFile] = useState<File | null>(null); // State for the selected import file
  const [isImporting, setIsImporting] = useState<boolean>(false); // State for import loading indicator

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      // Call the Next.js API route proxy
      const response = await fetch(`/api/users/`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: User[] = await response.json();
      setUsers(data);
    } catch (e: unknown) { // Use unknown instead of any
      console.error("Failed to fetch users:", e);
      // Type check for error message
      const errorMessage = e instanceof Error ? e.message : String(e);
      setError(`Failed to load users: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  // Fetch users when the component mounts
  useEffect(() => {
    fetchUsers();
  }, []); // Empty dependency array means this runs once on mount

  const handleEdit = (user: User) => {
    console.log("Editing user:", user);
    setEditingUser(user); // Set the user to be edited
    setIsModalOpen(true); // Open the modal
  };

  const handleDelete = (userId: number) => {
    console.log("Delete user ID:", userId);
    if (confirm(`Are you sure you want to delete user ID ${userId}?`)) {
      const deleteUser = async () => {
        try {
          // Call the Next.js API route proxy
          const response = await fetch(`/api/users/${userId}`, {
            method: 'DELETE',
          });
          if (!response.ok) {
            // Try to get error detail from response body
            let errorDetail = `HTTP error! status: ${response.status}`;
            try {
              const errorData = await response.json();
              errorDetail = errorData.detail || errorDetail;
            } catch (jsonError: unknown) { // Type the catch variable
              // Ignore if response is not JSON, log for debugging
              console.warn("Could not parse error response as JSON:", jsonError);
            }
            throw new Error(errorDetail);
          }
          alert(`User ID ${userId} deleted successfully.`);
          // Refresh the user list after deletion
          fetchUsers();
        } catch (e: unknown) { // Use unknown instead of any
          console.error("Failed to delete user:", e);
          const errorMessage = e instanceof Error ? e.message : String(e);
          alert(`Failed to delete user: ${errorMessage}`);
        }
      };
      deleteUser();
    }
  };

  // --- Modal and Form Handling ---
  const handleAddUserClick = () => {
    setEditingUser(null); // Ensure we are in 'add' mode by clearing any editing user
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingUser(null); // Clear editing state when closing
  };

  const handleFormSubmit = async (formData: UserFormData) => { // Use the imported UserFormData type
    setIsSubmitting(true);
    setError(null); // Clear previous errors
    try {
        let response;
        let successMessage: string;

        if (editingUser) {
            // --- EDIT User ---
            console.log("Submitting update for user ID:", editingUser.id);
            // Note: The current UserFormModal clears secondary emails/educations on edit.
            // If you want to update those, the backend PUT endpoint and frontend form need adjustments.
            // This implementation primarily updates the core User fields.
            // Call the Next.js API route proxy for PUT
            response = await fetch(`/api/users/${editingUser.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                // Send the entire formData, including secondary_emails and educations
                // The backend update_user function now handles replacing these.
                body: JSON.stringify(formData),
            });
            successMessage = 'User updated successfully!';

        } else {
            // --- ADD User ---
            console.log("Submitting new user data:", formData);
            // Call the Next.js API route proxy for POST
            response = await fetch(`/api/users/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData), // Send full form data including emails/educations
            });
             successMessage = 'User added successfully!';
        }

        if (!response.ok) {
            let errorDetail = `HTTP error! status: ${response.status}`;
            try {
              const errorData = await response.json();
              errorDetail = errorData.detail || errorDetail;
            } catch (jsonError: unknown) { /* Ignore, maybe log */
                 console.warn("Could not parse error response as JSON:", jsonError);
            }
            throw new Error(errorDetail);
        }

        alert(successMessage);
        handleModalClose(); // Close modal on success
        fetchUsers(); // Refresh user list

    } catch (e: unknown) { // Use unknown instead of any
        console.error("Failed to submit user form:", e);
        const errorMessage = e instanceof Error ? e.message : String(e);
        setError(`Submission failed: ${errorMessage}`); // Show error to user
        // Keep modal open on error so user can see the message or retry
    } finally {
        setIsSubmitting(false);
    } // End finally block
  }; // End handleFormSubmit

  const handleExport = async () => {
      console.log("Exporting users to CSV...");
      try {
          // Call the Next.js API route proxy for export
          // NOTE: We still need to create /api/users/export/csv route
          const response = await fetch(`/api/users/export/csv`);
          if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
          }

          // Get the filename from Content-Disposition header if available, otherwise use a default
          const disposition = response.headers.get('Content-Disposition');
          let filename = 'users_export.csv';
          if (disposition && disposition.indexOf('attachment') !== -1) {
              const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
              const matches = filenameRegex.exec(disposition);
              if (matches != null && matches[1]) {
                  filename = matches[1].replace(/['"]/g, '');
              }
          }

          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = filename; // Use the extracted or default filename
          document.body.appendChild(a); // Append the element to the DOM
          a.click();
          a.remove(); // Remove the element after clicking
          window.URL.revokeObjectURL(url); // Clean up the object URL
          console.log("Export successful.");

      } catch (e: unknown) {
          console.error("Failed to export users:", e);
          const errorMessage = e instanceof Error ? e.message : String(e);
          alert(`Failed to export users: ${errorMessage}`); // Inform the user
      }
  }; // End handleExport

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
      console.log("File selected:", event.target.files[0].name);
    } else {
      setSelectedFile(null);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) {
      alert("Please select a CSV file to import.");
      return;
    }

    setIsImporting(true);
    setError(null); // Clear previous errors
    console.log("Importing users from file:", selectedFile.name);

    const formData = new FormData();
    formData.append('file', selectedFile); // 'file' must match the FastAPI parameter name

    try {
      // Call the Next.js API route proxy for import
      // NOTE: We still need to create /api/users/import/csv route
      const response = await fetch(`/api/users/import/csv`, {
        method: 'POST',
        body: formData,
        // Note: Don't set Content-Type header manually when using FormData,
        // the browser will set it correctly including the boundary.
      });

      const result = await response.json(); // Always expect JSON response from import endpoint

      if (!response.ok) {
        // Use detail from JSON response if available
        throw new Error(result.detail || `HTTP error! status: ${response.status}`);
      }

      // Display success message and any errors/skipped rows from the backend
      let message = result.message || "Import completed.";
      if (result.errors && result.errors.length > 0) {
          message += `\n\nErrors/Skipped:\n${result.errors.join('\n')}`;
          // Consider displaying errors more prominently if needed
      }
      alert(message);

      fetchUsers(); // Refresh the user list after import
      setSelectedFile(null); // Clear the selected file

    } catch (e: unknown) {
      console.error("Failed to import users:", e);
      const errorMessage = e instanceof Error ? e.message : String(e);
      setError(`Import failed: ${errorMessage}`); // Show error to user
      alert(`Import failed: ${errorMessage}`); // Also show in alert for immediate feedback
    } finally {
      setIsImporting(false);
      // Clear the file input visually (optional, might require ref)
      const fileInput = document.getElementById('csv-import-input') as HTMLInputElement;
      if (fileInput) {
          fileInput.value = ''; // Reset file input
      }
    }
  };

  return (
    // Wrap main content and modal in a React Fragment
    <>
    <main className="flex min-h-screen flex-col items-center p-4 sm:p-8 md:p-12 lg:p-24">
       <div className="w-full max-w-5xl"> {/* Limit content width */}
         <h1 className="text-2xl sm:text-3xl font-bold mb-6 text-center sm:text-left">
           User Information Management
         </h1>
{/* Action Buttons and Import Section */}
<div className="mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
    {/* Import Section */}
    <div className="flex items-center gap-2 flex-nowrap min-w-0">
        <div className="flex-1 min-w-0">
            <input
                type="file"
                id="csv-import-input"
                accept=".csv"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-500 truncate
                          file:mr-2 file:py-2 file:px-3
                          file:rounded-lg file:border-0
                          file:text-sm file:font-medium
                          file:bg-blue-50 file:text-blue-700
                          hover:file:bg-blue-100
                          focus:outline-none"
            />
        </div>
        <button
            onClick={handleImport}
            disabled={!selectedFile || isImporting}
            className={`whitespace-nowrap px-3 py-2 text-sm text-white rounded-lg ${
                (!selectedFile || isImporting)
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-purple-600 hover:bg-purple-700'
            }`}
        >
            {isImporting ? 'Importing...' : 'Import CSV'}
        </button>
    </div>

    {/* Existing Action Buttons */}
    <div className="flex space-x-2">
        <button
            onClick={handleExport} // Connect button to export function
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
            Export Users (CSV)
        </button>
        <button
            onClick={handleAddUserClick} // Connect button to open modal
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
            Add User
        </button>
    </div>
    {/* Removed extra </button> here */}
</div>

         {loading && <p className="text-center">Loading users...</p>}
         {error && <p className="text-center text-red-500">{error}</p>}
         {!loading && !error && (
           <UserTable users={users} onEdit={handleEdit} onDelete={handleDelete} />
         )}

         {/* Optional: Add pagination controls here */}
       </div>
    </main>

      {/* Render the Modal - Now inside the fragment */}
      <UserFormModal
          isOpen={isModalOpen}
          onClose={handleModalClose}
          onSubmit={handleFormSubmit}
          initialData={editingUser} // Pass user data for editing
          isSubmitting={isSubmitting}
      />
    </>
  );
}
