import { useCallback, useEffect, useState } from 'react';
import { listMyStudents } from '@/services/personalStudentsApi';
import type { LinkedStudent } from '@/types/personal-area';

export function usePersonalStudents(accessToken: string | null) {
  const [students, setStudents] = useState<LinkedStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!accessToken) {
      setStudents([]);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await listMyStudents(accessToken);
      setStudents(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar alunos');
      setStudents([]);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    void load();
  }, [load]);

  return { students, loading, error, reload: load };
}
