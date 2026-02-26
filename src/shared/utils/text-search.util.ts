// src/shared/utils/text-search.util.ts
/**
 * Text Search Utility
 * 
 * Provides functions to strip markdown, normalize text, and optimize search queries
 * for better content search experience
 */
export class TextSearchUtil {
  /**
   * Strip markdown, HTML, MathJax, and special characters for search
   * 
   * @param content - Raw content with markdown/HTML/LaTeX
   * @returns Clean searchable text in lowercase
   * 
   * @example
   * TextSearchUtil.stripMarkdownForSearch("**Tính đạo hàm** của hàm số $y = x^2$")
   * // Returns: "tính đạo hàm của hàm số"
   */
  static stripMarkdownForSearch(content: string): string {
    if (!content) return ''
    
    let text = content
    
    // 1. Remove MathJax/LaTeX inline: $...$
    text = text.replace(/\$[^$]+\$/g, ' ')
    
    // 2. Remove MathJax/LaTeX block: $$...$$
    text = text.replace(/\$\$[\s\S]*?\$\$/g, ' ')
    
    // 3. Remove LaTeX block: \[...\]
    text = text.replace(/\\\[[\s\S]*?\\\]/g, ' ')
    
    // 4. Remove LaTeX inline: \(...\)
    text = text.replace(/\\\([\s\S]*?\\\)/g, ' ')
    
    // 5. Remove HTML tags: <tag>...</tag>
    text = text.replace(/<[^>]+>/g, ' ')
    
    // 6. Remove markdown images: ![alt](url)
    text = text.replace(/!\[([^\]]*)\]\([^\)]+\)/g, '$1')
    
    // 7. Remove markdown links: [text](url) -> keep text only
    text = text.replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
    
    // 8. Remove markdown bold/italic: **text**, *text*, __text__, _text_
    text = text.replace(/[*_]{1,2}([^*_]+)[*_]{1,2}/g, '$1')
    
    // 9. Remove markdown headers: # Header, ## Header, etc.
    text = text.replace(/^#{1,6}\s+/gm, '')
    
    // 10. Remove markdown inline code: `code`
    text = text.replace(/`([^`]+)`/g, '$1')
    
    // 11. Remove markdown code blocks: ```code```
    text = text.replace(/```[\s\S]*?```/g, ' ')
    
    // 12. Remove blockquotes: > quote
    text = text.replace(/^>\s+/gm, '')
    
    // 13. Remove horizontal rules: ---, ***, ___
    text = text.replace(/^[-*_]{3,}$/gm, '')
    
    // 14. Remove unordered list markers: -, *, +
    text = text.replace(/^[\s]*[-*+]\s+/gm, '')
    
    // 15. Remove ordered list markers: 1., 2., etc.
    text = text.replace(/^[\s]*\d+\.\s+/gm, '')
    
    // 16. Remove strikethrough: ~~text~~
    text = text.replace(/~~([^~]+)~~/g, '$1')
    
    // 17. Remove tables (basic cleanup)
    text = text.replace(/\|/g, ' ')
    
    // 18. Keep only letters, numbers, spaces, and Vietnamese characters
    // Vietnamese: À-ỹ (uppercase), à-ỹ (lowercase)
    text = text.replace(/[^\w\sÀ-ỹà-ỹ]/g, ' ')
    
    // 19. Normalize whitespace: multiple spaces -> single space
    text = text.replace(/\s+/g, ' ').trim()
    
    // 20. Convert to lowercase for case-insensitive search
    return text.toLowerCase()
  }

  /**
   * Vietnamese accent mapping for normalization
   * @private
   */
  private static VIETNAMESE_MAP: { [key: string]: string } = {
    'à': 'a', 'á': 'a', 'ạ': 'a', 'ả': 'a', 'ã': 'a',
    'â': 'a', 'ầ': 'a', 'ấ': 'a', 'ậ': 'a', 'ẩ': 'a', 'ẫ': 'a',
    'ă': 'a', 'ằ': 'a', 'ắ': 'a', 'ặ': 'a', 'ẳ': 'a', 'ẵ': 'a',
    'è': 'e', 'é': 'e', 'ẹ': 'e', 'ẻ': 'e', 'ẽ': 'e',
    'ê': 'e', 'ề': 'e', 'ế': 'e', 'ệ': 'e', 'ể': 'e', 'ễ': 'e',
    'ì': 'i', 'í': 'i', 'ị': 'i', 'ỉ': 'i', 'ĩ': 'i',
    'ò': 'o', 'ó': 'o', 'ọ': 'o', 'ỏ': 'o', 'õ': 'o',
    'ô': 'o', 'ồ': 'o', 'ố': 'o', 'ộ': 'o', 'ổ': 'o', 'ỗ': 'o',
    'ơ': 'o', 'ờ': 'o', 'ớ': 'o', 'ợ': 'o', 'ở': 'o', 'ỡ': 'o',
    'ù': 'u', 'ú': 'u', 'ụ': 'u', 'ủ': 'u', 'ũ': 'u',
    'ư': 'u', 'ừ': 'u', 'ứ': 'u', 'ự': 'u', 'ử': 'u', 'ữ': 'u',
    'ỳ': 'y', 'ý': 'y', 'ỵ': 'y', 'ỷ': 'y', 'ỹ': 'y',
    'đ': 'd',
    'À': 'A', 'Á': 'A', 'Ạ': 'A', 'Ả': 'A', 'Ã': 'A',
    'Â': 'A', 'Ầ': 'A', 'Ấ': 'A', 'Ậ': 'A', 'Ẩ': 'A', 'Ẫ': 'A',
    'Ă': 'A', 'Ằ': 'A', 'Ắ': 'A', 'Ặ': 'A', 'Ẳ': 'A', 'Ẵ': 'A',
    'È': 'E', 'É': 'E', 'Ẹ': 'E', 'Ẻ': 'E', 'Ẽ': 'E',
    'Ê': 'E', 'Ề': 'E', 'Ế': 'E', 'Ệ': 'E', 'Ể': 'E', 'Ễ': 'E',
    'Ì': 'I', 'Í': 'I', 'Ị': 'I', 'Ỉ': 'I', 'Ĩ': 'I',
    'Ò': 'O', 'Ó': 'O', 'Ọ': 'O', 'Ỏ': 'O', 'Õ': 'O',
    'Ô': 'O', 'Ồ': 'O', 'Ố': 'O', 'Ộ': 'O', 'Ổ': 'O', 'Ỗ': 'O',
    'Ơ': 'O', 'Ờ': 'O', 'Ớ': 'O', 'Ợ': 'O', 'Ở': 'O', 'Ỡ': 'O',
    'Ù': 'U', 'Ú': 'U', 'Ụ': 'U', 'Ủ': 'U', 'Ũ': 'U',
    'Ư': 'U', 'Ừ': 'U', 'Ứ': 'U', 'Ự': 'U', 'Ử': 'U', 'Ữ': 'U',
    'Ỳ': 'Y', 'Ý': 'Y', 'Ỵ': 'Y', 'Ỷ': 'Y', 'Ỹ': 'Y',
    'Đ': 'D'
  }

  /**
   * Remove Vietnamese accents from text
   * 
   * @param text - Text with Vietnamese accents
   * @returns Text without accents
   * 
   * @example
   * TextSearchUtil.removeVietnameseAccents("Nguyễn Minh Đức")
   * // Returns: "Nguyen Minh Duc"
   */
  static removeVietnameseAccents(text: string): string {
    if (!text) return ''
    
    return text.split('').map(char => this.VIETNAMESE_MAP[char] || char).join('')
  }

  /**
   * Generate slug from Vietnamese text
   * 
   * @param text - Text to convert to slug
   * @returns URL-friendly slug
   * 
   * @example
   * TextSearchUtil.generateSlug("Tính đạo hàm của hàm số")
   * // Returns: "tinh-dao-ham-cua-ham-so"
   */
  static generateSlug(text: string): string {
    if (!text) return ''
    
    let slug = text.toLowerCase().trim()
    
    // Replace Vietnamese characters using the shared mapping
    slug = this.removeVietnameseAccents(slug)
    
    // Remove special characters
    slug = slug.replace(/[^a-z0-9\s-]/g, '')
    
    // Replace spaces and multiple dashes with single dash
    slug = slug.replace(/[\s-]+/g, '-')
    
    // Remove leading/trailing dashes
    slug = slug.replace(/^-+|-+$/g, '')
    
    // Limit length
    slug = slug.substring(0, 200)
    
    return slug
  }

  /**
   * Generate unique slug with timestamp or counter
   * 
   * @param text - Text to convert to slug
   * @param existingSlugs - Array of existing slugs to check for uniqueness
   * @returns Unique slug
   * 
   * @example
   * TextSearchUtil.generateUniqueSlug("Test", ["test", "test-1"])
   * // Returns: "test-2"
   */
  static generateUniqueSlug(text: string, existingSlugs: string[] = []): string {
    const baseSlug = this.generateSlug(text)
    
    if (!existingSlugs.includes(baseSlug)) {
      return baseSlug
    }
    
    // Add timestamp suffix
    const timestamp = Date.now().toString().slice(-6)
    return `${baseSlug}-${timestamp}`
  }

  /**
   * Parse search query into individual terms
   * 
   * @param searchQuery - User's search input
   * @returns Array of search terms (lowercase, trimmed)
   * 
   * @example
   * TextSearchUtil.parseSearchTerms("Tính đạo hàm")
   * // Returns: ["tính", "đạo", "hàm"]
   */
  static parseSearchTerms(searchQuery: string): string[] {
    if (!searchQuery) return []
    
    return searchQuery
      .toLowerCase()
      .trim()
      .split(/\s+/)
      .filter(term => term.length > 1) // Ignore single characters
  }

  /**
   * Build Prisma search conditions for OR query
   * Searches across multiple fields with both stripped and original content
   * 
   * @param searchQuery - User's search input
   * @returns Array of Prisma where conditions
   * 
   * @example
   * const conditions = TextSearchUtil.buildPrismaSearchConditions("đạo hàm")
   * prisma.question.findMany({ where: { OR: conditions } })
   */
  static buildPrismaSearchConditions(searchQuery: string): any[] {
    if (!searchQuery) return []
    
    const strippedQuery = this.stripMarkdownForSearch(searchQuery)
    const originalQuery = searchQuery.trim()
    
    const conditions: any[] = []
    
    // Search in searchableContent (most relevant - already stripped)
    if (strippedQuery) {
      conditions.push({
        searchableContent: { contains: strippedQuery, mode: 'insensitive' }
      })
    }
    
    // Search in original content (in case markdown syntax is part of search)
    if (originalQuery) {
      conditions.push({
        content: { contains: originalQuery, mode: 'insensitive' }
      })
    }
    
    // Search in correct answer
    if (originalQuery) {
      conditions.push({
        correctAnswer: { contains: originalQuery, mode: 'insensitive' }
      })
    }
    
    // Search in solution (stripped for better match)
    if (strippedQuery) {
      conditions.push({
        solution: { contains: strippedQuery, mode: 'insensitive' }
      })
    }
    
    return conditions
  }

  /**
   * Build MySQL FULLTEXT search query
   * Only use when FULLTEXT index is available
   * 
   * @param searchQuery - User's search input
   * @returns MySQL FULLTEXT query string
   * 
   * @example
   * const ftQuery = TextSearchUtil.buildFullTextQuery("đạo hàm")
   * // Returns: "+đạo +hàm" (boolean mode)
   */
  static buildFullTextQuery(searchQuery: string): string {
    if (!searchQuery) return ''
    
    const terms = this.parseSearchTerms(searchQuery)
    
    // Boolean mode: require all terms
    return terms.map(term => `+${term}`).join(' ')
  }

  /**
   * Calculate relevance score for search results
   * Higher score = more relevant
   * 
   * @param text - Text to score
   * @param searchQuery - Search query
   * @returns Relevance score (0-100)
   * 
   * @example
   * TextSearchUtil.calculateRelevanceScore("Tính đạo hàm", "đạo hàm")
   * // Returns: 60 (exact phrase match + term matches)
   */
  static calculateRelevanceScore(text: string, searchQuery: string): number {
    if (!text || !searchQuery) return 0
    
    const normalizedText = text.toLowerCase()
    const normalizedQuery = searchQuery.toLowerCase()
    const terms = this.parseSearchTerms(normalizedQuery)
    
    let score = 0
    
    // Exact phrase match: +50 points
    if (normalizedText.includes(normalizedQuery)) {
      score += 50
    }
    
    // Each term found: +10 points
    terms.forEach(term => {
      if (normalizedText.includes(term)) {
        score += 10
      }
    })
    
    // Phrase at beginning: +20 points (title match)
    if (normalizedText.startsWith(normalizedQuery)) {
      score += 20
    }
    
    // All terms found: +15 points
    const allTermsFound = terms.every(term => normalizedText.includes(term))
    if (allTermsFound && terms.length > 1) {
      score += 15
    }
    
    return Math.min(score, 100)
  }

  /**
   * Truncate text for preview with search term highlighting context
   * 
   * @param text - Full text
   * @param searchQuery - Search query to find context
   * @param maxLength - Maximum length of preview
   * @returns Truncated text with context around search term
   */
  static getSearchPreview(text: string, searchQuery: string, maxLength: number = 200): string {
    if (!text) return ''
    if (!searchQuery || text.length <= maxLength) {
      return text.substring(0, maxLength)
    }
    
    const lowerText = text.toLowerCase()
    const lowerQuery = searchQuery.toLowerCase()
    const queryIndex = lowerText.indexOf(lowerQuery)
    
    if (queryIndex === -1) {
      // Query not found, return beginning
      return text.substring(0, maxLength) + '...'
    }
    
    // Center the preview around the search term
    const contextLength = Math.floor((maxLength - searchQuery.length) / 2)
    let start = Math.max(0, queryIndex - contextLength)
    let end = Math.min(text.length, queryIndex + searchQuery.length + contextLength)
    
    let preview = text.substring(start, end)
    
    if (start > 0) preview = '...' + preview
    if (end < text.length) preview = preview + '...'
    
    return preview
  }
}
