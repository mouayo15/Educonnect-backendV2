// Export all models
const User = require('./User');
const Quiz = require('./Quiz');
const Exercise = require('./Exercise');
const Lesson = require('./Lesson');
const Achievement = require('./Achievement');
const { Subject, Chapter } = require('./Course');
const ActivityHistory = require('./ActivityHistory');
const RefreshToken = require('./RefreshToken');
const Leaderboard = require('./Leaderboard');

module.exports = {
  User,
  Quiz,
  Exercise,
  Lesson,
  Achievement,
  Subject,
  Chapter,
  ActivityHistory,
  RefreshToken,
  Leaderboard
};
