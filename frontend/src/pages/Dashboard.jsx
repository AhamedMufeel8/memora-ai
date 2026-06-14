import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Brain,
  CheckCircle2,
  Clock3,
  FileText,
  Flame,
  Headphones,
  Loader2,
  MessageCircle,
  Sparkles,
  Trophy,
} from 'lucide-react';
import { dashboardService } from '../services/dashboard.service';
import { analyticsService } from '../services/analytics.service';
import { Skeleton } from '../components/Skeleton';

const emptyDashboard = {
  overview: {
    studyTimeToday: 0,
    currentStreak: 0,
    topicsMastered: 0,
    aiLearningScore: 0,
    trends: {},
  },
  weeklyStudyTime: [],
  analytics: {
    totalHours: 0,
    averageDailyHours: 0,
    productivityTrend: 'No change',
  },
  recentActivity: [],
  resourceUsage: {},
};

const metricCards = (overview) => [
 
  {
    label: 'Topics Mastered',
    value: overview.topicsMastered,
    icon: Trophy,
    color: 'text-aiAccent dark:text-emerald-500',
    bg: 'bg-aiPrimary/10 dark:bg-emerald-500/10',
  },
  {
    label: 'AI Learning Score',
    value: `${overview.aiLearningScore}%`,
    icon: Brain,
    color: 'text-aiAccent dark:text-indigo-500',
    bg: 'bg-aiPrimary/10 dark:bg-indigo-500/10',
  },
];

const resourceItems = (usage = {}) => [
  { label: 'PDFs Uploaded', value: usage.pdfsUploaded || 0, icon: FileText, tone: 'cyan' },
  { label: 'Summaries Generated', value: usage.summariesGenerated || 0, icon: Sparkles, tone: 'indigo' },
  { label: 'Flashcards Created', value: usage.flashcardsCreated || 0, icon: BookOpen, tone: 'emerald' },
  { label: 'Quizzes Taken', value: usage.quizzesTaken || 0, icon: CheckCircle2, tone: 'violet' },
  { label: 'AI Queries', value: usage.aiTutorChats || 0, icon: MessageCircle, tone: 'amber' },
].sort((a, b) => Number(b.value > 0) - Number(a.value > 0));

const resourceTone = {
  cyan: 'border-aiAccent/25 bg-aiPrimary/10 text-aiAccent dark:text-cyan-300',
  indigo: 'border-aiAccent/25 bg-aiPrimary/10 text-aiAccent dark:text-indigo-300',
  emerald: 'border-aiAccent/25 bg-aiPrimary/10 text-aiAccent dark:text-emerald-300',
  violet: 'border-aiAccent/25 bg-aiPrimary/10 text-aiAccent dark:text-violet-300',
  amber: 'border-aiAccent/25 bg-aiPrimary/10 text-aiAccent dark:text-amber-300',
  rose: 'border-aiAccent/25 bg-aiPrimary/10 text-aiAccent dark:text-rose-300',
};

const Section = ({ title, icon: Icon, action, children, className = '' }) => (
  <section className={`ai-card p-4 sm:p-5 dark:border-slate-800/80 dark:bg-slate-900/65 ${className}`}>
    <div className="mb-4 flex items-center justify-between gap-3">
      <h3 className="flex items-center gap-2 text-sm font-bold text-slate-850 dark:text-white">
        {Icon && <Icon className="h-4 w-4 text-aiAccent dark:text-indigo-500" />}
        {title}
      </h3>
      {action}
    </div>
    {children}
  </section>
);

const EmptyState = ({ children }) => (
  <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50/70 px-4 py-8 text-center text-xs font-semibold text-slate-400 dark:border-slate-800 dark:bg-slate-950/20">
    {children}
  </div>
);

const formatMinutes = (minutes = 0) => {
  const m = Math.max(0, Math.round(Number(minutes) || 0));
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return rem ? `${h}h ${rem}m` : `${h}h`;
};

export const Dashboard = () => {
  const [dashboard, setDashboard] = useState(emptyDashboard);
  const [isLoading, setIsLoading] = useState(true);
  const [weekly, setWeekly] = useState({ days: [], weeklyTotalMinutes: 0, dailyAverageMinutes: 0 });
  const [weeklyLoading, setWeeklyLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const loadDashboard = async () => {
      setIsLoading(true);

      try {
        const response = await dashboardService.getDashboard();
        if (active) setDashboard({ ...emptyDashboard, ...(response.data || {}) });
      } catch (error) {
        if (active) {
          console.warn('[Dashboard] Analytics unavailable:', error);
          setDashboard(emptyDashboard);
        }
      } finally {
        if (active) setIsLoading(false);
      }
    };

    const loadWeekly = async () => {
      setWeeklyLoading(true);
      try {
        const response = await analyticsService.getWeeklyStudyTime();
        if (active) {
          setWeekly({
            days: response?.data?.days || [],
            weeklyTotalMinutes: response?.data?.weeklyTotalMinutes || 0,
            dailyAverageMinutes: response?.data?.dailyAverageMinutes || 0,
          });
        }
      } catch (error) {
        if (active) {
          console.warn('[Dashboard] Weekly study time unavailable:', error);
          setWeekly({ days: [], weeklyTotalMinutes: 0, dailyAverageMinutes: 0 });
        }
      } finally {
        if (active) setWeeklyLoading(false);
      }
    };

    loadDashboard();
    loadWeekly();
    return () => {
      active = false;
    };
  }, []);

  const chartData = useMemo(() => {
    const fromApi = weekly.days?.length
      ? weekly.days
      : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => ({ day, minutes: 0 }));

    return fromApi.map((d) => ({
      name: d.day,
      minutes: Math.max(0, Math.round(Number(d.minutes) || 0)),
    }));
  }, [weekly.days]);

  const hasWeeklyActivity = useMemo(() => chartData.some((d) => d.minutes > 0), [chartData]);

  if (isLoading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center rounded-xl border border-slate-200/80 bg-white/70 dark:border-slate-800/80 dark:bg-slate-900/65">
        <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-indigo-500" style={{ margin: 0 }}>Today&apos;s Learning Overview</p>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white" style={{ margin: '0.8rem 0 0.5rem 0' }}>
            A quick overview of your learning activity and progress.
          </h2>
        </div>
       
      </div>

      {/* Website Features Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { name: 'AI Summarizer', icon: Sparkles, to: '/summarizer', color: 'text-aiAccent dark:text-indigo-500', bg: 'bg-aiPrimary/10 dark:bg-indigo-500/10' },
          { name: 'AI Flashcards', icon: BookOpen, to: '/flashcards', color: 'text-aiAccent dark:text-emerald-500', bg: 'bg-aiPrimary/10 dark:bg-emerald-500/10' },
          { name: 'Smart Quizzes', icon: CheckCircle2, to: '/quiz', color: 'text-aiAccent dark:text-violet-500', bg: 'bg-aiPrimary/10 dark:bg-violet-500/10' },
          { name: 'AI Tutor Chat', icon: MessageCircle, to: '/chat', color: 'text-aiAccent dark:text-amber-500', bg: 'bg-aiPrimary/10 dark:bg-amber-500/10' },
          { name: 'Book Library', icon: FileText, to: '/books', color: 'text-aiAccent dark:text-cyan-500', bg: 'bg-aiPrimary/10 dark:bg-cyan-500/10' },
        ].map((feature) => (
          <Link
            key={feature.name}
            to={feature.to}
            className="flex flex-col items-center justify-center gap-2 rounded-xl border border-slate-200/80 bg-white/75 p-4 text-center transition-colors hover:border-indigo-400 hover:bg-white dark:border-slate-800/80 dark:bg-slate-900/65 dark:hover:border-indigo-500/50 dark:hover:bg-slate-900"
          >
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${feature.bg} ${feature.color}`}>
              <feature.icon className="h-5 w-5" />
            </div>
            <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">{feature.name}</span>
          </Link>
        ))}
      </div>

     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
  {metricCards(dashboard.overview).map((card) => (
    <motion.div
      key={card.label}
      whileHover={{ y: -3 }}
      className="rounded-xl border border-slate-200/80 bg-white/75 p-5 shadow-sm backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-900/65 min-h-[130px] flex items-center"
    >
      <div className="flex w-full items-center justify-between">
        <div className="flex flex-col justify-center">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            {card.label}
          </p>

          <h3 className="mt-3 text-3xl font-extrabold leading-none text-slate-900 dark:text-white">
            {card.value}
          </h3>
        </div>

        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${card.bg} ${card.color}`}
        >
          <card.icon className="h-6 w-6" />
        </div>
      </div>
    </motion.div>
  ))}
</div>

      <div className="grid grid-cols-1 gap-6">
        <Section title="Weekly Study Time" icon={BarChart3}>
          {weeklyLoading ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                <Skeleton className="h-16 rounded-lg" count={3} />
              </div>
              <Skeleton className="h-64 rounded-lg" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {[
                  ['Weekly Total', formatMinutes(weekly.weeklyTotalMinutes)],
                  ['Daily Average', formatMinutes(weekly.dailyAverageMinutes)],
                  ['Total Study Time', formatMinutes(weekly.weeklyTotalMinutes)],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-lg bg-slate-50 p-3 dark:bg-slate-950/20">
                    <p className="text-[10px] font-bold uppercase text-slate-400">{label}</p>
                    <p className="mt-1 text-lg font-black text-slate-850 dark:text-white">{value}</p>
                  </div>
                ))}
              </div>

              {!hasWeeklyActivity ? (
                <div className="mt-5">
                  <EmptyState>No study activity recorded this week.</EmptyState>
                </div>
              ) : (
                <div className="mt-5 h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                      <defs>
                        <linearGradient id="studyMinutes" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={11} />
                      <YAxis axisLine={false} tickLine={false} fontSize={11} unit="m" />
                      <Tooltip
                        contentStyle={{
                          background: 'rgba(15, 23, 42, 0.95)',
                          border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: '8px',
                          color: '#fff',
                          fontSize: '12px',
                        }}
                        formatter={(value) => [`Studied ${value} minutes`, 'Study Time']}
                      />
                      <Area
                        type="monotone"
                        dataKey="minutes"
                        stroke="#14b8a6"
                        strokeWidth={2.5}
                        fill="url(#studyMinutes)"
                        isAnimationActive
                        animationDuration={650}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </>
          )}
        </Section>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
        <Section title="Recent Activity" icon={Clock3} className="xl:col-span-3">
          {dashboard.recentActivity.length ? (
            <div className="flex flex-col gap-4">
              {dashboard.recentActivity.map((activity, index) => (
                <div key={`${activity.type}-${activity.id}`} className={`relative pl-6 ${index !== dashboard.recentActivity.length - 1 ? 'before:absolute before:left-2 before:top-4 before:h-full before:w-px before:bg-slate-200 dark:before:bg-slate-800' : ''}`}>
                  <span className="absolute left-0 top-1.5 h-4 w-4 rounded-full border-2 border-indigo-500 bg-white dark:bg-slate-900" />
                  <p className="text-xs font-bold text-slate-750 dark:text-slate-300">{activity.text}</p>
                  <p className="mt-1 text-[10px] font-semibold text-slate-400">{activity.time}</p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState>Your real study actions will appear here.</EmptyState>
          )}
        </Section>

        <Section title="Resource Usage" icon={BookOpen} className="xl:col-span-2">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-3">
            {resourceItems(dashboard.resourceUsage).map(({ label, value, icon: Icon, tone }) => {
              const isUsed = value > 0;
              return (
              <div
                key={label}
                className={`rounded-lg border p-3 transition-colors ${isUsed
                  ? resourceTone[tone]
                  : 'border-slate-200 bg-slate-50 text-slate-400 dark:border-slate-800 dark:bg-slate-950/20'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <Icon className={`h-4 w-4 ${isUsed ? '' : 'text-slate-400'}`} />
                  <span className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase ${isUsed
                    ? 'bg-white/70 text-slate-700 dark:bg-slate-950/30 dark:text-white'
                    : 'bg-slate-200/70 text-slate-500 dark:bg-slate-800'
                  }`}>
                    {isUsed ? 'Used' : 'Unused'}
                  </span>
                </div>
                <p className={`mt-3 text-2xl font-black ${isUsed ? '' : 'text-slate-500 dark:text-slate-400'}`}>{value}</p>
                <p className={`mt-1 text-[10px] font-bold ${isUsed ? 'text-slate-700 dark:text-slate-200' : 'text-slate-400'}`}>{label}</p>
              </div>
              );
            })}
          </div>
        </Section>
      </div>
    </div>
  );
};
