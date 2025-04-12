'use client';

import React from 'react';
import Link from 'next/link';
import { User } from '@/types';

interface UserTableProps {
  users: User[];
  onEdit: (user: User) => void;
  onDelete: (userId: number) => void;
}

const UserTable: React.FC<UserTableProps> = ({ users, onEdit, onDelete }) => {
  if (!users || users.length === 0) {
    return <p className="text-center text-gray-500 p-4">No users found.</p>;
  }

  return (
    <div className="mobile-container">
      {/* 移动端卡片视图 */}
      <div className="block sm:hidden space-y-4">
        {users.map((user) => (
          <div key={user.id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 space-y-3">
            <div className="flex items-center justify-between">
              <Link
                href={`/users/${user.id}`}
                className="text-lg font-medium text-blue-500 hover:text-blue-600 transition-colors"
              >
                {user.full_name}
              </Link>
              <div className="flex gap-2">
                <button 
                  onClick={() => onEdit(user)} 
                  className="btn btn-secondary touch-target px-4"
                  aria-label={`Edit ${user.full_name}`}
                >
                  Edit
                </button>
                <button 
                  onClick={() => onDelete(user.id)} 
                  className="btn btn-danger touch-target px-4"
                  aria-label={`Delete ${user.full_name}`}
                >
                  Delete
                </button>
              </div>
            </div>
            <div className="text-sm space-y-2">
              <p className="flex justify-between">
                <span className="text-gray-500">Email:</span>
                <span className="break-all">{user.primary_email}</span>
              </p>
              <p className="flex justify-between">
                <span className="text-gray-500">Birth Date:</span>
                <span>{user.birth_date.toString()}</span>
              </p>
              <p className="flex justify-between">
                <span className="text-gray-500">Address:</span>
                <span className="text-right flex-1 ml-4 break-words">{user.address}</span>
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* 桌面端表格视图 */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="table-enhanced w-full">
          <thead>
            <tr>
              <th scope="col">Full Name</th>
              <th scope="col">Primary Email</th>
              <th scope="col" className="hidden md:table-cell">Birth Date</th>
              <th scope="col" className="hidden lg:table-cell">Address</th>
              <th scope="col" className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td className="font-medium">
                  <Link
                    href={`/users/${user.id}`}
                    className="text-blue-500 hover:text-blue-600 transition-colors"
                  >
                    {user.full_name}
                  </Link>
                </td>
                <td>{user.primary_email}</td>
                <td className="hidden md:table-cell">{user.birth_date.toString()}</td>
                <td className="hidden lg:table-cell">{user.address}</td>
                <td className="text-right space-x-2 whitespace-nowrap">
                  <button 
                    onClick={() => onEdit(user)} 
                    className="btn btn-secondary px-3 py-1.5"
                  >
                    Edit
                  </button>
                  <button 
                    onClick={() => onDelete(user.id)} 
                    className="btn btn-danger px-3 py-1.5"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserTable;