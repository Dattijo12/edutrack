import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { 
  Lock, 
  Unlock, 
  Calendar, 
  Clock, 
  Plus, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  Trash2, 
  ShieldCheck, 
  AlertCircle,
  Sparkles
} from 'lucide-react';
import resultWindowService from '../../services/resultWindowService';

/**
 * ResultWindowManagement Component
 * Super Admin dashboard interface for creating and toggling Time-Bound Result Windows.
 */
const ResultWindowManagement = () => {
  const [windows, setWindows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [togglingId, setTogglingId] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    academic_session: '2025/2026',
    term: '1st Term',
    is_open: true,
  });

  // Available sessions and terms presets
  const availableSessions = ['2024/2025', '2025/2026', '2026/2027', '2027/2028'];
  const availableTerms = ['1st Term', '2nd Term', '3rd Term'];

  useEffect(() => {
    fetchWindows();
  }, []);

  /**
   * Fetch all configured result windows from backend
   */
  const fetchWindows = async () => {
    setLoading(true);
    try {
      const data = await resultWindowService.getAll();
      const list = Array.isArray(data) ? data : (data?.data || []);
      setWindows(list);
    } catch (err) {
      console.error('Failed to load result windows:', err);
      toast.error('Could not load result windows history.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle creation form input changes
   */
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  /**
   * Submit new result window creation form
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await resultWindowService.create(formData);
      toast.success(res.message || 'Result window configured successfully!');
      fetchWindows();
    } catch (err) {
      console.error('Failed to create result window:', err);
      toast.error(err.response?.data?.message || 'Failed to save result window.');
    } finally {
      setSubmitting(false);
    }
  };

  /**
   * Toggle is_open status for a specific window record
   */
  const handleToggleStatus = async (id) => {
    setTogglingId(id);
    try {
      const res = await resultWindowService.toggle(id);
      const updatedWindow = res.data;
      
      toast.success(res.message || 'Result window status updated!');

      // Update local state instantly
      setWindows(prev => 
        prev.map(item => item.id === id ? { ...item, is_open: updatedWindow.is_open } : item)
      );
    } catch (err) {
      console.error('Failed to toggle result window:', err);
      toast.error(err.response?.data?.message || 'Failed to change result window status.');
    } finally {
      setTogglingId(null);
    }
  };

  /**
   * Delete a result window record
   */
  const handleDelete = async (id, session, term) => {
    if (!window.confirm(`Are you sure you want to delete the result window for ${term} (${session})?`)) {
      return;
    }

    try {
      await resultWindowService.delete(id);
      toast.success('Result window deleted successfully!');
      setWindows(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      console.error('Failed to delete window:', err);
      toast.error('Failed to delete result window.');
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-4 md:p-6 space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 md:p-8 rounded-3xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 border border-indigo-900/50">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/20 text-indigo-300 text-xs font-semibold rounded-full border border-indigo-500/30 mb-3">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" /> Super Admin Security Control
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight flex items-center gap-3">
            Time-Bound Result Windows
          </h1>
          <p className="text-slate-300 text-sm mt-2 max-w-2xl leading-relaxed">
            Manage academic term result submission & approval windows. When a window is <strong>Closed</strong>, teachers cannot submit marks and Exam Officers cannot approve grades.
          </p>
        </div>

        <button
          onClick={fetchWindows}
          disabled={loading}
          className="self-start md:self-auto flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white text-sm font-medium rounded-xl border border-white/20 backdrop-blur-md transition-all shadow-sm"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh List
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Creation Form Card */}
        <div className="lg:col-span-1 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 h-fit space-y-5">
          <div className="flex items-center gap-2.5 pb-4 border-b border-slate-200 dark:border-slate-700">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-lg">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Configure Window</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Open or schedule a term result window</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Academic Session */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Academic Session
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <select
                  name="academic_session"
                  value={formData.academic_session}
                  onChange={handleChange}
                  className="w-full pl-9 pr-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  required
                >
                  {availableSessions.map(session => (
                    <option key={session} value={session}>{session}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Term */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Academic Term
              </label>
              <div className="relative">
                <Clock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <select
                  name="term"
                  value={formData.term}
                  onChange={handleChange}
                  className="w-full pl-9 pr-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  required
                >
                  {availableTerms.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Initial Window State */}
            <div className="pt-2">
              <label className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100/80 transition-colors">
                <input
                  type="checkbox"
                  name="is_open"
                  checked={formData.is_open}
                  onChange={handleChange}
                  className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                />
                <div className="text-xs">
                  <span className="font-semibold text-slate-900 dark:text-white block">
                    Immediately Open Window
                  </span>
                  <span className="text-slate-500 dark:text-slate-400">
                    Allows immediate result submission & approval
                  </span>
                </div>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 px-4 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-xl shadow-md shadow-indigo-200 dark:shadow-none transition-all flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Saving Window...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Create / Open Result Window
                </>
              )}
            </button>
          </form>
        </div>

        {/* Management Table Card */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col justify-between">
          <div>
            {/* Table Title Bar */}
            <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Active & Past Windows</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Toggle switch to open or close access in real-time
                </p>
              </div>

              <span className="text-xs font-semibold px-3 py-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-full">
                Total: {windows.length}
              </span>
            </div>

            {/* Table Content */}
            {loading ? (
              <div className="py-16 text-center text-slate-500 dark:text-slate-400">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto text-indigo-600 mb-3" />
                <p className="text-sm font-medium">Loading result windows...</p>
              </div>
            ) : windows.length === 0 ? (
              <div className="py-16 text-center text-slate-500 dark:text-slate-400 space-y-3">
                <AlertCircle className="w-12 h-12 mx-auto text-slate-400 opacity-60" />
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">No Result Windows Found</h3>
                <p className="text-xs max-w-sm mx-auto">
                  Create a result window using the form on the left to control academic result submissions.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                      <th className="py-3.5 px-5">Session</th>
                      <th className="py-3.5 px-5">Term</th>
                      <th className="py-3.5 px-5 text-center">Status Badge</th>
                      <th className="py-3.5 px-5 text-center">Access Toggle</th>
                      <th className="py-3.5 px-5 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700 text-sm text-slate-800 dark:text-slate-200">
                    {windows.map((win) => {
                      const isToggling = togglingId === win.id;

                      return (
                        <tr key={win.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-700/40 transition-colors">
                          {/* Session */}
                          <td className="py-4 px-5 font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-indigo-500" />
                            {win.academic_session}
                          </td>

                          {/* Term */}
                          <td className="py-4 px-5 font-medium text-slate-700 dark:text-slate-300">
                            {win.term}
                          </td>

                          {/* Status Badge */}
                          <td className="py-4 px-5 text-center">
                            {win.is_open ? (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 rounded-full">
                                <Unlock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                OPEN
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-300 dark:border-rose-800 rounded-full">
                                <Lock className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                                CLOSED
                              </span>
                            )}
                          </td>

                          {/* Access Toggle Switch */}
                          <td className="py-4 px-5 text-center">
                            <button
                              onClick={() => handleToggleStatus(win.id)}
                              disabled={isToggling}
                              className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none ${
                                win.is_open ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'
                              } ${isToggling ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                              title={win.is_open ? 'Click to Close Window' : 'Click to Open Window'}
                            >
                              <span
                                className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${
                                  win.is_open ? 'translate-x-6' : 'translate-x-1'
                                }`}
                              />
                            </button>
                          </td>

                          {/* Action Delete */}
                          <td className="py-4 px-5 text-center">
                            <button
                              onClick={() => handleDelete(win.id, win.academic_session, win.term)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors"
                              title="Delete Record"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Footer Note */}
          <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500 flex-shrink-0" />
            Changes take effect immediately across all teacher and exam officer portals.
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultWindowManagement;
