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
  const API_BASE_URL = 'http://127.0.0.1:8001'; // Backend API URL

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/`);
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
          const response = await fetch(`${API_BASE_URL}/api/users/${userId}`, {
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
            response = await fetch(`${API_BASE_URL}/api/users/${editingUser.id}`, {
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
            response = await fetch(`${API_BASE_URL}/api/users/`, {
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

         {/* TODO: Add Search/Filter controls here */}
         <div className="mb-4 text-right">
             <button
               onClick={handleAddUserClick} // Connect button to open modal
               className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
             >
               Add User
             </button>
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
