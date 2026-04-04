import { useCallback, useEffect, useState } from 'react';
import {
  listMyStudents,
  listStudentAssessments,
  listStudentMedia,
} from '@/services/personalStudentsApi';
import type { MediaFileRecord } from '@/types/media';
import type { LinkedStudent, StudentAssessmentDetail } from '@/types/personal-area';

type State = {
  media: MediaFileRecord[];
  assessments: StudentAssessmentDetail[];
  student: LinkedStudent | null;
  loading: boolean;
  error: string | null;
};

export function useStudentDetail(accessToken: string | null, studentId: string | undefined) {
  const [state, setState] = useState<State>({
    media: [],
    assessments: [],
    student: null,
    loading: true,
    error: null,
  });

  const load = useCallback(async () => {
    if (!accessToken || !studentId) {
      setState({
        media: [],
        assessments: [],
        student: null,
        loading: false,
        error: null,
      });
      return;
    }
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const [media, assessments, students] = await Promise.all([
        listStudentMedia(accessToken, studentId),
        listStudentAssessments(accessToken, studentId),
        listMyStudents(accessToken),
      ]);
      const student = students.find((s) => s.id === studentId) ?? null;
      setState({ media, assessments, student, loading: false, error: null });
    } catch (e: unknown) {
      setState({
        media: [],
        assessments: [],
        student: null,
        loading: false,
        error: e instanceof Error ? e.message : 'Erro ao carregar dados do aluno',
      });
    }
  }, [accessToken, studentId]);

  useEffect(() => {
    void load();
  }, [load]);

  return { ...state, reload: load };
}
