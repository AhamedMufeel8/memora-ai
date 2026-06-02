
const User = require('../models/User');
const Summary = require('../models/Summary');
const Quiz = require('../models/Quiz');
const QuizAttempt = require('../models/QuizAttempt');
const FlashcardDeck = require('../models/FlashcardDeck');
const FlashcardStudy = require('../models/FlashcardStudy');
const ChatSession = require('../models/ChatSession');
const StudyLog = require('../models/StudyLog');

const DAY_MS = 24 * 60 * 60 * 1000;

const startOfDay = (date) => {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
};

const shortDate = (date) => date.toISOString().slice(0, 10);

const formatRelativeTime = (date) => {
  const diffMs = Date.now() - new Date(date).getTime();
  const minutes = Math.max(Math.floor(diffMs / 60000), 0);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min${minutes === 1 ? '' : 's'} ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;

  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;

  return new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

const getItemDate = (item) => item.completedAt || item.lastStudied || item.createdAt || item.updatedAt;

const pushTopic = (map, topic, value, source) => {
  const cleanTopic = String(topic || '').trim();
  if (!cleanTopic) return;

  const existing = map.get(cleanTopic) || {
    topic: cleanTopic,
    total: 0,
    count: 0,
    source,
  };

  existing.total += value;
  existing.count += 1;
  map.set(cleanTopic, existing);
};

const getStreak = (dateKeys) => {
  let streak = 0;
  const cursor = startOfDay(new Date());

  while (dateKeys.has(shortDate(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
};

const formatStudyDuration = (seconds = 0) => {
  if (seconds <= 0) return '0m';
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) {
    const mins = Math.round(seconds / 60);
    return `${mins}m`;
  }
  const hrs = (seconds / 3600).toFixed(1);
  return `${hrs}h`;
};

const buildTrend = (current, previous, isTime = false) => {
  if (previous <= 0 && current <= 0) return 'No change';
  if (previous <= 0) {
    return isTime ? `+${formatStudyDuration(current)}` : `+${current}`;
  }

  const delta = Math.round(((current - previous) / previous) * 100);
  if (delta === 0) return 'No change';
  return `${delta > 0 ? '+' : ''}${delta}%`;
};

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getDashboard = async (req, res) => {
  try {
    const userId = req.user._id;
    const today = startOfDay(new Date());
    const tomorrow = new Date(today.getTime() + DAY_MS);
    const sevenDaysAgo = new Date(today.getTime() - 6 * DAY_MS);
    const previousSevenDaysAgo = new Date(today.getTime() - 13 * DAY_MS);

    const [
      summaries,
      quizzes,
      attempts,
      decks,
      studies,
      chatSessions,
      user,
      studyLogs,
    ] = await Promise.all([
      Summary.find({ userId }).sort({ createdAt: -1 }).lean(),
      Quiz.find({ userId }).sort({ createdAt: -1 }).select('-sourceText').lean(),
      QuizAttempt.find({ userId }).sort({ completedAt: -1 }).populate('quizId', 'title topics sourceName').lean(),
      FlashcardDeck.find({ userId }).sort({ updatedAt: -1 }).select('-sourceText').lean(),
      FlashcardStudy.find({ userId }).sort({ lastStudied: -1 }).lean(),
      ChatSession.find({ userId }).sort({ updatedAt: -1 }).lean(),
      User.findById(userId).select('xp badge').lean(),
      StudyLog.find({ userId, timestamp: { $gte: previousSevenDaysAgo } }).sort({ timestamp: -1 }).lean(),
    ]);

    const studyByDeck = new Map(studies.map((study) => [String(study.deckId), study]));
    const masteredCards = studies.reduce((sum, study) => sum + (study.masteredCards || 0), 0);
    const totalCards = decks.reduce((sum, deck) => sum + (deck.cardCount || deck.flashcards?.length || 0), 0);
    const studyTimeSeconds = studies.reduce((sum, study) => sum + (study.studyTime || 0), 0);
    const userChatCount = chatSessions.reduce((sum, session) => (
      sum + (session.messages || []).filter((message) => message.role === 'user').length
    ), 0);

    const allDatedEvents = [
      ...summaries.map((item) => ({ ...item, eventType: 'summary' })),
      ...quizzes.map((item) => ({ ...item, eventType: 'quiz' })),
      ...attempts.map((item) => ({ ...item, eventType: 'attempt' })),
      ...decks.map((item) => ({ ...item, eventType: 'deck' })),
      ...studies.map((item) => ({ ...item, eventType: 'study' })),
      ...chatSessions.map((item) => ({ ...item, eventType: 'chat' })),
    ].filter((item) => getItemDate(item));

    const activeDateKeys = new Set(allDatedEvents.map((item) => shortDate(new Date(getItemDate(item)))));
    const streak = getStreak(activeDateKeys);

    // Fallback: if there are no study logs but legacy study data exists, convert legacy study time to single events mapped to lastStudied
    let logsToUse = studyLogs;
    if (studyLogs.length === 0 && studies.length > 0) {
      logsToUse = studies
        .filter((study) => (study.studyTime || 0) > 0 && study.lastStudied)
        .map((study) => ({
          userId: study.userId,
          deckId: study.deckId,
          studyTime: study.studyTime,
          timestamp: study.lastStudied,
        }));
    }

    const todayStudySeconds = logsToUse
      .filter((log) => log.timestamp >= today && log.timestamp < tomorrow)
      .reduce((sum, log) => sum + (log.studyTime || 0), 0);

    const lastWeekStudySeconds = logsToUse
      .filter((log) => log.timestamp >= sevenDaysAgo)
      .reduce((sum, log) => sum + (log.studyTime || 0), 0);

    const previousWeekStudySeconds = logsToUse
      .filter((log) => log.timestamp >= previousSevenDaysAgo && log.timestamp < sevenDaysAgo)
      .reduce((sum, log) => sum + (log.studyTime || 0), 0);

    const completedAttemptsThisWeek = attempts.filter((attempt) => attempt.completedAt >= sevenDaysAgo);
    const previousAttempts = attempts.filter((attempt) => attempt.completedAt >= previousSevenDaysAgo && attempt.completedAt < sevenDaysAgo);
    const averageScore = attempts.length
      ? Math.round(attempts.reduce((sum, attempt) => sum + attempt.percentage, 0) / attempts.length)
      : 0;
    const aiLearningScore = totalCards || attempts.length
      ? Math.round(((totalCards ? (masteredCards / totalCards) * 100 : averageScore) + (attempts.length ? averageScore : 0)) / (totalCards && attempts.length ? 2 : 1))
      : 0;

    const weeklyStudyTime = Array.from({ length: 7 }).map((_, index) => {
      const day = new Date(sevenDaysAgo.getTime() + index * DAY_MS);
      const key = shortDate(day);
      const seconds = logsToUse
        .filter((log) => shortDate(new Date(log.timestamp)) === key)
        .reduce((sum, log) => sum + (log.studyTime || 0), 0);

      return {
        name: day.toLocaleDateString(undefined, { weekday: 'short' }),
        hours: Number((seconds / 3600).toFixed(2)),
      };
    });

    const topicMap = new Map();
    decks.forEach((deck) => {
      const study = studyByDeck.get(String(deck._id));
      const total = deck.cardCount || deck.flashcards?.length || 0;
      const mastery = total ? Math.round(((study?.masteredCards || 0) / total) * 100) : 0;
      const topics = deck.topics?.length ? deck.topics : [deck.title || deck.sourceName];
      topics.forEach((topic) => pushTopic(topicMap, topic, mastery, 'flashcards'));
    });

    attempts.forEach((attempt) => {
      const quiz = attempt.quizId || {};
      const topics = quiz.topics?.length ? quiz.topics : [quiz.title || quiz.sourceName];
      topics.forEach((topic) => pushTopic(topicMap, topic, attempt.percentage, 'quiz'));
    });

    const subjectMastery = Array.from(topicMap.values())
      .map((item) => ({
        subject: item.topic,
        value: Math.round(item.total / item.count),
        source: item.source,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);

    const weakTopics = subjectMastery
      .filter((topic) => topic.value < 70)
      .sort((a, b) => a.value - b.value)
      .slice(0, 4);

    const continueLearning = decks
      .map((deck) => {
        const study = studyByDeck.get(String(deck._id));
        const total = deck.cardCount || deck.flashcards?.length || 0;
        const progress = total ? Math.round(((study?.masteredCards || 0) / total) * 100) : 0;
        return {
          id: deck._id,
          title: deck.title,
          subtitle: deck.sourceName,
          progress,
          href: '/flashcards',
          updatedAt: study?.lastStudied || deck.updatedAt || deck.createdAt,
        };
      })
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      .slice(0, 3);

    const recommendations = [];
    weakTopics.forEach((topic) => recommendations.push(`Practice ${topic.subject}`));
    if (quizzes.length && !attempts.length) recommendations.push(`Take ${quizzes[0].title}`);
    if (decks.length) recommendations.push(`Review flashcards from ${decks[0].title}`);
    if (summaries.length) recommendations.push(`Revise your latest summary`);
    if (!recommendations.length) recommendations.push('Upload notes, generate a quiz, or create flashcards to unlock recommendations');

    const recentActivity = allDatedEvents
      .sort((a, b) => new Date(getItemDate(b)) - new Date(getItemDate(a)))
      .slice(0, 8)
      .map((item) => {
        const labels = {
          summary: 'Generated AI summary',
          quiz: `Created quiz: ${item.title || 'Untitled quiz'}`,
          attempt: `Completed quiz: ${item.quizId?.title || 'Quiz'}`,
          deck: `Created flashcards: ${item.title || 'Flashcard deck'}`,
          study: 'Studied flashcards',
          chat: `Used AI tutor: ${item.title || 'Chat session'}`,
        };

        return {
          id: String(item._id),
          type: item.eventType,
          text: labels[item.eventType],
          time: formatRelativeTime(getItemDate(item)),
        };
      });

    const achievements = [
      { id: 'streak', title: `${streak} Day Streak`, unlocked: streak > 0 },
      { id: 'flashcards', title: `${masteredCards} Flashcards Mastered`, unlocked: masteredCards > 0 },
      { id: 'chats', title: `${userChatCount} AI Tutor Chats`, unlocked: userChatCount > 0 },
      { id: 'quiz-score', title: `${Math.max(...attempts.map((attempt) => attempt.percentage), 0)}% Best Quiz Score`, unlocked: attempts.length > 0 },
    ];

    res.json({
      success: true,
      data: {
        overview: {
          studyTimeToday: todayStudySeconds,
          currentStreak: streak,
          topicsMastered: subjectMastery.filter((topic) => topic.value >= 80).length,
          aiLearningScore,
          trends: {
            studyTimeToday: buildTrend(todayStudySeconds, Math.round(lastWeekStudySeconds / 7), true),
            currentStreak: `${streak} active day${streak === 1 ? '' : 's'}`,
            topicsMastered: `${subjectMastery.length} tracked`,
            aiLearningScore: buildTrend(completedAttemptsThisWeek.length, previousAttempts.length),
          },
        },
        continueLearning,
        recommendations: recommendations.slice(0, 5),
        weeklyStudyTime,
        analytics: {
          totalHours: formatStudyDuration(lastWeekStudySeconds),
          averageDailyHours: formatStudyDuration(Math.round(lastWeekStudySeconds / 7)),
          productivityTrend: buildTrend(lastWeekStudySeconds, previousWeekStudySeconds, true),
        },
        subjectMastery,
        weakTopics,
        achievements,
        recentActivity,
        resourceUsage: {
          pdfsUploaded: quizzes.filter((quiz) => quiz.sourceType === 'pdf').length + decks.filter((deck) => deck.sourceType === 'pdf').length,
          summariesGenerated: summaries.length,
          flashcardsCreated: totalCards,
          quizzesTaken: attempts.length,
          aiTutorChats: userChatCount,
          audioLessonsListened: 0,
        },
        weeklyGoal: {
          label: 'Study 10 Hours',
          targetHours: 10,
          completedHours: Number((lastWeekStudySeconds / 3600).toFixed(1)),
          percentage: Math.min(Math.round((lastWeekStudySeconds / 36000) * 100), 100),
        },
        user: {
          xp: user?.xp || 0,
          badge: user?.badge || 'Scholar',
        },
      },
    });
  } catch (error) {
    console.error('[Dashboard] Analytics error:', error);
    res.status(500).json({ success: false, message: error.message || 'Could not load dashboard analytics' });
  }
};
