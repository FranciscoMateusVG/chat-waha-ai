import { Module } from '@nestjs/common'

// Application Layer
import {
  BatchRetrieveKnowledgeUseCase,
  DeleteKnowledgeUseCase,
  DeleteSystemPromptUseCase,
  GetSystemPromptUseCase,
  ListAllKnowledgeUseCase,
  ListKnowledgeTypesUseCase,
  ListTopicsUseCase,
  RetrieveKnowledgeUseCase,
  SaveSystemPromptUseCase,
  SearchKnowledgeUseCase,
  StoreKnowledgeUseCase
} from './application/use-cases'

// Infrastructure Layer
import { PrismaKnowledgeRepository } from './infrastructure/prisma/knowledge.repository'
import { PrismaSystemPromptRepository } from './infrastructure/prisma/system-prompt.repository'

// Presentation Layer
import { KnowledgeController } from './presentation/controllers/knowledge.controller'

// Tokens
import { KNOWLEDGE_REPOSITORY, SYSTEM_PROMPT_REPOSITORY } from './tokens'

@Module({
  controllers: [KnowledgeController],
  providers: [
    // Application Use Cases
    StoreKnowledgeUseCase,
    RetrieveKnowledgeUseCase,
    BatchRetrieveKnowledgeUseCase,
    SearchKnowledgeUseCase,
    ListAllKnowledgeUseCase,
    ListKnowledgeTypesUseCase,
    ListTopicsUseCase,
    DeleteKnowledgeUseCase,
    SaveSystemPromptUseCase,
    GetSystemPromptUseCase,
    DeleteSystemPromptUseCase,

    // Repositories
    {
      provide: KNOWLEDGE_REPOSITORY,
      useClass: PrismaKnowledgeRepository
    },
    {
      provide: SYSTEM_PROMPT_REPOSITORY,
      useClass: PrismaSystemPromptRepository
    }
  ],
  exports: [
    StoreKnowledgeUseCase,
    RetrieveKnowledgeUseCase,
    BatchRetrieveKnowledgeUseCase,
    SearchKnowledgeUseCase,
    ListAllKnowledgeUseCase,
    ListKnowledgeTypesUseCase,
    ListTopicsUseCase,
    DeleteKnowledgeUseCase,
    SaveSystemPromptUseCase,
    GetSystemPromptUseCase,
    DeleteSystemPromptUseCase,
    KNOWLEDGE_REPOSITORY,
    SYSTEM_PROMPT_REPOSITORY
  ]
})
export class KnowledgeModule {}
