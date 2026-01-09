const { query } = require('../config/database');

class Subject {
  /**
   * Find all subjects
   */
  static async findAll() {
    const result = await query(
      'SELECT * FROM subjects ORDER BY order_index ASC'
    );
    return result.rows;
  }

  /**
   * Find subject by ID
   */
  static async findById(id) {
    const result = await query(
      'SELECT * FROM subjects WHERE id = $1',
      [id]
    );
    return result.rows[0];
  }

  /**
   * Find subject by key
   */
  static async findByKey(key) {
    const result = await query(
      'SELECT * FROM subjects WHERE key = $1',
      [key]
    );
    return result.rows[0];
  }
}

class Chapter {
  /**
   * Find chapters by subject
   */
  static async findBySubject(subjectId) {
    const result = await query(
      `SELECT c.*, 
              (SELECT COUNT(*) FROM lessons WHERE chapter_id = c.id) as lesson_count
       FROM chapters c
       WHERE c.subject_id = $1
       ORDER BY c.order_index ASC`,
      [subjectId]
    );
    return result.rows;
  }

  /**
   * Find chapter by ID
   */
  static async findById(id) {
    const result = await query(
      `SELECT c.*,
              s.name as subject_name,
              (SELECT COUNT(*) FROM lessons WHERE chapter_id = c.id) as lesson_count
       FROM chapters c
       JOIN subjects s ON c.subject_id = s.id
       WHERE c.id = $1`,
      [id]
    );
    return result.rows[0];
  }
}

module.exports = { Subject, Chapter };
