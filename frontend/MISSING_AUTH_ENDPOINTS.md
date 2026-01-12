# Endpoints de Autenticação Necessários no Backend

Este documento lista os endpoints de autenticação que precisam ser implementados no backend para suportar um fluxo completo de login/logout no frontend.

## Status Atual

O backend atualmente usa autenticação via API Key (`x-api-key` header). Não existem endpoints para login/logout de usuários.

## Endpoints Necessários

### 1. POST /auth/login

**Descrição:** Autenticar usuário com email e senha

**Request Body:**
```json
{
  "email": "string",
  "password": "string"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "accessToken": "string",
    "refreshToken": "string (opcional)",
    "user": {
      "id": "string",
      "name": "string",
      "email": "string"
    }
  }
}
```

**Response (401):**
```json
{
  "success": false,
  "error": "Credenciais inválidas"
}
```

### 2. POST /auth/logout

**Descrição:** Encerrar sessão do usuário

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "message": "Logout realizado com sucesso"
  }
}
```

### 3. POST /auth/refresh (Opcional)

**Descrição:** Renovar token de acesso usando refresh token

**Request Body:**
```json
{
  "refreshToken": "string"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "accessToken": "string"
  }
}
```

### 4. GET /auth/me

**Descrição:** Obter dados do usuário autenticado

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "string",
    "name": "string",
    "email": "string"
  }
}
```

## Observações

1. O `UserController` existe mas não está decorado com `@Controller()` e não possui rotas definidas
2. O `AuthPort` interface já existe no código mas não está implementado completamente
3. Recomenda-se usar JWT para os tokens
4. O frontend já está preparado para usar Bearer token (além de API Key)

## Arquivos Relevantes no Backend

- `api/src/user/controllers/user.controller.ts` - Controller de usuário (incompleto)
- `api/src/auth/auth.guard.ts` - Guard de autenticação (já suporta Bearer token)
- `api/src/user/application/ports/auth.port.ts` - Interface do serviço de autenticação
