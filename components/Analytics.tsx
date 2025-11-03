import React, { useMemo, useState } from 'react';
import { AttendanceRecord, AttendanceStatus, Student } from '../types';
import { ChartPieIcon } from './icons';

interface AnalyticsProps {
  attendanceRecords: AttendanceRecord[];
  students: Student[];
}

const formatDuration = (totalSeconds: number) => {
    if (isNaN(totalSeconds) || totalSeconds < 0) return '00:00:00';
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);
    return [hours, minutes, seconds].map(v => v.toString().padStart(2, '0')).join(':');
};

const Analytics: React.FC<AnalyticsProps> = ({ attendanceRecords, students }) => {
    const [pieFilter, setPieFilter] = useState<'course' | 'year'>('course');

    const analyticsData = useMemo(() => {
        const chronoRecords = [...attendanceRecords].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
        const studentDurations = new Map<string, number>();
        const openTimeIns = new Map<string, AttendanceRecord>();
        const courseCounts = new Map<string, number>();
        const yearCounts = new Map<number, number>();

        chronoRecords.forEach(record => {
            if (record.status === AttendanceStatus.TimedIn) {
                openTimeIns.set(record.studentId, record);
            } else if (record.status === AttendanceStatus.TimedOut) {
                const timeInRecord = openTimeIns.get(record.studentId);
                if (timeInRecord) {
                    const duration = (record.timestamp.getTime() - timeInRecord.timestamp.getTime()) / 1000;
                    const currentDuration = studentDurations.get(record.studentId) || 0;
                    studentDurations.set(record.studentId, currentDuration + duration);

                    const course = record.studentCourse;
                    courseCounts.set(course, (courseCounts.get(course) || 0) + 1);
                    const year = record.studentYear;
                    yearCounts.set(year, (yearCounts.get(year) || 0) + 1);

                    openTimeIns.delete(record.studentId);
                }
            }
        });

        const leaderboard = Array.from(studentDurations.entries())
            .map(([studentId, totalDuration]) => ({
                student: students.find(s => s.id === studentId),
                duration: totalDuration,
            }))
            .filter(item => item.student)
            .sort((a, b) => b.duration - a.duration)
            .slice(0, 5);
        
        const totalCourseSessions = Array.from(courseCounts.values()).reduce((a, b) => a + b, 0);
        const courseData = Array.from(courseCounts.entries()).map(([course, count]) => ({
            name: course,
            count,
            percentage: totalCourseSessions > 0 ? (count / totalCourseSessions) * 100 : 0
        })).sort((a, b) => b.count - a.count);

        const totalYearSessions = Array.from(yearCounts.values()).reduce((a, b) => a + b, 0);
        const yearData = Array.from(yearCounts.entries()).map(([year, count]) => ({
            name: `Year ${year}`,
            count,
            percentage: totalYearSessions > 0 ? (count / totalYearSessions) * 100 : 0
        })).sort((a, b) => a.name.localeCompare(b.name));

        return { leaderboard, courseData, yearData };
    }, [attendanceRecords, students]);

    const pieChartData = pieFilter === 'course' ? analyticsData.courseData : analyticsData.yearData;
    
    const PIE_COLORS = ['#34d399', '#60a5fa', '#fbbf24', '#f87171', '#a78bfa', '#2dd4bf', '#fb923c', '#93c5fd'];
    
    let cumulativePercentage = 0;
    const gradientString = pieChartData.map((data, index) => {
        const color = PIE_COLORS[index % PIE_COLORS.length];
        const start = cumulativePercentage;
        cumulativePercentage += data.percentage;
        const end = cumulativePercentage;
        return `${color} ${start}% ${end}%`;
    }).join(', ');

    const kpiCardStyle = "bg-white p-5 rounded-lg shadow-sm border border-slate-200 text-center";

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className={kpiCardStyle}>
                    <p className="text-2xl sm:text-3xl font-bold text-slate-800">{students.length}</p>
                    <p className="text-sm text-slate-500 mt-1">Total Students</p>
                </div>
                <div className={kpiCardStyle}>
                    <p className="text-2xl sm:text-3xl font-bold text-slate-800">{attendanceRecords.length}</p>
                    <p className="text-sm text-slate-500 mt-1">Total Records Today</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-3 bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-slate-200">
                    <div className="flex flex-wrap gap-4 justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-slate-800 flex items-center">
                            <ChartPieIcon className="w-6 h-6 mr-2 text-slate-500" />
                            Attendance Distribution
                        </h3>
                        <select
                            value={pieFilter}
                            onChange={(e) => setPieFilter(e.target.value as 'course' | 'year')}
                            className="p-2 border border-slate-300 rounded-md focus:ring-green-500 focus:border-green-500 bg-white text-sm"
                        >
                            <option value="course">By Course</option>
                            <option value="year">By Year Level</option>
                        </select>
                    </div>
                    {pieChartData.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                            <div
                                className="w-48 h-48 sm:w-56 sm:h-56 rounded-full mx-auto"
                                style={{
                                    background: `conic-gradient(${gradientString})`,
                                }}
                                role="img"
                                aria-label={`Pie chart showing attendance by ${pieFilter}`}
                            ></div>
                            <div className="space-y-2 text-sm">
                                {pieChartData.slice(0, 8).map((data, index) => (
                                    <div key={data.name} className="flex items-center">
                                        <span
                                            className="w-4 h-4 rounded-full mr-3 flex-shrink-0"
                                            style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
                                        ></span>
                                        <span className="font-medium text-slate-700 flex-grow truncate" title={data.name}>{data.name}</span>
                                        <span className="text-slate-500 ml-2 whitespace-nowrap">{data.count} ({data.percentage.toFixed(1)}%)</span>
                                    </div>
                                ))}
                                 {pieChartData.length > 8 && <p className="text-xs text-slate-400 text-center pt-2">...and {pieChartData.length - 8} more.</p>}
                            </div>
                        </div>
                    ) : (
                         <p className="text-slate-500 text-center py-16">No session data available to display chart.</p>
                    )}
                </div>
                <div className="lg:col-span-2 bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-slate-200">
                    <h3 className="text-lg font-semibold mb-4 text-slate-800">Student Leaderboard</h3>
                     <ul className="space-y-4">
                        {analyticsData.leaderboard.length > 0 ? analyticsData.leaderboard.map(({ student, duration }) => (
                            <li key={student!.id} className="flex items-center space-x-3">
                                <img src={student!.avatarUrl} alt={student!.name} className="w-10 h-10 rounded-full" />
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-slate-800 text-sm truncate">{student!.name}</p>
                                    <p className="text-xs text-slate-500">{formatDuration(duration)}</p>
                                </div>
                            </li>
                        )) : <p className="text-slate-500 text-center py-4">No duration data available.</p>}
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default Analytics;