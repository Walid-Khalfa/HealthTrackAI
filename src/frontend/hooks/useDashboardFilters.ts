import { useState, useEffect, useMemo } from 'react';
import { HealthReport } from '../../shared/types';

export const useDashboardFilters = (reports: HealthReport[], itemsPerPage: number) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('All Types');
  const [filterConcern, setFilterConcern] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);

  // --- Filtering Logic ---
  const filteredData = useMemo(() => {
    return reports.filter(item => {
      const matchesSearch = (item.custom_title || item.input_summary || item.user_notes || item.ai_summary || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = filterType === 'All Types' || item.input_type.toLowerCase().includes(filterType.toLowerCase().replace('all types', ''));
      const currentRisk = item.concern_override || item.preliminary_concern || 'Medium';
      const matchesConcern = filterConcern === 'All' || currentRisk === filterConcern;
      return matchesSearch && matchesType && matchesConcern;
    });
  }, [reports, searchQuery, filterType, filterConcern]);

  // Reset pagination when filters change
  useEffect(() => { setCurrentPage(1); }, [searchQuery, filterType, filterConcern]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return {
    searchQuery, setSearchQuery,
    filterType, setFilterType,
    filterConcern, setFilterConcern,
    currentPage, setCurrentPage,
    totalPages, paginatedData,
    filteredData, // Provide filteredData for stats if needed
  };
};