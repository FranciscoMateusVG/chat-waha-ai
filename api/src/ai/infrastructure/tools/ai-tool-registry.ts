import { Injectable } from '@nestjs/common'
import { tool } from 'ai'
import { ListKnowledgeTypesUseCase } from 'src/knowledge/application/use-cases/list-knowledge-types.use-case'
import { ListTopicsUseCase } from 'src/knowledge/application/use-cases/list-topics.use-case'
import { BatchRetrieveKnowledgeUseCase } from 'src/knowledge/application/use-cases/batch-retrieve-knowledge.use-case'
import { SearchKnowledgeUseCase } from 'src/knowledge/application/use-cases/search-knowledge.use-case'
import { z } from 'zod'

@Injectable()
export class AiToolRegistry {
  constructor(
    private readonly listKnowledgeTypesUseCase: ListKnowledgeTypesUseCase,
    private readonly listTopicsUseCase: ListTopicsUseCase,
    private readonly batchRetrieveKnowledgeUseCase: BatchRetrieveKnowledgeUseCase,
    private readonly searchKnowledgeUseCase: SearchKnowledgeUseCase
  ) {}

  getTools(userId: string) {
    return {
      listKnowledgeTypes: this.createListKnowledgeTypesTool(userId),
      listTopicsInType: this.createListTopicsInTypeTool(userId),
      getMultipleKnowledgeContents: this.createGetMultipleKnowledgeContentsTool(userId),
      searchKnowledge: this.createSearchKnowledgeTool(userId)
    }
  }

  private createListKnowledgeTypesTool(userId: string) {
    return tool({
      description:
        'Obtém todas as categorias/tipos de conhecimento disponíveis no sistema. VOCÊ DEVE SEMPRE CHAMAR ISSO PRIMEIRO para descobrir quais tipos de informação estão disponíveis. Esta é a primeira etapa obrigatória do fluxo de descoberta.',
      parameters: z.object({}),
      execute: async () => {
        const result = await this.listKnowledgeTypesUseCase.execute({ userId })

        console.log('result', result)

        if (!result.success || !result.types || result.types.length === 0) {
          return 'Nenhum tipo de conhecimento encontrado no sistema. A base de conhecimento pode estar vazia.'
        }

        return `Tipos de conhecimento disponíveis: ${result.types.join(', ')}`
      }
    })
  }

  private createListTopicsInTypeTool(userId: string) {
    return tool({
      description:
        'Obtém TODOS os tópicos dentro de um tipo de conhecimento específico. VOCÊ DEVE CHAMAR ISSO para cada tipo relevante para ver TODOS os tópicos disponíveis. Depois de ver todos os tópicos, você deve escolher quais são relevantes para a pergunta do usuário. Esta é a segunda etapa obrigatória do fluxo.',
      parameters: z.object({
        type: z
          .string()
          .describe(
            'O tipo de conhecimento a explorar (ex: "Informações sobre Produtos", "Suporte ao Cliente")'
          )
      }),
      execute: async ({ type }) => {
        const result = await this.listTopicsUseCase.execute({ userId, type })

        console.log('result', result)

        if (!result.success || !result.topics || result.topics.length === 0) {
          return `Nenhum tópico encontrado no tipo de conhecimento: "${type}". O tipo pode não existir ou não tem tópicos ainda.`
        }

        return `Tópicos em "${type}":\n${result.topics.map((topic, index) => `${index + 1}. ${topic}`).join('\n')}`
      }
    })
  }

  private createGetMultipleKnowledgeContentsTool(userId: string) {
    return tool({
      description:
        'Recupera o conteúdo de MÚLTIPLOS tópicos de uma vez. VOCÊ DEVE USAR ISSO depois de ver todos os tópicos disponíveis e identificar quais são relevantes para a pergunta. Passe um array com os nomes EXATOS dos tópicos que você viu na listagem anterior. Esta é a terceira etapa final do fluxo.',
      parameters: z.object({
        topics: z
          .array(z.string())
          .describe(
            'Array com os nomes exatos dos tópicos a recuperar (ex: ["Datas de Matrícula", "Processo Seletivo"])'
          )
      }),
      execute: async ({ topics }) => {
        const result = await this.batchRetrieveKnowledgeUseCase.execute({ userId, topics })

        console.log('result', result)

        if (!result.success) {
          return `Erro ao recuperar conteúdos: ${result.error}`
        }

        if (result.knowledge.length === 0) {
          return `Nenhum conteúdo encontrado para os tópicos: ${topics.join(', ')}`
        }

        let response = `Encontrados ${result.knowledge.length} conteúdos:\n\n`

        result.knowledge.forEach((entry) => {
          response += `## ${entry.type} → ${entry.topic}\n\n${entry.content}\n\n---\n\n`
        })

        if (result.notFound.length > 0) {
          response += `⚠️ Tópicos não encontrados: ${result.notFound.join(', ')}`
        }

        return response
      }
    })
  }

  private createSearchKnowledgeTool(userId: string) {
    return tool({
      description:
        '⚠️ FERRAMENTA DE FALLBACK - Use APENAS se o fluxo normal falhar completamente. NÃO USE ESTA FERRAMENTA em circunstâncias normais. Sempre prefira: 1) listKnowledgeTypes, 2) listTopicsInType, 3) getMultipleKnowledgeContents. Esta ferramenta faz busca textual genérica e deve ser evitada.',
      parameters: z.object({
        query: z
          .string()
          .describe(
            'Consulta de busca ou palavras-chave para encontrar conhecimento relevante'
          )
      }),
      execute: async ({ query }) => {
        const result = await this.searchKnowledgeUseCase.execute({ userId, query })

        console.log('result', result)

        if (
          !result.success ||
          !result.knowledge ||
          result.knowledge.length === 0
        ) {
          return `Nenhum resultado encontrado para a consulta: "${query}". Tente palavras-chave diferentes ou verifique se a informação existe na base de conhecimento.`
        }

        // Format results with type/topic context
        const formattedResults = result.knowledge
          .map((k) => `[${k.type} → ${k.topic}]\n${k.content}`)
          .join('\n\n---\n\n')

        return `Encontrados ${result.knowledge.length} resultado(s) para "${query}":\n\n${formattedResults}`
      }
    })
  }
}
