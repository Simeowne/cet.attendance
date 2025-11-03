import React, { useState, useMemo, useCallback } from 'react';
import { Student, AttendanceRecord, AttendanceStatus, Message } from '../types';
import { QrCodeIcon, PencilSquareIcon, MagnifyingGlassIcon, ArrowDownTrayIcon } from './icons';
import AttendanceLog from './AttendanceLog';
import ScannerModal from './ScannerModal';
import ManualEntryModal from './ManualEntryModal';

declare var XLSX: any;

interface DashboardProps {
    students: Student[];
    attendanceRecords: AttendanceRecord[];
    setAttendanceRecords: React.Dispatch<React.SetStateAction<AttendanceRecord[]>>;
    showMessage: (type: 'success' | 'error', text: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ students, attendanceRecords, setAttendanceRecords, showMessage }) => {
    const [showScannerModal, setShowScannerModal] = useState<boolean>(false);
    const [showManualEntryModal, setShowManualEntryModal] = useState<boolean>(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<AttendanceStatus | 'all'>('all');

    const closeModals = useCallback(() => {
        setShowScannerModal(false);
        setShowManualEntryModal(false);
    }, []);

    const processStudentId = useCallback((id: string) => {
        const student = students.find(s => s.id.toLowerCase() === id.toLowerCase());

        if (!student) {
            showMessage('error', `Student with ID "${id}" not found.`);
            return;
        }

        setAttendanceRecords(prevRecords => {
            const studentRecords = prevRecords.filter(r => r.studentId === student.id).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
            const latestRecordForStudent = studentRecords[0];
            const isTimingIn = !latestRecordForStudent || latestRecordForStudent.status === AttendanceStatus.TimedOut;

            showMessage('success', `${student.name} timed ${isTimingIn ? 'in' : 'out'} successfully!`);

            const newRecord: AttendanceRecord = {
                studentId: student.id,
                studentName: student.name,
                studentAvatarUrl: student.avatarUrl,
                studentCourse: student.course,
                studentYear: student.year,
                studentBlock: student.block,
                status: isTimingIn ? AttendanceStatus.TimedIn : AttendanceStatus.TimedOut,
                timestamp: new Date(),
            };
            return [newRecord, ...prevRecords];
        });

        closeModals();
    }, [students, setAttendanceRecords, showMessage, closeModals]);

    const handleScanSuccess = useCallback((decodedText: string) => {
        processStudentId(decodedText);
    }, [processStudentId]);

    const handleManualEntry = useCallback((studentIdentifier: string) => {
        processStudentId(studentIdentifier);
    }, [processStudentId]);

    const stats = useMemo(() => {
        const timedInStudents = new Set();
        const latestRecords = new Map<string, AttendanceRecord>();

        [...attendanceRecords].sort((a,b) => a.timestamp.getTime() - b.timestamp.getTime()).forEach(record => {
            latestRecords.set(record.studentId, record);
        });

        latestRecords.forEach(record => {
            if (record.status === AttendanceStatus.TimedIn) {
                timedInStudents.add(record.studentId);
            }
        });

        return {
            timedIn: timedInStudents.size,
            totalRecords: attendanceRecords.length
        };
    }, [attendanceRecords]);
    
    const filteredAndSortedRecords = useMemo(() => {
        let filtered = [...attendanceRecords];
        
        if (searchQuery) {
            filtered = filtered.filter(record =>
                record.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                record.studentId.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }
        
        if (statusFilter !== 'all') {
            const latestStatusMap = new Map<string, AttendanceStatus>();
            [...attendanceRecords].sort((a,b) => b.timestamp.getTime() - a.timestamp.getTime()).forEach(record => {
                if (!latestStatusMap.has(record.studentId)) {
                    latestStatusMap.set(record.studentId, record.status);
                }
            });

            filtered = filtered.filter(record => latestStatusMap.get(record.studentId) === statusFilter);
        }

        return filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    }, [attendanceRecords, searchQuery, statusFilter]);

    const handleExport = () => {
        const chronoRecords = [...filteredAndSortedRecords].reverse();
        const sessions: any[] = [];
        const openTimeIns = new Map<string, AttendanceRecord>();
    
        for (const record of chronoRecords) {
            if (record.status === AttendanceStatus.TimedIn) {
                if (openTimeIns.has(record.studentId)) {
                    const orphanedTimeIn = openTimeIns.get(record.studentId)!;
                    sessions.push({
                        'Name': orphanedTimeIn.studentName,
                        'Course': orphanedTimeIn.studentCourse,
                        'Year': orphanedTimeIn.studentYear,
                        'Block': orphanedTimeIn.studentBlock,
                        'Date': orphanedTimeIn.timestamp.toLocaleDateString(),
                        'Time In': orphanedTimeIn.timestamp.toLocaleTimeString(),
                        'Time Out': '',
                    });
                }
                openTimeIns.set(record.studentId, record);
            } else if (record.status === AttendanceStatus.TimedOut) {
                const timeInRecord = openTimeIns.get(record.studentId);
                if (timeInRecord) {
                    sessions.push({
                        'Name': timeInRecord.studentName,
                        'Course': timeInRecord.studentCourse,
                        'Year': timeInRecord.studentYear,
                        'Block': timeInRecord.studentBlock,
                        'Date': timeInRecord.timestamp.toLocaleDateString(),
                        'Time In': timeInRecord.timestamp.toLocaleTimeString(),
                        'Time Out': record.timestamp.toLocaleTimeString(),
                    });
                    openTimeIns.delete(record.studentId);
                } else {
                    sessions.push({
                        'Name': record.studentName,
                        'Course': record.studentCourse,
                        'Year': record.studentYear,
                        'Block': record.studentBlock,
                        'Date': record.timestamp.toLocaleDateString(),
                        'Time In': '',
                        'Time Out': record.timestamp.toLocaleTimeString(),
                    });
                }
            }
        }
    
        openTimeIns.forEach(record => {
            sessions.push({
                'Name': record.studentName,
                'Course': record.studentCourse,
                'Year': record.studentYear,
                'Block': record.studentBlock,
                'Date': record.timestamp.toLocaleDateString(),
                'Time In': record.timestamp.toLocaleTimeString(),
                'Time Out': '',
            });
        });
        
        if (sessions.length === 0) {
            showMessage('error', 'No data to export.');
            return;
        }

        sessions.sort((a, b) => {
            const timeA = a['Time In'] || a['Time Out'];
            const timeB = b['Time In'] || b['Time Out'];
            const dateA = new Date(`${a.Date} ${timeA}`);
            const dateB = new Date(`${b.Date} ${timeB}`);
            return dateA.getTime() - dateB.getTime();
        });
    
        const worksheet = XLSX.utils.json_to_sheet(sessions);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance Sessions");
    
        worksheet['!cols'] = [
            { wch: 25 }, { wch: 30 }, { wch: 8 }, { wch: 8 }, { wch: 12 }, { wch: 12 }, { wch: 12 },
        ];
    
        XLSX.writeFile(workbook, "AttendanceSessions.xlsx");
    };

    return (
        <div className="flex flex-col h-full space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="bg-white p-5 rounded-lg shadow-sm border border-slate-200 text-center">
                    <p className="text-3xl font-bold text-green-600">{stats.timedIn}</p>
                    <p className="text-sm text-slate-500 mt-1">Currently Timed In</p>
                </div>
                <div className="bg-white p-5 rounded-lg shadow-sm border border-slate-200 text-center">
                    <p className="text-3xl font-bold text-slate-800">{stats.totalRecords}</p>
                    <p className="text-sm text-slate-500 mt-1">Today's Records</p>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <button
                    onClick={() => setShowScannerModal(true)}
                    className="bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-6 rounded-lg flex items-center justify-center space-x-3 transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-100 focus:ring-green-500"
                >
                    <QrCodeIcon className="w-7 h-7" />
                    <span className="text-lg">Scan QR/Barcode</span>
                </button>
                <button
                    onClick={() => setShowManualEntryModal(true)}
                    className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-bold py-4 px-6 rounded-lg flex items-center justify-center space-x-3 transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-100 focus:ring-slate-400"
                >
                    <PencilSquareIcon className="w-7 h-7" />
                    <span className="text-lg">Manual Entry</span>
                </button>
            </div>
            
            <div className="flex-grow flex flex-col bg-white rounded-lg shadow-sm border border-slate-200 p-4 sm:p-6">
                <div className="flex flex-wrap gap-4 justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-slate-800">Attendance Log</h2>
                    <button
                        onClick={handleExport}
                        className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-semibold py-2 px-4 rounded-lg flex items-center justify-center space-x-2 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={filteredAndSortedRecords.length === 0}
                    >
                        <ArrowDownTrayIcon className="w-5 h-5" />
                        <span>Export</span>
                    </button>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 mb-4">
                    <div className="relative flex-grow">
                        <MagnifyingGlassIcon className="w-5 h-5 absolute top-1/2 left-3 transform -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by name or ID..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 p-2 border border-slate-300 rounded-md focus:ring-green-500 focus:border-green-500"
                        />
                    </div>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as AttendanceStatus | 'all')}
                        className="p-2 border border-slate-300 rounded-md focus:ring-green-500 focus:border-green-500 bg-white"
                    >
                        <option value="all">All Statuses</option>
                        <option value={AttendanceStatus.TimedIn}>Timed In</option>
                        <option value={AttendanceStatus.TimedOut}>Timed Out</option>
                    </select>
                </div>
                <AttendanceLog records={filteredAndSortedRecords} isFiltered={!!searchQuery || statusFilter !== 'all'} />
            </div>

            {showScannerModal && <ScannerModal onScanSuccess={handleScanSuccess} onClose={closeModals} />}
            {showManualEntryModal && <ManualEntryModal students={students} onSubmit={handleManualEntry} onClose={closeModals} />}
        </div>
    );
};

export default Dashboard;