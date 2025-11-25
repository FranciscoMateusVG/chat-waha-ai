import {
  AI_MESSAGE_MARKER,
  isAiMessage,
  markAsAiMessage,
  removeAiMarker
} from '../constants'

describe('AI Message Marker', () => {
  describe('markAsAiMessage', () => {
    it('should append invisible marker to message', () => {
      const original = 'Hello, how can I help you?'
      const marked = markAsAiMessage(original)

      expect(marked).toBe(original + AI_MESSAGE_MARKER)
      expect(marked.length).toBe(original.length + 3)
      expect(marked).not.toBe(original)
    })

    it('should work with empty string', () => {
      const marked = markAsAiMessage('')
      expect(marked).toBe(AI_MESSAGE_MARKER)
      expect(marked.length).toBe(3)
    })

    it('should work with multiline messages', () => {
      const original = 'Line 1\nLine 2\nLine 3'
      const marked = markAsAiMessage(original)
      expect(marked).toBe(original + AI_MESSAGE_MARKER)
    })
  })

  describe('isAiMessage', () => {
    it('should detect marked messages', () => {
      const message = 'Test message' + AI_MESSAGE_MARKER
      expect(isAiMessage(message)).toBe(true)
    })

    it('should not detect unmarked messages', () => {
      const message = 'Regular user message'
      expect(isAiMessage(message)).toBe(false)
    })

    it('should not detect messages with only partial marker', () => {
      const message = 'Test' + '\u200B' // Only one zero-width space
      expect(isAiMessage(message)).toBe(false)
    })

    it('should not detect messages with marker in the middle', () => {
      const message = 'Test' + AI_MESSAGE_MARKER + 'more text'
      expect(isAiMessage(message)).toBe(false)
    })

    it('should work with empty string', () => {
      expect(isAiMessage('')).toBe(false)
    })
  })

  describe('removeAiMarker', () => {
    it('should remove marker from marked messages', () => {
      const original = 'Hello world'
      const marked = markAsAiMessage(original)
      const cleaned = removeAiMarker(marked)

      expect(cleaned).toBe(original)
      expect(cleaned.length).toBe(original.length)
    })

    it('should not modify unmarked messages', () => {
      const message = 'Regular message'
      const result = removeAiMarker(message)
      expect(result).toBe(message)
    })

    it('should work with empty string', () => {
      expect(removeAiMarker('')).toBe('')
    })

    it('should handle message with marker at the end only', () => {
      const original = 'This is a test'
      const marked = original + AI_MESSAGE_MARKER
      expect(removeAiMarker(marked)).toBe(original)
    })
  })

  describe('Webhook Loop Prevention Integration', () => {
    it('should prevent AI message from being processed again', () => {
      // Simulate AI generating a response
      const aiResponse = 'Thank you for your message. How can I assist you?'

      // Mark it before sending to WhatsApp
      const markedMessage = markAsAiMessage(aiResponse)

      // Webhook receives the message
      // Check if it's an AI message and ignore
      expect(isAiMessage(markedMessage)).toBe(true)

      // This message should be ignored by the webhook
    })

    it('should process regular user messages', () => {
      const userMessage = 'Hello, I need help'

      // User message has no marker
      expect(isAiMessage(userMessage)).toBe(false)

      // This message should be processed normally
    })

    it('should handle the unlikely case of user accidentally including marker', () => {
      // Very unlikely, but if user somehow includes the marker
      const userMessageWithMarker = 'User message' + AI_MESSAGE_MARKER

      // It will be treated as AI message and ignored
      expect(isAiMessage(userMessageWithMarker)).toBe(true)

      // This is acceptable behavior since it's virtually impossible to occur accidentally
    })
  })

  describe('Marker Properties', () => {
    it('should use three zero-width spaces', () => {
      expect(AI_MESSAGE_MARKER).toBe('\u200B\u200B\u200B')
      expect(AI_MESSAGE_MARKER.length).toBe(3)
    })

    it('should be invisible to users', () => {
      const message = 'Hello world'
      const marked = markAsAiMessage(message)

      // The marked message should look the same to users
      // (they won't see the invisible characters)
      expect(marked.startsWith(message)).toBe(true)
    })

    it('should not affect message rendering', () => {
      const original = 'Test 123 😊'
      const marked = markAsAiMessage(original)

      // Should preserve emoji and special characters
      expect(removeAiMarker(marked)).toBe(original)
    })
  })
})
