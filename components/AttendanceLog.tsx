import React, { useState, useEffect, useMemo } from 'react';
import { AttendanceRecord, AttendanceStatus } from '../types';

interface AttendanceLogProps {
  records: AttendanceRecord[];
  isFiltered: boolean;
}

const AttendanceLog: React.FC<AttendanceLogProps> = ({ records, isFiltered }) => {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const calculateDuration = (startTime: Date): string => {
    const totalSeconds = Math.floor((now.getTime() - startTime.getTime()) / 1000);
    if (totalSeconds < 0) return '00:00:00';
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return [hours, minutes, seconds]
      .map(v => v.toString().padStart(2, '0'))
      .join(':');
  };
  
  const studentCurrentStatus = useMemo(() => {
    const statusMap = new Map<string, AttendanceStatus>();
    [...records].sort((a,b) => b.timestamp.getTime() - a.timestamp.getTime()).forEach(record => {
      if (!statusMap.has(record.studentId)) {
        statusMap.set(record.studentId, record.status);
      }
    });
    return statusMap;
  }, [records]);


  const StatusBadge: React.FC<{ status: AttendanceStatus }> = ({ status }) => {
    const isTimedIn = status === AttendanceStatus.TimedIn;
    const classes = isTimedIn
      ? 'bg-green-100 text-green-800'
      : 'bg-slate-100 text-slate-800';
    return (
      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${classes}`}>
        {status}
      </span>
    );
  };

  if (records.length === 0) {
    return (
      <div className="flex-grow flex items-center justify-center bg-white rounded-lg p-8 border border-slate-200">
        <div className="text-center">
          <p className="text-slate-700 text-lg">{isFiltered ? "No records match your search." : "No attendance records yet."}</p>
          <p className="text-slate-500 mt-2 text-sm">{isFiltered ? "Try a different search or filter." : "Scan a QR code or use manual entry to begin."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-grow overflow-y-auto -mr-2 pr-2">
      <div className="space-y-3">
        {records.map((record, index) => {
          const isCurrentlyTimedIn = studentCurrentStatus.get(record.studentId) === AttendanceStatus.TimedIn;
          const showDuration = record.status === AttendanceStatus.TimedIn && isCurrentlyTimedIn;
          
          return (
            <div key={`${record.studentId}-${record.timestamp.toISOString()}-${index}`} className="bg-white shadow-sm border border-slate-200 p-3 sm:p-4 rounded-lg flex flex-wrap items-center space-x-4 animate-fade-in">
              <img src={record.studentAvatarUrl} alt={record.studentName} className="w-10 h-10 sm:w-12 sm:h-12 rounded-full" />
              <div className="flex-grow min-w-0">
                <p className="font-semibold text-slate-800 truncate">{record.studentName}</p>
                <p className="text-sm text-slate-500">{record.studentId}</p>
                <p className="text-xs text-slate-400 mt-1 hidden sm:block">{`${record.studentCourse} | Year ${record.studentYear} - Block ${record.studentBlock}`}</p>
              </div>
              <div className="text-right flex-shrink-0 w-full sm:w-auto mt-2 sm:mt-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 flex justify-end items-center space-x-4">
                <StatusBadge status={record.status} />
                {showDuration ? (
                  <p className="text-xs text-slate-500 font-mono w-20" title="Duration">
                    {calculateDuration(record.timestamp)}
                  </p>
                ) : (
                  <p className="text-xs text-slate-500 w-20" title="Timestamp">
                    {record.timestamp.toLocaleTimeString()}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AttendanceLog;