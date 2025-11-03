import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { AttendanceRecord, Student, Message, View } from './types';
import { MOCK_STUDENTS } from './constants';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import StudentManager from './components/StudentManager';
import Analytics from './components/Analytics';
import AddStudentModal from './components/AddStudentModal';
import EditStudentModal from './components/EditStudentModal';
import DeleteConfirmationModal from './components/DeleteConfirmationModal';

const App: React.FC = () => {
  const [students, setStudents] = useState<Student[]>(() => {
    try {
      const storedStudents = localStorage.getItem('attendanceApp-students');
      return storedStudents ? JSON.parse(storedStudents) : MOCK_STUDENTS;
    } catch (error) {
      console.error("Failed to parse students from localStorage", error);
      return MOCK_STUDENTS;
    }
  });

  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>(() => {
     try {
      const storedRecords = localStorage.getItem('attendanceApp-records');
      if (storedRecords) {
        // Revive date objects from ISO strings
        return JSON.parse(storedRecords).map((r: any) => ({...r, timestamp: new Date(r.timestamp)}));
      }
      return [];
    } catch (error) {
      console.error("Failed to parse records from localStorage", error);
      return [];
    }
  });
  
  const [message, setMessage] = useState<Message | null>(null);
  const [view, setView] = useState<View>('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Persist state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('attendanceApp-students', JSON.stringify(students));
    } catch (error) {
      console.error("Failed to save students to localStorage", error);
    }
  }, [students]);

  useEffect(() => {
    try {
      localStorage.setItem('attendanceApp-records', JSON.stringify(attendanceRecords));
    } catch (error) {
      console.error("Failed to save records to localStorage", error);
    }
  }, [attendanceRecords]);


  // Modals State
  const [showAddStudentModal, setShowAddStudentModal] = useState<boolean>(false);
  const [showEditStudentModal, setShowEditStudentModal] = useState<boolean>(false);
  const [showDeleteConfirmationModal, setShowDeleteConfirmationModal] = useState<boolean>(false);
  
  const [studentToEdit, setStudentToEdit] = useState<Student | null>(null);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);

  const closeModals = useCallback(() => {
    setShowAddStudentModal(false);
    setShowEditStudentModal(false);
    setShowDeleteConfirmationModal(false);
    setStudentToEdit(null);
    setStudentToDelete(null);
  }, []);
  
  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleLogout = () => {
    // Clear state and local storage
    setStudents(MOCK_STUDENTS);
    setAttendanceRecords([]);
    localStorage.removeItem('attendanceApp-students');
    localStorage.removeItem('attendanceApp-records');
    showMessage('success', 'Data cleared successfully.');
    setIsMobileSidebarOpen(false); // Close sidebar on mobile
    setView('dashboard'); // Go back to main view
  }
  
  const handleSetView = (newView: View) => {
    if (newView === 'logout') {
      handleLogout();
    } else {
      setView(newView);
      setIsMobileSidebarOpen(false); // Close mobile sidebar on navigation
    }
  };

  // Student Management Handlers
  const handleAddStudent = useCallback((newStudent: Omit<Student, 'avatarUrl'>) => {
    if (students.some(s => s.id.toLowerCase() === newStudent.id.toLowerCase())) {
      showMessage('error', `Student with ID "${newStudent.id}" already exists.`);
      return;
    }
    const studentWithAvatar: Student = {
      ...newStudent,
      avatarUrl: `https://picsum.photos/seed/${newStudent.id}/100`,
    };
    setStudents(prev => [studentWithAvatar, ...prev].sort((a, b) => a.name.localeCompare(b.name)));
    showMessage('success', `${newStudent.name} added successfully!`);
    closeModals();
  }, [students, closeModals]);

  const handleEditStudent = (student: Student) => {
    setStudentToEdit(student);
    setShowEditStudentModal(true);
  };

  const handleUpdateStudent = (updatedStudent: Student) => {
    setStudents(prev => prev.map(s => s.id === updatedStudent.id ? updatedStudent : s));
    showMessage('success', `${updatedStudent.name}'s information updated.`);
    closeModals();
  };

  const handleDeleteStudent = (student: Student) => {
    setStudentToDelete(student);
    setShowDeleteConfirmationModal(true);
  };

  const confirmDeleteStudent = () => {
    if (!studentToDelete) return;
    setStudents(prev => prev.filter(s => s.id !== studentToDelete.id));
    showMessage('success', `${studentToDelete.name} has been deleted.`);
    closeModals();
  };
  
  const handleImportStudents = useCallback((importedStudents: Omit<Student, 'avatarUrl'>[]) => {
    let addedCount = 0;
    let updatedCount = 0;
    
    setStudents(prevStudents => {
        const studentsMap = new Map(prevStudents.map(s => [s.id.toLowerCase(), s]));

        importedStudents.forEach(importedStudent => {
            const existingStudent = studentsMap.get(importedStudent.id.toLowerCase());
            if (existingStudent) {
                // Update existing student
                studentsMap.set(importedStudent.id.toLowerCase(), {
                    ...existingStudent,
                    ...importedStudent,
                });
                updatedCount++;
            } else {
                // Add new student
                const newStudent: Student = {
                    ...importedStudent,
                    avatarUrl: `https://picsum.photos/seed/${importedStudent.id}/100`,
                };
                studentsMap.set(importedStudent.id.toLowerCase(), newStudent);
                addedCount++;
            }
        });

        return Array.from(studentsMap.values()).sort((a, b) => a.name.localeCompare(b.name));
    });

    showMessage('success', `Import complete. ${addedCount} added, ${updatedCount} updated.`);
}, [showMessage]);

  const renderView = () => {
    switch (view) {
      case 'dashboard':
        return (
          <Dashboard
            students={students}
            attendanceRecords={attendanceRecords}
            setAttendanceRecords={setAttendanceRecords}
            showMessage={showMessage}
          />
        );
      case 'analytics':
        return <Analytics attendanceRecords={attendanceRecords} students={students} />;
      case 'students':
        return (
          <StudentManager
            students={students}
            onAddStudent={() => setShowAddStudentModal(true)}
            onEditStudent={handleEditStudent}
            onDeleteStudent={handleDeleteStudent}
            onImportStudents={handleImportStudents}
            showMessage={showMessage}
          />
        );
      default:
        return null;
    }
  }

  return (
    <div className="flex h-screen bg-slate-100 text-slate-800">
      <Sidebar 
        currentView={view} 
        setView={handleSetView}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
        isMobileOpen={isMobileSidebarOpen}
        setIsMobileOpen={setIsMobileSidebarOpen}
      />
      
      {isMobileSidebarOpen && (
        <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
            onClick={() => setIsMobileSidebarOpen(false)}
        ></div>
      )}

      {message && (
        <div className={`fixed top-5 right-5 p-4 rounded-lg shadow-xl text-white ${message.type === 'success' ? 'bg-green-500' : 'bg-red-500'} transition-transform transform animate-fade-in z-50`}>
          {message.text}
        </div>
      )}

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header currentView={view} onMenuClick={() => setIsMobileSidebarOpen(true)} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 sm:p-6">
          {renderView()}
        </main>
      </div>

      {showAddStudentModal && <AddStudentModal onAddStudent={handleAddStudent} onClose={closeModals} />}
      {showEditStudentModal && studentToEdit && <EditStudentModal student={studentToEdit} onUpdateStudent={handleUpdateStudent} onClose={closeModals} />}
      {showDeleteConfirmationModal && studentToDelete && <DeleteConfirmationModal student={studentToDelete} onConfirmDelete={confirmDeleteStudent} onClose={closeModals} />}
    </div>
  );
};

export default App;