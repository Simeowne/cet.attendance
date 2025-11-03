import React, { useState, useEffect } from 'react';
import { XMarkIcon } from './icons';
import { Student } from '../types';

interface EditStudentModalProps {
  student: Student;
  onUpdateStudent: (student: Student) => void;
  onClose: () => void;
}

const EditStudentModal: React.FC<EditStudentModalProps> = ({ student, onUpdateStudent, onClose }) => {
  const [name, setName] = useState(student.name);
  const [course, setCourse] = useState(student.course);
  const [year, setYear] = useState<number | ''>(student.year);
  const [block, setBlock] = useState(student.block);
  const [error, setError] = useState('');

  useEffect(() => {
    setName(student.name);
    setCourse(student.course);
    setYear(student.year);
    setBlock(student.block);
  }, [student]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !course.trim() || year === '' || !block.trim()) {
      setError('All fields are required.');
      return;
    }
    setError('');
    onUpdateStudent({ 
        ...student,
        name: name.trim(), 
        course: course.trim(),
        year: Number(year),
        block: block.trim()
    });
  };
  
  const inputStyle = "mt-1 w-full bg-white text-slate-800 border border-slate-300 rounded-md p-3 focus:ring-green-500 focus:border-green-500";
  const labelStyle = "block text-sm font-medium text-slate-700";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-slate-400 hover:text-slate-600"
        >
          <XMarkIcon className="w-8 h-8" />
        </button>
        <h2 className="text-2xl font-bold mb-4 text-center text-slate-800">Edit Student</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="studentId" className={labelStyle}>
              Student ID (Read-only)
            </label>
            <input
              id="studentId" type="text" value={student.id}
              className="mt-1 w-full bg-slate-100 text-slate-500 border border-slate-300 rounded-md p-3"
              readOnly
            />
          </div>
          <div>
            <label htmlFor="studentName" className={labelStyle}>
              Full Name
            </label>
            <input
              id="studentName" type="text" value={name} onChange={(e) => setName(e.target.value)}
              className={inputStyle}
              placeholder="e.g., John Doe"
              autoFocus
            />
          </div>
          <div>
            <label htmlFor="course" className={labelStyle}>
              Course
            </label>
            <input
              id="course" type="text" value={course} onChange={(e) => setCourse(e.target.value)}
              className={inputStyle}
              placeholder="e.g., BS in Computer Science"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
                <label htmlFor="year" className={labelStyle}>
                Year
                </label>
                <input
                id="year" type="number" value={year} onChange={(e) => setYear(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                className={inputStyle}
                placeholder="e.g., 3"
                min="1"
                />
            </div>
            <div>
                <label htmlFor="block" className={labelStyle}>
                Block
                </label>
                <input
                id="block" type="text" value={block} onChange={(e) => setBlock(e.target.value)}
                className={inputStyle}
                placeholder="e.g., A"
                />
            </div>
          </div>
          
          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-md mt-6 transition-colors"
          >
            Save Changes
          </button>
        </form>
      </div>
    </div>
  );
};

export default EditStudentModal;