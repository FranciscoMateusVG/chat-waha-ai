import { KnowledgeEntry } from '../knowledge-entry.entity'
import { KnowledgeId, KnowledgeType } from '../../value-objects'

describe('KnowledgeEntry Entity', () => {
  const createTestKnowledgeEntry = () => {
    const type = KnowledgeType.general()
    const key = 'general:payment-methods'
    const content = 'We accept credit cards, debit cards, and bank transfers.'
    
    return KnowledgeEntry.create(type, key, content)
  }

  describe('create', () => {
    it('should create a knowledge entry with valid properties', () => {
      const type = KnowledgeType.faq()
      const key = 'faq:how-to-pay'
      const content = 'You can pay using various methods including credit cards.'
      const metadata = { priority: 'high', category: 'payments' }
      
      const entry = KnowledgeEntry.create(type, key, content, metadata)
      
      expect(entry.id).toBeInstanceOf(KnowledgeId)
      expect(entry.type.equals(type)).toBe(true)
      expect(entry.key).toBe(key)
      expect(entry.content).toBe(content)
      expect(entry.metadata).toEqual(metadata)
      expect(entry.createdAt).toBeInstanceOf(Date)
      expect(entry.updatedAt).toBeInstanceOf(Date)
      expect(entry.createdAt.getTime()).toBe(entry.updatedAt.getTime())
    })

    it('should create a knowledge entry without metadata', () => {
      const entry = createTestKnowledgeEntry()
      
      expect(entry.metadata).toBeUndefined()
    })

    it('should throw error when key is empty', () => {
      const type = KnowledgeType.general()
      const key = ''
      const content = 'Some content'
      
      expect(() => KnowledgeEntry.create(type, key, content)).toThrow(
        'Knowledge entry key cannot be empty'
      )
    })

    it('should throw error when key is only whitespace', () => {
      const type = KnowledgeType.general()
      const key = '   '
      const content = 'Some content'
      
      expect(() => KnowledgeEntry.create(type, key, content)).toThrow(
        'Knowledge entry key cannot be empty'
      )
    })

    it('should throw error when content is empty', () => {
      const type = KnowledgeType.general()
      const key = 'test:key'
      const content = ''
      
      expect(() => KnowledgeEntry.create(type, key, content)).toThrow(
        'Knowledge entry content cannot be empty'
      )
    })

    it('should throw error when content is only whitespace', () => {
      const type = KnowledgeType.general()
      const key = 'test:key'
      const content = '   '
      
      expect(() => KnowledgeEntry.create(type, key, content)).toThrow(
        'Knowledge entry content cannot be empty'
      )
    })
  })

  describe('update', () => {
    it('should update content and metadata', () => {
      const entry = createTestKnowledgeEntry()
      const originalUpdatedAt = entry.updatedAt
      
      // Wait a small amount to ensure different timestamp
      setTimeout(() => {
        const newContent = 'Updated payment methods information'
        const newMetadata = { updated: true, version: 2 }
        
        entry.update(newContent, newMetadata)
        
        expect(entry.content).toBe(newContent)
        expect(entry.metadata).toEqual(newMetadata)
        expect(entry.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime())
      }, 10)
    })

    it('should update content without metadata', () => {
      const entry = createTestKnowledgeEntry()
      const newContent = 'Updated content'
      
      entry.update(newContent)
      
      expect(entry.content).toBe(newContent)
      expect(entry.metadata).toBeUndefined()
    })

    it('should throw error when updating with empty content', () => {
      const entry = createTestKnowledgeEntry()
      
      expect(() => entry.update('')).toThrow(
        'Knowledge entry content cannot be empty'
      )
    })

    it('should throw error when updating with whitespace-only content', () => {
      const entry = createTestKnowledgeEntry()
      
      expect(() => entry.update('   ')).toThrow(
        'Knowledge entry content cannot be empty'
      )
    })
  })

  describe('reconstitute', () => {
    it('should recreate knowledge entry from persistence data', () => {
      const id = new KnowledgeId()
      const type = KnowledgeType.user()
      const key = 'user:12345'
      const content = 'User specific information'
      const metadata = { userId: '12345', active: true }
      const createdAt = new Date('2023-01-01')
      const updatedAt = new Date('2023-01-02')
      
      const entry = KnowledgeEntry.reconstitute({
        id,
        type,
        key,
        content,
        metadata,
        createdAt,
        updatedAt
      })
      
      expect(entry.id.equals(id)).toBe(true)
      expect(entry.type.equals(type)).toBe(true)
      expect(entry.key).toBe(key)
      expect(entry.content).toBe(content)
      expect(entry.metadata).toEqual(metadata)
      expect(entry.createdAt).toBe(createdAt)
      expect(entry.updatedAt).toBe(updatedAt)
    })

    it('should reconstitute knowledge entry without metadata', () => {
      const id = new KnowledgeId()
      const type = KnowledgeType.policy()
      const key = 'policy:refunds'
      const content = 'Refund policy details'
      const createdAt = new Date()
      const updatedAt = new Date()
      
      const entry = KnowledgeEntry.reconstitute({
        id,
        type,
        key,
        content,
        createdAt,
        updatedAt
      })
      
      expect(entry.metadata).toBeUndefined()
    })
  })

  describe('equals', () => {
    it('should return true for entries with same ID', () => {
      const entry1 = createTestKnowledgeEntry()
      const entry2 = KnowledgeEntry.reconstitute({
        id: entry1.id,
        type: entry1.type,
        key: entry1.key,
        content: entry1.content,
        createdAt: entry1.createdAt,
        updatedAt: entry1.updatedAt
      })
      
      expect(entry1.equals(entry2)).toBe(true)
    })

    it('should return false for entries with different IDs', () => {
      const entry1 = createTestKnowledgeEntry()
      const entry2 = createTestKnowledgeEntry()
      
      expect(entry1.equals(entry2)).toBe(false)
    })
  })

  describe('getters', () => {
    it('should provide access to all properties', () => {
      const type = KnowledgeType.product()
      const key = 'product:laptop-specs'
      const content = 'Detailed laptop specifications'
      const metadata = { category: 'electronics', featured: true }
      
      const entry = KnowledgeEntry.create(type, key, content, metadata)
      
      expect(entry.id).toBeInstanceOf(KnowledgeId)
      expect(entry.type).toBe(type)
      expect(entry.key).toBe(key)
      expect(entry.content).toBe(content)
      expect(entry.metadata).toBe(metadata)
      expect(entry.createdAt).toBeInstanceOf(Date)
      expect(entry.updatedAt).toBeInstanceOf(Date)
    })
  })
})