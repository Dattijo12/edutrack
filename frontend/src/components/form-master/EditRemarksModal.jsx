import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { 
  X, 
  Edit3, 
  Sparkles, 
  Save, 
  UserCheck, 
  Award, 
  MessageSquare, 
  RotateCcw,
  ShieldCheck
} from 'lucide-react';
import formMasterService from '../../services/formMasterService';

/**
 * EditRemarksModal Component
 * Role-based modal for updating student terminal conduct remarks.
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Controls modal visibility
 * @param {Function} props.onClose - Callback to close modal
 * @param {Object} props.studentData - Student information and initial remarks
 * @param {string} [props.userRole='form_master'] - Role of current user ('form_master' | 'super_admin')
 * @param {Function} [props.onSave] - Callback after saving updated remarks
 */
const EditRemarksModal = ({ isOpen, onClose, studentData, userRole = 'form_master', onSave }) => {
  const [formMasterRemark, setFormMasterRemark] = useState('');
  const [principalRemark, setPrincipalRemark] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync state whenever studentData or modal visibility changes
  useEffect(() => {
    if (studentData) {
      setFormMasterRemark(studentData.form_master_remark || '');
      setPrincipalRemark(studentData.principal_remark || '');
    }
  }, [studentData, isOpen]);

  if (!isOpen || !studentData) return null;

  const isSuperAdmin = userRole === 'super_admin' || userRole === 'admin';
  const studentName = studentData.student_name || `${studentData.first_name || ''} ${studentData.last_name || ''}`.trim() || 'Student';
  const admissionNo = studentData.admission_number || 'N/A';
  const className = studentData.class_name || studentData.class?.name || 'Class';
  const averagePercentage = studentData.average_percentage ?? studentData.average ?? 0;

  /**
   * Reset remark back to initial default
   */
  const handleResetToAuto = () => {
    if (isSuperAdmin) {
      setPrincipalRemark(studentData.principal_remark || 'Satisfactory progress. Keep pushing for excellence.');
    } else {
      setFormMasterRemark(studentData.auto_remark || studentData.form_master_remark || '');
    }
    toast.info('Reset remark to initial default.');
  };

  /**
   * Submit updated remarks back to backend server
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const payload = {
      student_id: studentData.student_id || studentData.id,
      class_id: studentData.class_id,
      term_id: studentData.term_id || 1,
      form_master_remark: formMasterRemark.trim(),
      principal_remark: principalRemark.trim(),
    };

    try {
      if (onSave) {
        await onSave(payload);
      } else {
        await formMasterService.updateRemarks(payload);
      }
      toast.success('Remarks updated successfully!');
      onClose();
    } catch (err) {
      console.error('Failed to update remarks:', err);
      toast.error(err.response?.data?.message || 'Failed to update remarks.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-opacity animate-in fade-in">
      <div 
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-2xl overflow-hidden transform transition-all animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${
              isSuperAdmin 
                ? 'bg-purple-100 dark:bg-purple-950/80 text-purple-600 dark:text-purple-400' 
                : 'bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400'
            }`}>
              {isSuperAdmin ? <ShieldCheck className="w-5 h-5" /> : <Edit3 className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                {isSuperAdmin ? "Principal's Endorsement & Remark" : "Form Master's Remark Override"}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {studentName} ({admissionNo}) • {className}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Score Average Badge */}
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs font-semibold rounded-full">
              <Award className="w-3.5 h-3.5" />
              Avg: {Number(averagePercentage).toFixed(1)}%
            </span>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Info Banner */}
          <div className="bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900 p-3.5 rounded-xl flex items-start gap-3 text-xs text-indigo-900 dark:text-indigo-200">
            <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold">Role-Based Remark Interface:</span> You are editing as <strong>{isSuperAdmin ? 'Super Admin / Principal' : 'Form Master'}</strong>. Initial auto-generated remarks were calculated from student's <strong>{Number(averagePercentage).toFixed(1)}%</strong> average.
            </div>
          </div>

          {/* SUPER ADMIN MODE: Read-Only Form Master Remark + Principal Editable Textarea */}
          {isSuperAdmin ? (
            <>
              {/* Form Master's Remark Read-Only Context Block */}
              <div className="space-y-1.5 bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="flex justify-between items-center text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <span className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400">
                    <UserCheck className="w-4 h-4" />
                    Form Master's Remark (Read-Only Context)
                  </span>
                  <span className="text-slate-400 font-normal">Context</span>
                </div>
                <p className="text-xs text-slate-800 dark:text-slate-200 italic leading-relaxed pt-1">
                  "{formMasterRemark || 'No Form Master remark recorded yet.'}"
                </p>
              </div>

              {/* Principal's Remark Input Field */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <label className="flex items-center gap-1.5">
                    <MessageSquare className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    Principal's Remark / Endorsement
                  </label>
                  <span className="text-slate-400 font-normal">
                    {principalRemark.length} chars
                  </span>
                </div>
                <textarea
                  rows={3}
                  value={principalRemark}
                  onChange={(e) => setPrincipalRemark(e.target.value)}
                  placeholder="Enter Principal's official terminal endorsement..."
                  className="w-full p-3 text-sm bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none transition-shadow"
                  required
                />
              </div>
            </>
          ) : (
            /* FORM MASTER MODE: Only Form Master Editable Field */
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs font-semibold text-slate-700 dark:text-slate-300">
                <label className="flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  Form Master's Remark
                </label>
                <span className="text-slate-400 font-normal">
                  {formMasterRemark.length} chars
                </span>
              </div>
              <textarea
                rows={4}
                value={formMasterRemark}
                onChange={(e) => setFormMasterRemark(e.target.value)}
                placeholder="Enter Form Master's conduct remark..."
                className="w-full p-3 text-sm bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-shadow"
                required
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex flex-col-reverse sm:flex-row items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleResetToAuto}
              className="w-full sm:w-auto px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-xl transition-colors flex items-center justify-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Remark
            </button>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 sm:flex-initial px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-xl transition-colors"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className={`flex-1 sm:flex-initial px-5 py-2 text-xs font-semibold text-white rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5 ${
                  isSuperAdmin
                    ? 'bg-purple-600 hover:bg-purple-700 active:bg-purple-800'
                    : 'bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    Save & Update Remarks
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditRemarksModal;
