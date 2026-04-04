import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const TEST_USERS = [
  { email: 'personal@ironbody.app', password: 'senha123', name: 'Personal Teste', role: 'PERSONAL_PROFESSOR' as const },
  { email: 'aluno@ironbody.app', password: 'senha123', name: 'Aluno Teste', role: 'ALUNO' as const },
  { email: 'aluno2@ironbody.app', password: 'senha123', name: 'Aluno Dois', role: 'ALUNO' as const },
];

const sportsData = [
  { nome: 'Musculação', descricao: 'Treino de força e hipertrofia' },
  { nome: 'Crossfit', descricao: 'CrossFit e condicionamento' },
  { nome: 'Crosstraining', descricao: 'Treino cruzado' },
  { nome: 'Funcional', descricao: 'Treinamento funcional' },
  { nome: 'Corrida', descricao: 'Corrida e running' },
  { nome: 'Hyrox', descricao: 'Hyrox e provas híbridas' },
  { nome: 'Calistenia', descricao: 'Treino com peso do corpo' },
];

const categoriesBySport: Record<string, string[]> = {
  Musculação: ['ABC', 'ABCD', 'ABCDE', 'Full Body', 'Upper Lower', 'Push Pull Legs'],
  Crossfit: ['EMOM', 'AMRAP', 'FOR TIME', 'CHIPPER', 'TABATA'],
  Corrida: ['Longão', 'Tiros', 'Sprint', 'Intervalado', 'Rodagem'],
  Calistenia: ['Push', 'Pull', 'Legs', 'Full Body'],
  Crosstraining: ['EMOM', 'AMRAP', 'FOR TIME', 'CHIPPER', 'TABATA', 'INTERVALADO'],
  Funcional: ['Circuito', 'Resistência', 'Emagrecimento', 'Mobilidade'],
  Hyrox: ['Simulação Hyrox', 'Corrida + Exercícios', 'Strength Hyrox', 'Conditioning Hyrox'],
};

const exercisesBySport: Record<string, { nome: string; tipo: string }[]> = {
  Musculação: [
    { nome: 'Supino reto', tipo: 'REPETICOES' },
    { nome: 'Agachamento', tipo: 'REPETICOES' },
    { nome: 'Leg press', tipo: 'REPETICOES' },
    { nome: 'Rosca direta', tipo: 'REPETICOES' },
    { nome: 'Triceps pulley', tipo: 'REPETICOES' },
    { nome: 'Puxada frente', tipo: 'REPETICOES' },
  ],
  Crossfit: [
    { nome: 'Thruster', tipo: 'REPETICOES' },
    { nome: 'Wall Ball', tipo: 'REPETICOES' },
    { nome: 'Burpee', tipo: 'REPETICOES' },
    { nome: 'Double Under', tipo: 'REPETICOES' },
  ],
  Corrida: [
    { nome: 'Corrida 5km', tipo: 'DISTANCIA' },
    { nome: 'Sprint 100m', tipo: 'DISTANCIA' },
    { nome: 'Tiros 400m', tipo: 'DISTANCIA' },
  ],
  Hyrox: [
    { nome: 'Farmers Carry', tipo: 'DISTANCIA' },
    { nome: 'Sled Push', tipo: 'DISTANCIA' },
    { nome: 'Sled Pull', tipo: 'DISTANCIA' },
  ],
  Calistenia: [
    { nome: 'Barra fixa', tipo: 'REPETICOES' },
    { nome: 'Flexão', tipo: 'REPETICOES' },
    { nome: 'Agachamento livre', tipo: 'REPETICOES' },
    { nome: 'Dips', tipo: 'REPETICOES' },
  ],
};

async function main() {
  console.log('Seeding sports...');
  for (const s of sportsData) {
    const existing = await prisma.sport.findFirst({ where: { nome: s.nome } });
    if (!existing) await prisma.sport.create({ data: s });
  }
  const sports = await prisma.sport.findMany();
  const sportMap = Object.fromEntries(sports.map((sp) => [sp.nome, sp.id]));

  console.log('Seeding categories...');
  for (const [sportName, categories] of Object.entries(categoriesBySport)) {
    const sportId = sportMap[sportName];
    if (!sportId) continue;
    for (const cat of categories) {
      const exists = await prisma.sportCategory.findFirst({
        where: { sportId, nome: cat },
      });
      if (!exists) await prisma.sportCategory.create({ data: { sportId, nome: cat } });
    }
  }

  const exerciseTypeMap: Record<string, 'REPETICOES' | 'TEMPO' | 'DISTANCIA' | 'CALORIAS' | 'PESO' | 'ROUND'> = {
    REPETICOES: 'REPETICOES',
    TEMPO: 'TEMPO',
    DISTANCIA: 'DISTANCIA',
    CALORIAS: 'CALORIAS',
    PESO: 'PESO',
    ROUND: 'ROUND',
  };

  console.log('Seeding exercises...');
  for (const [sportName, exercises] of Object.entries(exercisesBySport)) {
    const sportId = sportMap[sportName];
    if (!sportId) continue;
    for (const ex of exercises) {
      const exists = await prisma.exercise.findFirst({
        where: { sportId, nome: ex.nome },
      });
      if (!exists)
        await prisma.exercise.create({
          data: {
            sportId,
            nome: ex.nome,
            tipoExercicio: exerciseTypeMap[ex.tipo] || 'REPETICOES',
          },
        });
    }
  }

  console.log('Seeding test users...');
  for (const u of TEST_USERS) {
    let user = await prisma.user.findUnique({ where: { email: u.email } });
    if (!user) {
      const hash = await bcrypt.hash(u.password, 10);
      user = await prisma.user.create({
        data: {
          email: u.email,
          password: hash,
          name: u.name,
          role: u.role,
          plan: 'FREE',
        },
      });
      if (u.role === 'PERSONAL_PROFESSOR') {
        await prisma.profilePersonal.create({ data: { userId: user.id } });
      }
      if (u.role === 'ALUNO') {
        await prisma.profileStudent.create({ data: { userId: user.id } });
      }
      console.log(`  Created: ${u.email} (${u.role})`);
    } else {
      console.log(`  Exists: ${u.email} (perfil/links seguem abaixo)`);
    }
  }

  console.log('Seeding personal ↔ aluno (StudentPersonalLink)...');
  const personal = await prisma.user.findUnique({ where: { email: 'personal@ironbody.app' } });
  if (personal) {
    for (const email of ['aluno@ironbody.app', 'aluno2@ironbody.app']) {
      const student = await prisma.user.findUnique({ where: { email } });
      if (!student) continue;
      await prisma.studentPersonalLink.upsert({
        where: {
          personalId_studentId: { personalId: personal.id, studentId: student.id },
        },
        create: { personalId: personal.id, studentId: student.id },
        update: {},
      });
      console.log(`  Link: personal@ironbody.app ↔ ${email}`);
    }
  } else {
    console.log('  (skip links: personal@ironbody.app não encontrado)');
  }

  console.log('Seed completed.');
  console.log(
    'Login dev: personal@ironbody.app | aluno@ironbody.app | aluno2@ironbody.app · senha: senha123',
  );
  console.log('Área personal API: ver docs/PERSONAL-AREA-API.md na raiz do monorepo.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
