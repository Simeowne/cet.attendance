import React, { useState, useMemo, useRef } from 'react';
import { Student } from '../types';
import { UserPlusIcon, PencilIcon, TrashIcon, MagnifyingGlassIcon, DocumentArrowUpIcon } from './icons';

declare var XLSX: any;

interface StudentManagerProps {
  students: Student[];
  onAddStudent: () => void;
  onEditStudent: (student: Student) => void;
  onDeleteStudent: (student: Student) => void;
  onImportStudents: (students: Omit<Student, 'avatarUrl'>[]) => void;
  showMessage: (type: 'success' | 'error', text: string) => void;
}

const StudentManager: React.FC<StudentManagerProps> = ({ students, onAddStudent, onEditStudent, onDeleteStudent, onImportStudents, showMessage }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [courseFilter, setCourseFilter] = useState('all');
  const [yearFilter, setYearFilter] = useState('all');
  const [blockFilter, setBlockFilter] = useState('all');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const courses = useMemo(() => [...new Set(students.map(s => s.course))].sort(), [students]);
  const years = useMemo(() => [...new Set(students.map(s => s.year))].sort((a, b) => a - b), [students]);
  const blocks = useMemo(() => [...new Set(students.map(s => s.block))].sort(), [students]);

  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      const matchesSearch = searchTerm === '' ||
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.id.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCourse = courseFilter === 'all' || student.course === courseFilter;
      const matchesYear = yearFilter === 'all' || student.year === Number(yearFilter);
      const matchesBlock = blockFilter === 'all' || student.block === blockFilter;
      
      return matchesSearch && matchesCourse && matchesYear && matchesBlock;
    });
  }, [students, searchTerm, courseFilter, yearFilter, blockFilter]);
  
  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
        return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const data = event.target?.result;
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const json: any[] = XLSX.utils.sheet_to_json(worksheet);

            if (json.length === 0) {
              throw new Error("The selected Excel file is empty or has an invalid format.");
            }
            
            // Validation
            const requiredHeaders = ["Student ID", "Student Name", "Course", "Year", "Block"];
            const fileHeaders = Object.keys(json[0] || {});
            const hasAllHeaders = requiredHeaders.every(h => fileHeaders.includes(h));

            if (!hasAllHeaders) {
                throw new Error("Invalid Excel format. Required headers: " + requiredHeaders.join(", "));
            }

            const importedStudents: Omit<Student, 'avatarUrl'>[] = json.map((row: any, index: number) => {
                const student = {
                    id: String(row["Student ID"] || '').trim(),
                    name: String(row["Student Name"] || '').trim(),
                    course: String(row["Course"] || '').trim(),
                    year: Number(row["Year"]),
                    block: String(row["Block"] || '').trim(),
                };
                
                if (!student.id || !student.name || !student.course || isNaN(student.year) || !student.block) {
                    throw new Error(`Invalid or missing data in row ${index + 2}. All fields are required.`);
                }
                
                return student;
            });
            
            onImportStudents(importedStudents);

        } catch (error: any) {
            console.error("Error importing file:", error);
            showMessage('error', error.message || "Failed to import file. Please check the format.");
        } finally {
            // Reset file input
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    reader.onerror = () => {
         showMessage('error', "Failed to read the file.");
         if (fileInputRef.current) {
            fileInputRef.current.value = '';
         }
    }
    
    reader.readAsArrayBuffer(file);
};


  const selectStyle = "w-full p-2 border border-slate-300 rounded-md focus:ring-green-500 focus:border-green-500 bg-white text-sm";
  
  const noResultsMessage = students.length > 0 ? "No students match the current filters." : "No students in the database. Click \"Add Student\" to get started.";

  return (
    <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-slate-200 flex-grow flex flex-col">
      <div className="flex flex-wrap gap-4 justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-slate-800">Student Database</h2>
        <div className="flex flex-wrap gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <DocumentArrowUpIcon className="w-5 h-5" />
              <span>Import</span>
            </button>
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileImport}
                className="hidden"
                accept=".xlsx, .xls"
            />
            <button
              onClick={onAddStudent}
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <UserPlusIcon className="w-5 h-5" />
              <span>Add Student</span>
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="relative md:col-span-2">
            <MagnifyingGlassIcon className="w-5 h-5 absolute top-1/2 left-3 transform -translate-y-1.2 text-slate-400" />
            <input
                type="text"
                placeholder="Search by name or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 p-2 border border-slate-300 rounded-md focus:ring-green-500 focus:border-green-500"
            />
        </div>
        <select value={courseFilter} onChange={e => setCourseFilter(e.target.value)} className={selectStyle}>
          <option value="all">All Courses</option>
          {courses.map(course => <option key={course} value={course}>{course}</option>)}
        </select>
        <div className="grid grid-cols-2 gap-2">
            <select value={yearFilter} onChange={e => setYearFilter(e.target.value)} className={selectStyle}>
                <option value="all">All Years</option>
                {years.map(year => <option key={year} value={year}>{`Year ${year}`}</option>)}
            </select>
            <select value={blockFilter} onChange={e => setBlockFilter(e.target.value)} className={selectStyle}>
                <option value="all">All Blocks</option>
                {blocks.map(block => <option key={block} value={block}>{`Block ${block}`}</option>)}
            </select>
        </div>
      </div>
      
      <div className="flex-grow">
        {/* Mobile Card View */}
        <div className="md:hidden space-y-3">
          {filteredStudents.length > 0 ? filteredStudents.map(student => (
            <div key={student.id} className="bg-slate-50 p-4 rounded-lg border border-slate-200">
              <div className="flex items-center space-x-4">
                <img className="h-12 w-12 rounded-full" src={student.avatarUrl} alt={student.name} />
                <div className="flex-grow">
                  <p className="font-bold text-slate-800">{student.name}</p>
                  <p className="text-sm text-slate-500">{student.id}</p>
                </div>
                <div className="flex space-x-3">
                  <button onClick={() => onEditStudent(student)} className="text-blue-600 p-2 hover:bg-blue-100 rounded-full" title="Edit Student">
                    <PencilIcon className="w-5 h-5" />
                  </button>
                  <button onClick={() => onDeleteStudent(student)} className="text-red-600 p-2 hover:bg-red-100 rounded-full" title="Delete Student">
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-200">
                <p className="text-sm text-slate-700">{student.course}</p>
                <p className="text-sm text-slate-500">{`Year ${student.year} - Block ${student.block}`}</p>
              </div>
            </div>
          )) : (
            <div className="text-center py-10 text-slate-500">{noResultsMessage}</div>
          )}
        </div>

        {/* Desktop Table View */}
        <div className="overflow-x-auto flex-grow -mx-4 sm:-mx-6 hidden md:block">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Student</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Course</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Year & Block</th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {filteredStudents.length > 0 ? filteredStudents.map((student) => (
                <tr key={student.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <img className="h-10 w-10 rounded-full" src={student.avatarUrl} alt={student.name} />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-slate-900">{student.name}</div>
                        <div className="text-sm text-slate-500">{student.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-slate-900">{student.course}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                      {`Year ${student.year} - Block ${student.block}`}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-4">
                      <button onClick={() => onEditStudent(student)} className="text-blue-600 hover:text-blue-900" title="Edit Student">
                        <PencilIcon className="w-5 h-5" />
                      </button>
                      <button onClick={() => onDeleteStudent(student)} className="text-red-600 hover:text-red-900" title="Delete Student">
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                  <tr>
                      <td colSpan={4} className="text-center py-10 text-slate-500">
                          {noResultsMessage}
                      </td>
                  </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default StudentManager;