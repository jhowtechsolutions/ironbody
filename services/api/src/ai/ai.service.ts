import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import OpenAI from 'openai';
import { GenerateWorkoutDto } from './dto/generate-workout.dto';

@Injectable()
export class AiService {
  private openai: OpenAI | null = null;

  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
  ) {
    const apiKey = this.config.get('OPENAI_API_KEY');
    if (apiKey) this.openai = new OpenAI({ apiKey });
  }

  async generateWorkout(dto: GenerateWorkoutDto, userId?: string) {
    if (!this.openai) {
      throw new BadRequestException(
        'Serviço de IA não configurado. Defina OPENAI_API_KEY no ambiente.',
      );
    }

    const model = this.config.get('OPENAI_MODEL') || 'gpt-4o-mini';
    const equipamentos = dto.equipamentos?.length ? dto.equipamentos.join(', ') : 'academia padrão';
    const restricoes = dto.restricoes ? ` Restrições: ${dto.restricoes}.` : '';

    const prompt = `Você é um preparador físico. Crie um treino estruturado com base nos parâmetros abaixo.

Modalidade: ${dto.modalidade}
Categoria: ${dto.categoria}
Objetivo: ${dto.objetivo}
Nível: ${dto.nivel || 'intermediário'}
Dias por semana considerados: ${dto.diasSemana ?? 3}
Equipamentos: ${equipamentos}.${restricoes}

Retorne APENAS um JSON válido, sem texto antes ou depois, no formato:
{
  "nome": "nome do treino",
  "objetivo": "objetivo resumido",
  "exercicios": [
    {
      "nome": "nome do exercício",
      "series": número de séries,
      "repeticoes": "número ou intervalo (ex: 8-12 ou 30s)",
      "descanso_segundos": número opcional,
      "observacao": "opcional"
    }
  ],
  "observacoes_gerais": "texto opcional"
}

Se for treino de corrida ou tempo, use repeticoes em formato de tempo (ex: "5 min", "1 km"). Mantenha o JSON válido e escapado.`;

    try {
      const completion = await this.openai.chat.completions.create({
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
      });
      const content = completion.choices[0]?.message?.content?.trim() || '';

      // Log para auditoria (opcional)
      if (userId) {
        await this.prisma.aiLog.create({
          data: {
            userId,
            endpoint: '/ai/workout/generate',
            prompt,
            response: content.substring(0, 5000),
            model,
          },
        }).catch(() => {});
      }

      // Tentar parsear JSON (pode vir com markdown code block)
      let jsonStr = content;
      const match = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (match) jsonStr = match[1].trim();
      const parsed = JSON.parse(jsonStr) as {
        nome?: string;
        objetivo?: string;
        exercicios?: Array<{ nome: string; series?: number; repeticoes?: string; descanso_segundos?: number; observacao?: string }>;
        observacoes_gerais?: string;
      };

      return {
        ...parsed,
        _raw: content,
      };
    } catch (e: any) {
      if (e?.message?.includes('JSON')) {
        return { erro: 'Resposta da IA em formato inválido.', _raw: e?.message };
      }
      throw new BadRequestException(e?.message || 'Erro ao gerar treino com IA.');
    }
  }

  /** Stub para rota protegida Aluno Premium (análise de foto de refeição). */
  async mealPhotoPlaceholder(userId: string) {
    return {
      message: 'Endpoint em construção — requer Aluno Premium.',
      userId,
    };
  }
}
