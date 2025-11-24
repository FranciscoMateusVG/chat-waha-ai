import { applyDecorators } from '@nestjs/common'
import { ApiBearerAuth, ApiSecurity } from '@nestjs/swagger'

/**
 * Decorator that applies both Bearer Token and API Key authentication
 * to Swagger documentation for a controller or endpoint.
 *
 * This ensures that the Swagger UI will include authentication headers
 * in all requests made from the documentation.
 */

export function ApiAuth() {
  return applyDecorators(
    ApiBearerAuth('Bearer'),
    ApiSecurity('ApiKey')
  )
}
