# Knowledge API - Curl Examples

This document provides comprehensive curl examples for the Knowledge API endpoints.

## Base URL
Assuming your API runs on `http://localhost:3000`, all endpoints are under `/knowledge`.

---

## 1. Create Knowledge Entry

Creates a new knowledge entry or updates an existing one if the same type:topic combination exists.

### Basic Example
```bash
curl -X POST http://localhost:3000/knowledge \
  -H "Content-Type: application/json" \
  -d '{
    "type": "Product Information",
    "topic": "Payment Methods",
    "content": "We support credit cards (Visa, Mastercard), PIX (Brazilian instant payment), and bank transfers."
  }'
```

### With Tags and Metadata
```bash
curl -X POST http://localhost:3000/knowledge \
  -H "Content-Type: application/json" \
  -d '{
    "type": "Product Information",
    "topic": "Payment Methods",
    "content": "We support credit cards (Visa, Mastercard), PIX (Brazilian instant payment), and bank transfers.",
    "tags": ["payments", "billing", "finance"],
    "metadata": {
      "source": "support-docs",
      "priority": "high",
      "lastReviewed": "2024-01-15"
    }
  }'
```

### Multiple Knowledge Entries
```bash
# Pricing Information
curl -X POST http://localhost:3000/knowledge \
  -H "Content-Type: application/json" \
  -d '{
    "type": "Product Information",
    "topic": "Pricing",
    "content": "Papaya Pay charges 2.9% + $0.30 per transaction for credit cards. PIX transactions are free.",
    "tags": ["pricing", "fees", "billing"]
  }'

# Customer Support - Refund Policy
curl -X POST http://localhost:3000/knowledge \
  -H "Content-Type: application/json" \
  -d '{
    "type": "Customer Support",
    "topic": "Refund Policy",
    "content": "Refunds are processed within 5-10 business days. Contact support@papayapay.com for assistance.",
    "tags": ["refunds", "support", "policy"]
  }'

# Customer Support - Contact Information
curl -X POST http://localhost:3000/knowledge \
  -H "Content-Type: application/json" \
  -d '{
    "type": "Customer Support",
    "topic": "Contact Info",
    "content": "Email: support@papayapay.com | Phone: +55 11 1234-5678 | Hours: Monday-Friday 9am-6pm BRT",
    "tags": ["contact", "support", "hours"]
  }'

# Internal Policies - Employee Benefits
curl -X POST http://localhost:3000/knowledge \
  -H "Content-Type: application/json" \
  -d '{
    "type": "Internal Policies",
    "topic": "Employee Benefits",
    "content": "Full health coverage, 30 days PTO, flexible working hours, and remote work options available.",
    "tags": ["hr", "internal", "benefits"]
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "knowledgeId": "123e4567-e89b-12d3-a456-426614174000"
  }
}
```

---

## 2. Get Knowledge by Type and Topic

Retrieves a specific knowledge entry using its type and topic.

```bash
# Get payment methods information
curl -X GET "http://localhost:3000/knowledge/Product%20Information/Payment%20Methods"

# Get pricing information
curl -X GET "http://localhost:3000/knowledge/Product%20Information/Pricing"

# Get refund policy
curl -X GET "http://localhost:3000/knowledge/Customer%20Support/Refund%20Policy"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "type": "Product Information",
    "topic": "Payment Methods",
    "key": "Product Information:Payment Methods",
    "content": "We support credit cards (Visa, Mastercard), PIX (Brazilian instant payment), and bank transfers.",
    "tags": ["payments", "billing", "finance"],
    "metadata": {
      "source": "support-docs",
      "priority": "high",
      "lastReviewed": "2024-01-15"
    },
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
}
```

---

## 3. Update Knowledge Entry

Updates the content, tags, and metadata of an existing knowledge entry.

```bash
# Update payment methods with cryptocurrency support
curl -X PUT "http://localhost:3000/knowledge/Product%20Information/Payment%20Methods" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "We support credit cards (Visa, Mastercard), PIX (Brazilian instant payment), bank transfers, and cryptocurrency (Bitcoin, Ethereum).",
    "tags": ["payments", "billing", "finance", "crypto"],
    "metadata": {
      "source": "support-docs",
      "priority": "high",
      "lastReviewed": "2024-01-20",
      "cryptoSupport": true
    }
  }'

# Update pricing with new information
curl -X PUT "http://localhost:3000/knowledge/Product%20Information/Pricing" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Papaya Pay charges 2.9% + $0.30 per transaction for credit cards. PIX transactions are free. Cryptocurrency transactions have a 1% fee.",
    "tags": ["pricing", "fees", "billing", "crypto"]
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "knowledgeId": "123e4567-e89b-12d3-a456-426614174000"
  }
}
```

---

## 4. List All Knowledge Types

Gets all unique knowledge types/categories available in the system.

```bash
curl -X GET http://localhost:3000/knowledge/types
```

**Expected Response:**
```json
{
  "success": true,
  "data": [
    "Customer Support",
    "Internal Policies", 
    "Product Information"
  ]
}
```

---

## 5. List Topics in a Knowledge Type

Gets all topics available within a specific knowledge type.

```bash
# Get all topics in Product Information
curl -X GET "http://localhost:3000/knowledge/types/Product%20Information/topics"

# Get all topics in Customer Support
curl -X GET "http://localhost:3000/knowledge/types/Customer%20Support/topics"

# Get all topics in Internal Policies
curl -X GET "http://localhost:3000/knowledge/types/Internal%20Policies/topics"
```

**Expected Response:**
```json
{
  "success": true,
  "data": [
    "Payment Methods",
    "Pricing"
  ]
}
```

---

## 6. Search Knowledge Entries

Searches knowledge entries by query, optionally filtered by type or tags.

### Basic Search
```bash
# Search for "payment"
curl -X GET "http://localhost:3000/knowledge/search?query=payment"

# Search for "refund"
curl -X GET "http://localhost:3000/knowledge/search?query=refund"

# Search for "support"
curl -X GET "http://localhost:3000/knowledge/search?query=support"
```

### Search with Type Filter
```bash
# Search for "payment" only in Product Information
curl -X GET "http://localhost:3000/knowledge/search?query=payment&type=Product%20Information"

# Search for "contact" only in Customer Support
curl -X GET "http://localhost:3000/knowledge/search?query=contact&type=Customer%20Support"
```

### Search with Tags Filter
```bash
# Search by specific tags
curl -X GET "http://localhost:3000/knowledge/search?query=billing&tags=payments,billing"

# Search by multiple tags
curl -X GET "http://localhost:3000/knowledge/search?query=support&tags=support,policy"
```

### Combined Search
```bash
# Search with query, type, and tags
curl -X GET "http://localhost:3000/knowledge/search?query=fee&type=Product%20Information&tags=pricing,billing"
```

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "type": "Product Information",
      "topic": "Payment Methods",
      "key": "Product Information:Payment Methods",
      "content": "We support credit cards (Visa, Mastercard), PIX (Brazilian instant payment), and bank transfers.",
      "tags": ["payments", "billing", "finance"],
      "metadata": {
        "source": "support-docs",
        "priority": "high"
      },
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T14:22:00Z"
    }
  ]
}
```

---

## Complete Example Workflow

Here's a complete workflow showing how to use the API:

```bash
# 1. Check what knowledge types exist (should be empty initially)
curl -X GET http://localhost:3000/knowledge/types

# 2. Add some knowledge entries
curl -X POST http://localhost:3000/knowledge \
  -H "Content-Type: application/json" \
  -d '{
    "type": "Product Information",
    "topic": "Payment Methods",
    "content": "We support credit cards and PIX.",
    "tags": ["payments", "billing"]
  }'

curl -X POST http://localhost:3000/knowledge \
  -H "Content-Type: application/json" \
  -d '{
    "type": "Product Information",
    "topic": "Pricing",
    "content": "2.9% + $0.30 per transaction.",
    "tags": ["pricing", "fees"]
  }'

curl -X POST http://localhost:3000/knowledge \
  -H "Content-Type: application/json" \
  -d '{
    "type": "Customer Support",
    "topic": "Contact Info",
    "content": "Email: support@papayapay.com",
    "tags": ["contact", "support"]
  }'

# 3. Check knowledge types again (should now show the types)
curl -X GET http://localhost:3000/knowledge/types

# 4. Check topics in Product Information
curl -X GET "http://localhost:3000/knowledge/types/Product%20Information/topics"

# 5. Get specific knowledge
curl -X GET "http://localhost:3000/knowledge/Product%20Information/Payment%20Methods"

# 6. Search for payment-related information
curl -X GET "http://localhost:3000/knowledge/search?query=payment"

# 7. Update payment methods to add more options
curl -X PUT "http://localhost:3000/knowledge/Product%20Information/Payment%20Methods" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "We support credit cards, PIX, and bank transfers.",
    "tags": ["payments", "billing", "cards", "pix"]
  }'

# 8. Search again to see updated content
curl -X GET "http://localhost:3000/knowledge/search?query=bank"
```

---

## Error Examples

### Validation Errors
```bash
# Missing required fields
curl -X POST http://localhost:3000/knowledge \
  -H "Content-Type: application/json" \
  -d '{
    "type": "Product Information"
  }'
# Returns: {"success": false, "error": "Type, topic, and content are required"}

# Empty search query
curl -X GET "http://localhost:3000/knowledge/search?query="
# Returns: {"success": false, "error": "Search query is required"}
```

### Not Found
```bash
# Get non-existent knowledge
curl -X GET "http://localhost:3000/knowledge/NonExistent/Topic"
# Returns: {"success": true, "data": null}
```

---

## Testing with Real Papaya Pay Data

Here are some realistic examples for a payment company:

```bash
# Product Features
curl -X POST http://localhost:3000/knowledge \
  -H "Content-Type: application/json" \
  -d '{
    "type": "Product Information",
    "topic": "Features",
    "content": "Real-time payment processing, multi-currency support, fraud detection, analytics dashboard, API integration, mobile SDKs.",
    "tags": ["features", "capabilities", "product"]
  }'

# API Documentation
curl -X POST http://localhost:3000/knowledge \
  -H "Content-Type: application/json" \
  -d '{
    "type": "Developer Resources",
    "topic": "API Endpoints",
    "content": "POST /payments - Create payment, GET /payments/:id - Get payment status, POST /refunds - Process refund.",
    "tags": ["api", "development", "integration"]
  }'

# Compliance Information
curl -X POST http://localhost:3000/knowledge \
  -H "Content-Type: application/json" \
  -d '{
    "type": "Compliance",
    "topic": "PCI DSS",
    "content": "Papaya Pay is PCI DSS Level 1 compliant. All card data is encrypted and tokenized.",
    "tags": ["security", "compliance", "pci"]
  }'
```

This API provides a flexible foundation for AI agents to discover, explore, and retrieve knowledge dynamically!