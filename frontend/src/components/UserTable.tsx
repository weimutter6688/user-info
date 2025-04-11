'use client'; // Mark this component as a Client Component

import React from 'react';
import Link from 'next/link'; // Import Link
import { User } from '@/types';

interface UserTableProps {
  users: User[];
  onEdit: (user: User) => void; // Function to handle editing a user
  onDelete: (userId: number) => void; // Function to handle deleting a user
}

const UserTable: React.FC<UserTableProps> = ({ users, onEdit, onDelete }) => {
  if (!users || users.length === 0) {
    return <p className="text-center text-gray-500">No users found.</p>;
  }

  return (
    <div className="overflow-x-auto shadow-md sm:rounded-lg">
      <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
        <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
          <tr>
            <th scope="col" className="px-6 py-3">Full Name</th>
            <th scope="col" className="px-6 py-3 hidden sm:table-cell">Primary Email</th>
            <th scope="col" className="px-6 py-3 hidden md:table-cell">Birth Date</th>
            <th scope="col" className="px-6 py-3 hidden lg:table-cell">Address</th>
            {/* Add more columns as needed, e.g., for Education */}
            <th scope="col" className="px-6 py-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
              <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white"><Link href={`/users/${user.id}`} className="hover:underline">{user.full_name}</Link></th><td className="px-6 py-4 hidden sm:table-cell">{user.primary_email}</td><td className="px-6 py-4 hidden md:table-cell">{user.birth_date.toString()}</td><td className="px-6 py-4 hidden lg:table-cell">{user.address}</td><td className="px-6 py-4 space-x-2 whitespace-nowrap"><button onClick={() => onEdit(user)} className="font-medium text-blue-600 dark:text-blue-500 hover:underline">Edit</button><button onClick={() => onDelete(user.id)} className="font-medium text-red-600 dark:text-red-500 hover:underline">Delete</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default UserTable;