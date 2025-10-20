import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  ValidationPipe
} from '@nestjs/common'
import {
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags
} from '@nestjs/swagger'

// Use Cases
import {
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
} from '../../application/use-cases'

// DTOs
import {
  PaginatedResponseDto,
  PaginationQueryDto
} from '../../../chatHistory/application/dtos/pagination.dto'
import {
  ApiResponseDto,
  CreateKnowledgeDto,
  KnowledgeResponseDto,
  SaveSystemPromptDto,
  SystemPromptResponseDto,
  UpdateKnowledgeDto
} from '../dtos'

@ApiTags('Knowledge')
@Controller('knowledge')
export class KnowledgeController {
  constructor(
    private readonly storeKnowledgeUseCase: StoreKnowledgeUseCase,
    private readonly retrieveKnowledgeUseCase: RetrieveKnowledgeUseCase,
    private readonly searchKnowledgeUseCase: SearchKnowledgeUseCase,
    private readonly listAllKnowledgeUseCase: ListAllKnowledgeUseCase,
    private readonly listKnowledgeTypesUseCase: ListKnowledgeTypesUseCase,
    private readonly listTopicsUseCase: ListTopicsUseCase,
    private readonly deleteKnowledgeUseCase: DeleteKnowledgeUseCase,
    private readonly saveSystemPromptUseCase: SaveSystemPromptUseCase,
    private readonly getSystemPromptUseCase: GetSystemPromptUseCase,
    private readonly deleteSystemPromptUseCase: DeleteSystemPromptUseCase
  ) {}

  @Get('all')
  @ApiOperation({
    summary: 'List all knowledge entries with pagination',
    description: 'Retrieves all knowledge entries with pagination support'
  })
  @ApiQuery({
    name: 'page',
    description: 'Page number (1-indexed)',
    required: false,
    example: 1
  })
  @ApiQuery({
    name: 'limit',
    description: 'Number of items per page (max 100)',
    required: false,
    example: 10
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of knowledge entries',
    type: PaginatedResponseDto
  })
  async listAllKnowledge(
    @Query() paginationQuery: PaginationQueryDto
  ): Promise<PaginatedResponseDto<KnowledgeResponseDto>> {
    const page = paginationQuery.page || 1
    const limit = paginationQuery.limit || 10

    const result = await this.listAllKnowledgeUseCase.execute({ page, limit })

    if (!result.success) {
      throw new Error(result.error)
    }

    return {
      success: true,
      data: result.knowledge!,
      meta: result.pagination!
    }
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create or update knowledge entry',
    description:
      'Creates a new knowledge entry or updates existing one if type:topic combination already exists'
  })
  @ApiResponse({
    status: 201,
    description: 'Knowledge entry created/updated successfully',
    type: ApiResponseDto
  })
  @ApiBadRequestResponse({
    description: 'Invalid input data'
  })
  async createKnowledge(
    @Body(ValidationPipe) createKnowledgeDto: CreateKnowledgeDto
  ): Promise<ApiResponseDto<{ knowledgeId: string }>> {
    const result = await this.storeKnowledgeUseCase.execute({
      type: createKnowledgeDto.type,
      topic: createKnowledgeDto.topic,
      content: createKnowledgeDto.content,
      tags: createKnowledgeDto.tags,
      metadata: createKnowledgeDto.metadata
    })

    if (!result.success) {
      return {
        success: false,
        error: result.error
      }
    }

    return {
      success: true,
      data: {
        knowledgeId: result.knowledgeId!
      }
    }
  }

  @Delete('id/:id')
  @ApiOperation({
    summary: 'Delete knowledge entry',
    description: 'Deletes a knowledge entry by its ID'
  })
  @ApiParam({
    name: 'id',
    description: 'Knowledge entry ID',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @ApiResponse({
    status: 200,
    description: 'Knowledge entry deleted successfully',
    type: ApiResponseDto
  })
  @ApiNotFoundResponse({
    description: 'Knowledge entry not found'
  })
  async deleteKnowledge(
    @Param('id') id: string
  ): Promise<ApiResponseDto<{ message: string }>> {
    const result = await this.deleteKnowledgeUseCase.execute({ id })

    if (!result.success) {
      return {
        success: false,
        error: result.error
      }
    }

    return {
      success: true,
      data: {
        message: 'Knowledge entry deleted successfully'
      }
    }
  }

  @Get(':type/:topic')
  @ApiOperation({
    summary: 'Get knowledge by type and topic',
    description: 'Retrieves a specific knowledge entry by its type and topic'
  })
  @ApiParam({
    name: 'type',
    description: 'Knowledge type',
    example: 'Product Information'
  })
  @ApiParam({
    name: 'topic',
    description: 'Knowledge topic',
    example: 'Payment Methods'
  })
  @ApiResponse({
    status: 200,
    description: 'Knowledge entry found',
    type: ApiResponseDto
  })
  @ApiNotFoundResponse({
    description: 'Knowledge entry not found'
  })
  async getKnowledge(
    @Param('type') type: string,
    @Param('topic') topic: string
  ): Promise<ApiResponseDto<KnowledgeResponseDto | null>> {
    const result = await this.retrieveKnowledgeUseCase.execute({ type, topic })

    if (!result.success) {
      return {
        success: false,
        error: result.error
      }
    }

    return {
      success: true,
      data: result.knowledge || null
    }
  }

  @Put(':type/:topic')
  @ApiOperation({
    summary: 'Update knowledge entry',
    description:
      'Updates the content, tags, and metadata of an existing knowledge entry'
  })
  @ApiParam({
    name: 'type',
    description: 'Knowledge type',
    example: 'Product Information'
  })
  @ApiParam({
    name: 'topic',
    description: 'Knowledge topic',
    example: 'Payment Methods'
  })
  @ApiResponse({
    status: 200,
    description: 'Knowledge entry updated successfully',
    type: ApiResponseDto
  })
  @ApiNotFoundResponse({
    description: 'Knowledge entry not found'
  })
  async updateKnowledge(
    @Param('type') type: string,
    @Param('topic') topic: string,
    @Body(ValidationPipe) updateKnowledgeDto: UpdateKnowledgeDto
  ): Promise<ApiResponseDto<{ knowledgeId: string }>> {
    const result = await this.storeKnowledgeUseCase.execute({
      type,
      topic,
      content: updateKnowledgeDto.content,
      tags: updateKnowledgeDto.tags,
      metadata: updateKnowledgeDto.metadata
    })

    if (!result.success) {
      return {
        success: false,
        error: result.error
      }
    }

    return {
      success: true,
      data: {
        knowledgeId: result.knowledgeId!
      }
    }
  }

  @Get('types')
  @ApiOperation({
    summary: 'List all knowledge types',
    description:
      'Gets all unique knowledge types/categories available in the system'
  })
  @ApiResponse({
    status: 200,
    description: 'List of knowledge types',
    type: ApiResponseDto
  })
  async getKnowledgeTypes(): Promise<ApiResponseDto<string[]>> {
    const result = await this.listKnowledgeTypesUseCase.execute()

    if (!result.success) {
      return {
        success: false,
        error: result.error
      }
    }

    return {
      success: true,
      data: result.types || []
    }
  }

  @Get('types/:type/topics')
  @ApiOperation({
    summary: 'List topics in a knowledge type',
    description: 'Gets all topics available within a specific knowledge type'
  })
  @ApiParam({
    name: 'type',
    description: 'Knowledge type',
    example: 'Product Information'
  })
  @ApiResponse({
    status: 200,
    description: 'List of topics in the specified type',
    type: ApiResponseDto
  })
  async getTopicsInType(
    @Param('type') type: string
  ): Promise<ApiResponseDto<string[]>> {
    const result = await this.listTopicsUseCase.execute({ type })

    if (!result.success) {
      return {
        success: false,
        error: result.error
      }
    }

    return {
      success: true,
      data: result.topics || []
    }
  }

  @Get('search')
  @ApiOperation({
    summary: 'Search knowledge entries',
    description:
      'Searches knowledge entries by query, optionally filtered by type or tags'
  })
  @ApiQuery({
    name: 'query',
    description: 'Search query',
    example: 'payment methods'
  })
  @ApiQuery({
    name: 'type',
    description: 'Filter by knowledge type',
    required: false,
    example: 'Product Information'
  })
  @ApiQuery({
    name: 'tags',
    description: 'Filter by tags (comma-separated)',
    required: false,
    example: 'payments,billing'
  })
  @ApiResponse({
    status: 200,
    description: 'Search results',
    type: ApiResponseDto
  })
  async searchKnowledge(
    @Query('query') query: string,
    @Query('type') type?: string,
    @Query('tags') tagsString?: string
  ): Promise<ApiResponseDto<KnowledgeResponseDto[]>> {
    const tags = tagsString
      ? tagsString.split(',').map((tag) => tag.trim())
      : undefined

    const result = await this.searchKnowledgeUseCase.execute({
      query,
      type,
      tags
    })

    if (!result.success) {
      return {
        success: false,
        error: result.error
      }
    }

    return {
      success: true,
      data: result.knowledge || []
    }
  }

  @Post('system-prompt')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Save or update system prompt',
    description: 'Saves or updates the system prompt content'
  })
  @ApiResponse({
    status: 200,
    description: 'System prompt saved successfully',
    type: ApiResponseDto
  })
  @ApiBadRequestResponse({
    description: 'Invalid input data'
  })
  async saveSystemPrompt(
    @Body(ValidationPipe) saveSystemPromptDto: SaveSystemPromptDto
  ): Promise<ApiResponseDto<{ message: string }>> {
    const result = await this.saveSystemPromptUseCase.execute({
      content: saveSystemPromptDto.content
    })

    if (!result.success) {
      return {
        success: false,
        error: result.error
      }
    }

    return {
      success: true,
      data: {
        message: 'System prompt saved successfully'
      }
    }
  }

  @Get('system-prompt')
  @ApiOperation({
    summary: 'Get system prompt',
    description: 'Retrieves the current system prompt content'
  })
  @ApiResponse({
    status: 200,
    description: 'System prompt retrieved successfully',
    type: ApiResponseDto
  })
  async getSystemPrompt(): Promise<
    ApiResponseDto<SystemPromptResponseDto | null>
  > {
    const result = await this.getSystemPromptUseCase.execute()

    if (!result.success) {
      return {
        success: false,
        error: result.error
      }
    }

    if (!result.systemPrompt) {
      return {
        success: true,
        data: null
      }
    }

    return {
      success: true,
      data: {
        id: result.systemPrompt.id,
        content: result.systemPrompt.content,
        updatedAt: result.systemPrompt.updatedAt
      }
    }
  }

  @Delete('system-prompt')
  @ApiOperation({
    summary: 'Delete system prompt',
    description: 'Deletes the current system prompt'
  })
  @ApiResponse({
    status: 200,
    description: 'System prompt deleted successfully',
    type: ApiResponseDto
  })
  @ApiNotFoundResponse({
    description: 'System prompt not found'
  })
  async deleteSystemPrompt(): Promise<ApiResponseDto<{ message: string }>> {
    const result = await this.deleteSystemPromptUseCase.execute()

    if (!result.success) {
      return {
        success: false,
        error: result.error
      }
    }

    return {
      success: true,
      data: {
        message: 'System prompt deleted successfully'
      }
    }
  }
}
