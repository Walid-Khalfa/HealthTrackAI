import { useState, useMemo } from 'react';
import { HealthReport, HealthRiskLevel } from '../../shared/types';
import { updateReportDetails, deleteHealthReport } from '../../backend/services/supabaseClient';

interface UseReportModalProps {
  isOfflineMode: boolean;
  setReports: React.Dispatch<React.SetStateAction<HealthReport[]>>;
}

export const useReportModal = ({ isOfflineMode, setReports }: UseReportModalProps) => {
  const [selectedReport, setSelectedReport] = useState<HealthReport | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState(false);

  const [editTitle, setEditTitle] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editConcern, setEditConcern] = useState<HealthRiskLevel>('Medium');
  const [isSaving, setIsSaving] = useState(false);

  const handleOpenReport = (report: HealthReport) => {
    setSelectedReport(report);
    setIsEditMode(false);
    setDeleteConfirmation(false);
    setEditTitle(report.custom_title || '');
    setEditNotes(report.user_notes || '');
    setEditConcern(report.concern_override || report.preliminary_concern || 'Medium');
  };

  const handleCloseModal = () => {
    setSelectedReport(null);
    setIsEditMode(false);
    setDeleteConfirmation(false);
  };

  const handleSaveChanges = async () => {
    if (!selectedReport) return;
    
    if (isOfflineMode) {
      alert("You cannot edit reports while offline.");
      return;
    }

    setIsSaving(true);
    try {
      await updateReportDetails(selectedReport.id, {
        custom_title: editTitle,
        user_notes: editNotes,
        concern_override: editConcern
      });
      const updatedReport = { ...selectedReport, custom_title: editTitle, user_notes: editNotes, concern_override: editConcern };
      setReports(prev => prev.map(r => r.id === selectedReport.id ? updatedReport : r));
      setSelectedReport(updatedReport);
      setIsEditMode(false);
    } catch (err) { alert("Failed to save changes."); } finally { setIsSaving(false); }
  };

  const handleDelete = async () => {
    if (!selectedReport) return;

    if (isOfflineMode) {
      alert("You cannot delete reports while offline.");
      return;
    }

    setIsDeleting(true);
    try {
      await deleteHealthReport(selectedReport.id);
      setReports(prev => prev.filter(r => r.id !== selectedReport.id));
      handleCloseModal();
    } catch (err) { alert("Failed to delete report."); } finally { setIsDeleting(false); }
  };

  return {
    selectedReport,
    isEditMode, setIsEditMode,
    isDeleting,
    deleteConfirmation, setDeleteConfirmation,
    editTitle, setEditTitle,
    editNotes, setEditNotes,
    editConcern, setEditConcern,
    isSaving,
    handleOpenReport,
    handleCloseModal,
    handleSaveChanges,
    handleDelete,
  };
};