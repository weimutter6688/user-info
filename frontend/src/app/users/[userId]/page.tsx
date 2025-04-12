'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation'; // Use next/navigation for App Router (removed unused useRouter)
import Link from 'next/link';
import { User } from '@/types'; // Assuming types are correctly defined

// API_BASE_URL is no longer needed here, calls will use relative paths to Next.js API routes

export default function UserDetailPage() {
  const params = useParams();
  // const router = useRouter(); // Removed unused router
  const userId = params?.userId; // userId will be a string or undefined

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (userId && typeof userId === 'string') {
      const fetchUserDetail = async () => {
        setLoading(true);
        setError(null);
        try {
          // Call the Next.js API route proxy
          const response = await fetch(`/api/users/${userId}`);
          if (!response.ok) {
            if (response.status === 404) {
              throw new Error('User not found');
            }
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          const data: User = await response.json();
          setUser(data);
        } catch (e: unknown) { // Use unknown instead of any
          console.error("Failed to fetch user details:", e);
          const errorMessage = e instanceof Error ? e.message : String(e);
          setError(`Failed to load user details: ${errorMessage}`);
        } finally {
          setLoading(false);
        }
      };
      fetchUserDetail();
    } else {
      // Handle cases where userId is missing or invalid if necessary
      setError("Invalid User ID provided.");
      setLoading(false);
    }
  }, [userId]); // Re-run effect if userId changes

  if (loading) {
    return <p className="text-center p-10">Loading user details...</p>;
  }

  if (error) {
    return (
        <div className="text-center p-10 text-red-500">
            <p>{error}</p>
            <Link href="/" className="text-blue-600 hover:underline mt-4 inline-block">
                Go back to user list
            </Link>
        </div>
    );
  }

  if (!user) {
     return (
        <div className="text-center p-10">
            <p>User data could not be loaded.</p>
             <Link href="/" className="text-blue-600 hover:underline mt-4 inline-block">
                Go back to user list
            </Link>
        </div>
     );
  }

  // Basic display structure - enhance styling as needed
  return (
    <main className="flex min-h-screen flex-col items-center p-4 sm:p-8 md:p-12 lg:p-24">
      <div className="w-full max-w-3xl bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
        <h1 className="text-2xl sm:text-3xl font-bold mb-6 text-gray-900 dark:text-white">
          User Details: {user.full_name}
        </h1>

        <div className="space-y-4 text-gray-700 dark:text-gray-300">
          <p><strong>ID:</strong> {user.id}</p>
          <p><strong>Full Name:</strong> {user.full_name}</p>
          <p><strong>Birth Date:</strong> {user.birth_date}</p>
          <p><strong>Address:</strong> {user.address}</p>
          <p><strong>Primary Email:</strong> {user.primary_email}</p>
          {user.high_school && <p><strong>High School:</strong> {user.high_school}</p>}

          {/* Secondary Emails */}
          <div className="pt-4 border-t mt-4">
            <h2 className="text-lg font-semibold mb-2 text-gray-800 dark:text-white">Secondary Emails</h2>
            {user.secondary_emails && user.secondary_emails.length > 0 ? (
              <ul className="list-disc list-inside space-y-1">
                {user.secondary_emails.map(email => (
                  <li key={email.id}>
                    {email.email}
                    {email.description && <span className="text-gray-500 dark:text-gray-400 ml-2">({email.description})</span>}
                  </li>
                ))}
              </ul>
            ) : (
              <p>No secondary emails listed.</p>
            )}
          </div>

          {/* Education History */}
           <div className="pt-4 border-t mt-4">
            <h2 className="text-lg font-semibold mb-2 text-gray-800 dark:text-white">Education History</h2>
            {user.educations && user.educations.length > 0 ? (
              <ul className="list-disc list-inside space-y-1">
                {user.educations.map(edu => (
                  <li key={edu.id}>
                    {edu.institution_name}
                    {edu.institution_type ? ` (${edu.institution_type})` : ''}
                    {edu.student_id ? ` - ID: ${edu.student_id}` : ''}
                  </li>
                ))}
              </ul>
            ) : (
              <p>No education history listed.</p>
            )}
          </div>

          {/* Remarks */}
          <div className="pt-4 border-t mt-4">
             <h2 className="text-lg font-semibold mb-2 text-gray-800 dark:text-white">Remarks</h2>
             <p><strong>Remark 1:</strong> {user.remark1 || 'N/A'}</p>
             <p><strong>Remark 2:</strong> {user.remark2 || 'N/A'}</p>
             <p><strong>Remark 3:</strong> {user.remark3 || 'N/A'}</p>
          </div>

        </div>

        <div className="mt-8 text-center">
          <Link href="/" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            Back to User List
          </Link>
          {/* Optional: Add Edit button here linking to edit page or opening modal */}
        </div>
      </div>
    </main>
  );
}