import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ShieldCheck, Award, AlertCircle, Calendar, Building2, User } from 'lucide-react';
import { certificateApi } from '../lib/api';

export const CertificateVerify: React.FC = () => {
  const { certificateId } = useParams<{ certificateId: string }>();

  const [cert, setCert] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (certificateId) {
      verifyCert();
    }
  }, [certificateId]);

  const verifyCert = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      if (!certificateId) return;
      const res = await certificateApi.verifyCertificate(certificateId);
      setCert(res.data);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || 'Certificate not found or invalid.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[85vh] flex items-center justify-center p-4">
        <div className="glass-panel p-8 rounded-2xl text-xs text-slate-400">
          Verifying certificate authenticity...
        </div>
      </div>
    );
  }

  if (errorMsg || !cert || !cert.is_valid) {
    return (
      <div className="min-h-[85vh] flex items-center justify-center p-4">
        <div className="glass-panel p-8 rounded-3xl max-w-md text-center space-y-4 border border-rose-800">
          <AlertCircle className="w-10 h-10 text-rose-400 mx-auto" />
          <h2 className="text-lg font-bold text-white">Invalid Certificate</h2>
          <p className="text-xs text-slate-400">{errorMsg || 'This certificate ID could not be verified.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-2xl glass-panel p-8 sm:p-12 rounded-3xl border border-indigo-500/40 space-y-8 shadow-2xl relative overflow-hidden">
        
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header Badge */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
              <Award className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Official Verified Certificate
                </span>
              </div>
              <h1 className="text-xl font-extrabold text-white">Certificate of Participation</h1>
            </div>
          </div>

          <span className="font-mono text-xs text-cyan-400 font-bold bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl">
            {cert.certificate_id}
          </span>
        </div>

        {/* Certificate Details */}
        <div className="space-y-6 text-slate-200">
          <p className="text-sm text-slate-300">
            This certifies that <strong className="text-white text-base">{cert.recipient_name}</strong> from{' '}
            <strong className="text-white">{cert.recipient_college}</strong> has successfully attended and completed:
          </p>

          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
            <h2 className="text-lg font-bold text-cyan-300">{cert.event_name}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-400 pt-2 border-t border-slate-800">
              <div className="flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Date: {cert.event_date}</span>
              </div>
              <div className="flex items-center gap-2">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                <span>Issued by: {cert.issuing_organization}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div>Verified via EventFlow AI Protocol</div>
          <div>Generated on: {new Date(cert.generated_at).toLocaleDateString()}</div>
        </div>

      </div>
    </div>
  );
};
