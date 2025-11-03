import React, { useEffect, useRef } from 'react';
import { XMarkIcon } from './icons';

declare var Html5Qrcode: any;

interface ScannerModalProps {
  onScanSuccess: (decodedText: string) => void;
  onClose: () => void;
}

const ScannerModal: React.FC<ScannerModalProps> = ({ onScanSuccess, onClose }) => {
  const scannerRef = useRef<any>(null);

  useEffect(() => {
    scannerRef.current = new Html5Qrcode("reader");

    const qrCodeSuccessCallback = (decodedText: string, decodedResult: any) => {
      onScanSuccess(decodedText);
    };
    
    const config = { fps: 10, qrbox: { width: 250, height: 250 }, supportedScanTypes: [] };

    scannerRef.current.start({ facingMode: "environment" }, config, qrCodeSuccessCallback, undefined)
      .catch((err: any) => {
        console.error("Unable to start scanning.", err);
      });

    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch((err: any) => {
          console.error("Failed to stop the scanner.", err);
        });
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-slate-400 hover:text-slate-600"
        >
          <XMarkIcon className="w-8 h-8" />
        </button>
        <h2 className="text-2xl font-bold mb-4 text-center text-slate-800">Scan Student ID</h2>
        <div id="reader" className="w-full rounded-lg overflow-hidden border-2 border-slate-200"></div>
        <p className="text-center text-slate-500 mt-4 text-sm">Point the camera at the QR code or barcode.</p>
      </div>
    </div>
  );
};

export default ScannerModal;