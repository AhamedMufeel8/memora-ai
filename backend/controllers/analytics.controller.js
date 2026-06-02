const StudySession = require('../models/StudySession');

const MINUTE_MS = 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

const startOfWeekMonday = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay(); // Sun=0..Sat=6
  const diffToMonday = (day + 6) % 7; // Mon=0, Tue=1, ... Sun=6
  d.setDate(d.getDate() - diffToMonday);
  return d;
};

const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const clampMinutes = (value) => {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.round(n);
};

exports.startSession = async (req, res) => {
  try {
    const userId = req.user._id;
    const { feature } = req.body || {};

    if (!feature || typeof feature !== 'string') {
      return res.status(400).json({ success: false, message: 'feature is required' });
    }

    const session = await StudySession.create({
      userId,
      feature: feature.trim(),
      startTime: new Date(),
    });

    return res.json({ success: true, data: { sessionId: session._id } });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Could not start session' });
  }
};

exports.endSession = async (req, res) => {
  try {
    const userId = req.user._id;
    const { sessionId } = req.body || {};

    if (!sessionId) {
      return res.status(400).json({ success: false, message: 'sessionId is required' });
    }

    const session = await StudySession.findOne({ _id: sessionId, userId });
    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    if (session.endTime) {
      return res.json({ success: true, data: { sessionId: session._id, durationMinutes: session.durationMinutes || 0 } });
    }

    const endTime = new Date();
    const durationMinutes = clampMinutes((endTime.getTime() - new Date(session.startTime).getTime()) / MINUTE_MS);

    session.endTime = endTime;
    session.durationMinutes = durationMinutes;
    await session.save();

    return res.json({ success: true, data: { sessionId: session._id, durationMinutes } });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Could not end session' });
  }
};

exports.getWeeklyStudyTime = async (req, res) => {
  try {
    const userId = req.user._id;
    const now = new Date();
    const weekStart = startOfWeekMonday(now);
    const weekEnd = new Date(weekStart.getTime() + 7 * DAY_MS);

    const rows = await StudySession.aggregate([
      {
        $match: {
          userId,
          startTime: { $gte: weekStart, $lt: weekEnd },
          endTime: { $ne: null },
          durationMinutes: { $ne: null },
        },
      },
      {
        $project: {
          durationMinutes: 1,
          // Monday index: 0..6
          dow: {
            $mod: [{ $add: [{ $dayOfWeek: '$startTime' }, 5] }, 7],
          },
        },
      },
      {
        $group: {
          _id: '$dow',
          minutes: { $sum: '$durationMinutes' },
        },
      },
    ]);

    const minutesByDay = Array(7).fill(0);
    rows.forEach((row) => {
      const idx = Number(row._id);
      if (idx >= 0 && idx <= 6) minutesByDay[idx] = clampMinutes(row.minutes);
    });

    const days = dayLabels.map((day, idx) => ({ day, minutes: minutesByDay[idx] }));
    const weeklyTotalMinutes = minutesByDay.reduce((sum, n) => sum + n, 0);
    const dailyAverageMinutes = Math.round(weeklyTotalMinutes / 7);

    return res.json({
      success: true,
      data: {
        days,
        weeklyTotalMinutes,
        dailyAverageMinutes,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Could not load weekly study time' });
  }
};

