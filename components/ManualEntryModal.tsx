import React, { useState, useMemo } from 'react';
import { XMarkIcon, MagnifyingGlassIcon } from './icons';
import { Student } from '../types';

interface ManualEntryModalProps {
  students: Student[];
  onSubmit: (studentIdentifier: string) => void;
  onClose: () => void;
}

const ManualEntryModal: React.FC<ManualEntryModalProps> = ({ students, onSubmit, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredStudents = useMemo(() => {
    if (!searchTerm) {
      return students;
    }
    return students.filter(student =>
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.id.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [students, searchTerm]);

  const handleSelectStudent = (studentId: string) => {
    onSubmit(studentId);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg relative flex flex-col max-h-[90vh]">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 z-10"
        >
          <XMarkIcon className="w-8 h-8" />
        </button>
        <h2 className="text-2xl font-bold mb-4 text-center text-slate-800">Manual Entry</h2>
        
        <div className="relative mb-4">
            <MagnifyingGlassIcon className="w-5 h-5 absolute top-1/2 left-3 transform -translate-y-1/2 text-slate-400" />
            <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white text-slate-800 border border-slate-300 rounded-md py-2 pl-10 pr-4 focus:ring-green-500 focus:border-green-500"
                placeholder="Search by name or ID..."
                autoFocus
            />
        </div>

        <div className="flex-grow overflow-y-auto -mx-2 px-2">
            {filteredStudents.length > 0 ? (
                 <ul className="space-y-2">
                 {filteredStudents.map(student => (
                   <li key={student.id}>
                     <button
                       onClick={() => handleSelectStudent(student.id)}
                       className="w-full flex items-center space-x-3 p-3 rounded-lg text-left hover:bg-slate-100 transition-colors"
                     >
                       <img src={student.avatarUrl} alt={student.name} className="w-12 h-12 rounded-full" />
                       <div>
                         <p className="font-semibold text-slate-800">{student.name}</p>
                         <p className="text-sm text-slate-500">{student.id}</p>
                       </div>
                     </button>
                   </li>
                 ))}
               </ul>
            ) : (
                <p className="text-center text-slate-500 mt-8">No students found matching your search.</p>
            )}
        </div>
      </div>
    </div>
  );
};

export default ManualEntryModal;