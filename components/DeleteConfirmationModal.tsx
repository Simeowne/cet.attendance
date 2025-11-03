import React from 'react';
import { XMarkIcon } from './icons';
import { Student } from '../types';

interface DeleteConfirmationModalProps {
  student: Student;
  onConfirmDelete: () => void;
  onClose: () => void;
}

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({ student, onConfirmDelete, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-slate-400 hover:text-slate-600"
        >
          <XMarkIcon className="w-6 h-6" />
        </button>
        <h2 className="text-2xl font-bold mb-4 text-center text-slate-800">Confirm Deletion</h2>
        <p className="text-center text-slate-600 mb-6">
          Are you sure you want to delete <strong className="font-semibold text-red-600">{student.name}</strong>? This action cannot be undone.
        </p>
        <div className="flex justify-center space-x-4">
            <button
                onClick={onClose}
                className="px-6 py-2 rounded-md text-slate-700 bg-slate-200 hover:bg-slate-300 font-semibold"
            >
                Cancel
            </button>
            <button
                onClick={onConfirmDelete}
                className="px-6 py-2 rounded-md text-white bg-red-600 hover:bg-red-700 font-semibold"
            >
                Delete
            </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmationModal;