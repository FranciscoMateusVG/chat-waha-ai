import { NotificationContent } from '../notification-content.vo'

describe('NotificationContent', () => {
  describe('constructor', () => {
    it('should create valid notification content', () => {
      const content = new NotificationContent('Test Title', 'Test body message')
      expect(content.title).toBe('Test Title')
      expect(content.body).toBe('Test body message')
      expect(content.metadata).toBeUndefined()
    })

    it('should create notification content with metadata', () => {
      const metadata = { type: 'urgent', priority: 1 }
      const content = new NotificationContent(
        'Test Title',
        'Test body',
        metadata
      )
      expect(content.title).toBe('Test Title')
      expect(content.body).toBe('Test body')
      expect(content.metadata).toEqual(metadata)
    })

    it('should trim whitespace from title and body', () => {
      const content = new NotificationContent('  Test Title  ', '  Test body  ')
      expect(content.title).toBe('Test Title')
      expect(content.body).toBe('Test body')
    })

    it('should allow empty title for channels like WhatsApp', () => {
      const content = new NotificationContent('', 'Test body')
      expect(content.title).toBe('')
      expect(content.body).toBe('Test body')
    })

    it('should allow whitespace-only title (treated as empty)', () => {
      const content = new NotificationContent('   ', 'Test body')
      expect(content.title).toBe('')
      expect(content.body).toBe('Test body')
    })

    it('should throw error for empty body', () => {
      expect(() => new NotificationContent('Test Title', '')).toThrow(
        'Notification body cannot be empty'
      )
    })

    it('should throw error for whitespace-only body', () => {
      expect(() => new NotificationContent('Test Title', '   ')).toThrow(
        'Notification body cannot be empty'
      )
    })

    it('should throw error for title exceeding 255 characters', () => {
      const longTitle = 'a'.repeat(256)
      expect(() => new NotificationContent(longTitle, 'Test body')).toThrow(
        'Notification title cannot exceed 255 characters'
      )
    })

    it('should throw error for body exceeding 5000 characters', () => {
      const longBody = 'a'.repeat(5001)
      expect(() => new NotificationContent('Test Title', longBody)).toThrow(
        'Notification body cannot exceed 5000 characters'
      )
    })
  })

  describe('metadata getter', () => {
    it('should return undefined when no metadata provided', () => {
      const content = new NotificationContent('Title', 'Body')
      expect(content.metadata).toBeUndefined()
    })

    it('should return copy of metadata to prevent mutations', () => {
      const originalMetadata = { type: 'urgent' }
      const content = new NotificationContent('Title', 'Body', originalMetadata)
      const retrievedMetadata = content.metadata

      retrievedMetadata!.type = 'normal'
      expect(content.metadata).toEqual({ type: 'urgent' })
    })
  })

  describe('equals', () => {
    it('should return true for identical content without metadata', () => {
      const content1 = new NotificationContent('Title', 'Body')
      const content2 = new NotificationContent('Title', 'Body')
      expect(content1.equals(content2)).toBe(true)
    })

    it('should return true for identical content with same metadata', () => {
      const metadata = { type: 'urgent' }
      const content1 = new NotificationContent('Title', 'Body', metadata)
      const content2 = new NotificationContent('Title', 'Body', metadata)
      expect(content1.equals(content2)).toBe(true)
    })

    it('should return false for different titles', () => {
      const content1 = new NotificationContent('Title1', 'Body')
      const content2 = new NotificationContent('Title2', 'Body')
      expect(content1.equals(content2)).toBe(false)
    })

    it('should return false for different bodies', () => {
      const content1 = new NotificationContent('Title', 'Body1')
      const content2 = new NotificationContent('Title', 'Body2')
      expect(content1.equals(content2)).toBe(false)
    })

    it('should return false for different metadata', () => {
      const content1 = new NotificationContent('Title', 'Body', {
        type: 'urgent'
      })
      const content2 = new NotificationContent('Title', 'Body', {
        type: 'normal'
      })
      expect(content1.equals(content2)).toBe(false)
    })

    it('should return false when one has metadata and other does not', () => {
      const content1 = new NotificationContent('Title', 'Body', {
        type: 'urgent'
      })
      const content2 = new NotificationContent('Title', 'Body')
      expect(content1.equals(content2)).toBe(false)
    })

    it('should return true for identical content with empty titles', () => {
      const content1 = new NotificationContent('', 'Body')
      const content2 = new NotificationContent('', 'Body')
      expect(content1.equals(content2)).toBe(true)
    })
  })

  describe('toPlainObject', () => {
    it('should return plain object without metadata', () => {
      const content = new NotificationContent('Title', 'Body')
      const plainObject = content.toPlainObject()

      expect(plainObject).toEqual({
        title: 'Title',
        body: 'Body',
        metadata: undefined
      })
    })

    it('should return plain object with metadata', () => {
      const metadata = { type: 'urgent', priority: 1 }
      const content = new NotificationContent('Title', 'Body', metadata)
      const plainObject = content.toPlainObject()

      expect(plainObject).toEqual({
        title: 'Title',
        body: 'Body',
        metadata
      })
    })

    it('should return plain object with empty title', () => {
      const content = new NotificationContent('', 'Body only message')
      const plainObject = content.toPlainObject()

      expect(plainObject).toEqual({
        title: '',
        body: 'Body only message',
        metadata: undefined
      })
    })
  })
})
