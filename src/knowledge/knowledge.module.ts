import { Module } from '@nestjs/common'
import { DrizzleDatabaseService } from '../infrastructure/drizzle/database.provider'

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
import { DrizzleKnowledgeRepository } from './infrastructure/persistence/drizzle-knowledge.repository'
import { DrizzleSystemPromptRepository } from './infrastructure/persistence/drizzle-system-prompt.repository'

// Presentation Layer
import { KnowledgeController } from './presentation/controllers/knowledge.controller'

// Tokens
import { KNOWLEDGE_REPOSITORY, SYSTEM_PROMPT_REPOSITORY } from './tokens'

@Module({
  controllers: [KnowledgeController],
  providers: [
    // Database
    DrizzleDatabaseService,

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
      useClass: DrizzleKnowledgeRepository
    },
    {
      provide: SYSTEM_PROMPT_REPOSITORY,
      useClass: DrizzleSystemPromptRepository
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
