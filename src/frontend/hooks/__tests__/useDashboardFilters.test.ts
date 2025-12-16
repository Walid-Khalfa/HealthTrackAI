import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useDashboardFilters } from '@frontend/hooks/useDashboardFilters';
import type { HealthReport } from '@shared/types';

const makeReport = (partial: Partial<HealthReport>): HealthReport => ({
  id: partial.id ?? 'id',
  user_id: partial.user_id ?? 'user',
  created_at: partial.created_at ?? new Date(0).toISOString(),
  input_text: partial.input_text ?? '',
  input_summary: partial.input_summary,
  input_type: partial.input_type ?? 'text',
  custom_title: partial.custom_title,
  user_notes: partial.user_notes,
  concern_override: partial.concern_override,
  has_images: partial.has_images ?? false,
  has_documents: partial.has_documents ?? false,
  has_audio: partial.has_audio ?? false,
  flagged: partial.flagged,
  ai_summary: partial.ai_summary ?? '',
  ai_details: partial.ai_details,
  ai_recommendations: partial.ai_recommendations,
  preliminary_concern: partial.preliminary_concern ?? 'Medium',
  status: partial.status ?? 'completed',
  meta: partial.meta ?? {},
});

describe('useDashboardFilters', () => {
  it('filters + paginates and resets pagination when filters change', async () => {
    const reports: HealthReport[] = [
      makeReport({
        id: 'r1',
        input_type: 'text',
        custom_title: 'Cough for two days',
        preliminary_concern: 'Low',
      }),
      makeReport({
        id: 'r2',
        input_type: 'image',
        ai_summary: 'Rash photo analysis',
        preliminary_concern: 'High',
      }),
      makeReport({
        id: 'r3',
        input_type: 'audio',
        user_notes: 'Recorded wheezing',
        concern_override: 'Medium',
      }),
    ];

    const { result } = renderHook(() => useDashboardFilters(reports, 1));

    expect(result.current.totalPages).toBe(3);
    expect(result.current.paginatedData.map(r => r.id)).toEqual(['r1']);

    act(() => {
      result.current.setCurrentPage(3);
    });

    expect(result.current.currentPage).toBe(3);
    expect(result.current.paginatedData.map(r => r.id)).toEqual(['r3']);

    act(() => {
      result.current.setSearchQuery('cough');
    });

    await waitFor(() => {
      expect(result.current.currentPage).toBe(1);
    });

    expect(result.current.filteredData.map(r => r.id)).toEqual(['r1']);
    expect(result.current.totalPages).toBe(1);

    act(() => {
      result.current.setSearchQuery('');
    });

    await waitFor(() => {
      expect(result.current.currentPage).toBe(1);
      expect(result.current.totalPages).toBe(3);
    });

    act(() => {
      result.current.setFilterType('Image');
    });

    await waitFor(() => {
      expect(result.current.currentPage).toBe(1);
    });

    expect(result.current.filteredData.map(r => r.id)).toEqual(['r2']);

    act(() => {
      result.current.setFilterConcern('High');
    });

    await waitFor(() => {
      expect(result.current.filteredData.map(r => r.id)).toEqual(['r2']);
    });
  });
});
