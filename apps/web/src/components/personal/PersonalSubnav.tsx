import Link from 'next/link';

/** Links comuns do dashboard do personal (dark theme herdado do layout). */
export function PersonalSubnav() {
  return (
    <>
      <Link href="/dashboard/personal">Dashboard</Link>
      <Link href="/dashboard/personal/treinos">Treinos</Link>
      <Link href="/dashboard/personal/alunos">Alunos</Link>
      <Link href="/dashboard/personal/exercicio-midia">Mídia exercícios</Link>
      <Link href="/dashboard/personal/ia-treino">IA · Treino</Link>
      <Link href="/dashboard/personal/conta">Conta</Link>
    </>
  );
}
