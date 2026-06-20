import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion'; // why error? , why not working? - import { motion } from 'framer-motion'; -> import { motion } from 'framer-motion';
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
  BarChart3,
  BookOpen,
  Brain,
  CheckCircle2,
  Clock3,
  FileText,
  Loader2,
  MessageCircle,
  Sparkles,
  Trophy,
  TrendingUp,
  ArrowUpRight,
  Activity
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
    caption: 'Target: 10 topics/week',
    icon: Trophy,
    color: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-500/10 dark:bg-emerald-400/10',
    borderColor: 'border-emerald-500/20 dark:border-emerald-400/10',
    glow: 'shadow-emerald-500/5'
  },
  {
    label: 'AI Learning Score',
    value: `${overview.aiLearningScore}%`,
    caption: 'Based on quiz precision',
    icon: Brain,
    color: 'text-indigo-600 dark:text-indigo-400',
    bg: 'bg-indigo-500/10 dark:bg-indigo-400/10',
    borderColor: 'border-indigo-500/20 dark:border-indigo-400/10',
    glow: 'shadow-indigo-500/5'
  },
];

const resourceItems = (usage = {}) => [
  { label: 'PDFs Processed', value: usage.pdfsUploaded || 0, icon: FileText, tone: 'cyan' },
  { label: 'AI Summaries', value: usage.summariesGenerated || 0, icon: Sparkles, tone: 'indigo' },
  { label: 'Smart Flashcards', value: usage.flashcardsCreated || 0, icon: BookOpen, tone: 'emerald' },
  { label: 'Quizzes Completed', value: usage.quizzesTaken || 0, icon: CheckCircle2, tone: 'violet' },
  { label: 'Tutor Interactions', value: usage.aiTutorChats || 0, icon: MessageCircle, tone: 'amber' },
].sort((a, b) => Number(b.value > 0) - Number(a.value > 0));

const resourceTone = {
  cyan: 'border-cyan-500/15 dark:border-cyan-400/10 bg-gradient-to-br from-cyan-50/50 to-white dark:from-cyan-950/5 dark:to-transparent text-cyan-700 dark:text-cyan-400',
  indigo: 'border-indigo-500/15 dark:border-indigo-400/10 bg-gradient-to-br from-indigo-50/50 to-white dark:from-indigo-950/5 dark:to-transparent text-indigo-700 dark:text-indigo-400',
  emerald: 'border-emerald-500/15 dark:border-emerald-400/10 bg-gradient-to-br from-emerald-50/50 to-white dark:from-emerald-950/5 dark:to-transparent text-emerald-700 dark:text-emerald-400',
  violet: 'border-violet-500/15 dark:border-violet-400/10 bg-gradient-to-br from-violet-50/50 to-white dark:from-violet-950/5 dark:to-transparent text-violet-700 dark:text-violet-400',
  amber: 'border-amber-500/15 dark:border-amber-400/10 bg-gradient-to-br from-amber-50/50 to-white dark:from-amber-950/5 dark:to-transparent text-amber-700 dark:text-amber-400',
};

const Section = ({ title, icon: Icon, action, children, className = '' }) => (
  <section className={`border border-slate-200/60 dark:border-slate-800/50 bg-white dark:bg-slate-950/40 backdrop-blur-md rounded-2xl p-6 shadow-sm hover:shadow-md/50 transition-all duration-300 ${className}`}>
    <div className="mb-6 flex items-center justify-between">
      <h3 className="flex items-center gap-2.5 text-xs font-bold tracking-wider uppercase text-slate-400 dark:text-slate-500">
        {Icon && <Icon className="h-4 w-4 text-slate-400 dark:text-slate-500" />}
        {title}
      </h3>
      {action}
    </div>
    {children}
  </section>
);

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900/95 dark:bg-slate-950/95 text-white p-3 rounded-xl border border-slate-800 shadow-xl backdrop-blur-md min-w-[120px]">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{payload[0].payload.name}</p>
        <p className="text-sm font-black mt-1 text-indigo-400">{payload[0].value} <span className="text-xs font-normal text-slate-300">mins</span></p>
      </div>
    );
  }
  return null;
};

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
      <div className="flex min-h-[450px] items-center justify-center rounded-2xl border border-slate-200/60 bg-white/50 dark:border-slate-800/50 dark:bg-slate-950/20 backdrop-blur-md">
        <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="space-y-8 font-sans max-w-[1600px] mx-auto pb-12">
      
      {/* Platform Welcome Header Block */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-xs uppercase tracking-widest">
          <Activity className="w-3.5 h-3.5" />
          Workspace Pulse
        </div>
        <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
          Overview Workspace Analytics
        </h2>
      </div>

      {/* Website Features Grid Action Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { name: 'AI Summarizer', desc: 'Distill documents instantly', icon: Sparkles, to: '/summarizer', color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-500/10 dark:bg-indigo-400/5' },
          { name: 'AI Flashcards', desc: 'Spaced repetition modules', icon: BookOpen, to: '/flashcards', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10 dark:bg-emerald-400/5' },
          { name: 'Smart Quizzes', desc: 'Test precision models', icon: CheckCircle2, to: '/quiz', color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-500/10 dark:bg-violet-400/5' },
          { name: 'AI Tutor Chat', desc: 'On-demand contextual help', icon: MessageCircle, to: '/chat', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10 dark:bg-amber-400/5' },
        ].map((feature) => (
          <Link
            key={feature.name}
            to={feature.to}
            className="group flex flex-col justify-between p-5 rounded-2xl border border-slate-200/60 bg-white dark:border-slate-800/50 dark:bg-slate-950/30 shadow-sm transition-all duration-300 hover:border-indigo-500/30 dark:hover:border-indigo-500/30 hover:-translate-y-0.5"
          >
            <div className="space-y-4">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl border border-transparent transition-colors group-hover:border-current/10 ${feature.bg} ${feature.color}`}>
                <feature.icon className="h-[18px] w-[18px]" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">{feature.name}</h4>
                <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{feature.desc}</p>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-end text-slate-300 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </Link>
        ))}
      </div>

      {/* Advanced Bento Grid Architecture */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Metrics & Main Performance Area Chart (8/12 Columns) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Top Row Split: Core Metric Counters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {metricCards(dashboard.overview).map((card) => (
              <div
                key={card.label}
                className={`rounded-2xl border bg-white p-5 shadow-sm dark:bg-slate-950/30 flex items-center justify-between border-slate-200/60 dark:border-slate-800/50 shadow-sm ${card.glow}`}
              >
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    {card.label}
                  </p>
                  <h3 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                    {card.value}
                  </h3>
                  <p className="text-[11px] text-slate-400">{card.caption}</p>
                </div>
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-transparent ${card.bg} ${card.color} ${card.borderColor}`}>
                  <card.icon className="h-5 w-5" />
                </div>
              </div>
            ))}
          </div>

          {/* Performance Area Graph Card */}
          <Section title="Productivity Matrix" icon={BarChart3}>
            {weeklyLoading ? (
              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <Skeleton className="h-14 rounded-xl" count={2} />
                </div>
                <Skeleton className="h-64 rounded-xl" />
              </div>
            ) : (
              <>
                {/* Fixed Stat Row Grid Spacing Alignment */}
                <div className="grid grid-cols-2 gap-6 border-b border-slate-100 dark:border-slate-800/40 pb-4 mb-4">
                  {[
                    ['Weekly Allocation', formatMinutes(weekly.weeklyTotalMinutes), true],
                    ['Daily Mean', formatMinutes(weekly.dailyAverageMinutes), false]
                  ].map(([label, value, highlight]) => (
                    <div key={label} className="space-y-1">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">{label}</p>
                      <p className={`text-xl font-black tracking-tight ${highlight ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-800 dark:text-slate-200'}`}>{value}</p>
                    </div>
                  ))}
                </div>

                {!hasWeeklyActivity ? (
                  <div className="py-12">
                    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/30 py-10 px-4 text-center text-xs font-medium text-slate-400 dark:border-slate-800/80 dark:bg-slate-950/10">
                      No study activity structural metrics logged this week.
                    </div>
                  </div>
                ) : (
                  /* Cleaned Chart Bounds Margins */
                  <div className="mt-2 h-64 w-full text-slate-600 dark:text-slate-400">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                        <defs>
                          <linearGradient id="dashboardIndigo" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="4" vertical={false} stroke="#f1f5f9" darkStroke="#1e293b" opacity={0.5} />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={10} stroke="#94a3b8" fontWeight={600} dy={8} />
                        <YAxis axisLine={false} tickLine={false} fontSize={10} unit="m" stroke="#94a3b8" fontWeight={600} dx={-2} />
                        <Tooltip content={<CustomTooltip />} />
                        <Area
                          type="monotone"
                          dataKey="minutes"
                          stroke="#6366f1"
                          strokeWidth={2.5}
                          fill="url(#dashboardIndigo)"
                          activeDot={{ r: 5, stroke: '#6366f1', strokeWidth: 2, fill: '#fff' }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </>
            )}
          </Section>
        </div>

        {/* Right Column: Historical Activity Logs & Data Allocation Panel (4/12 Columns) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Resource Allocation Cards Stack */}
          <Section title="Resource Infrastructure" icon={TrendingUp}>
            <div className="space-y-2.5 max-h-[240px] overflow-y-auto pr-1 custom-scrollbar">
              {resourceItems(dashboard.resourceUsage).map(({ label, value, icon: Icon, tone }) => {
                const isUsed = value > 0;
                return (
                  <div
                    key={label}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all ${isUsed
                      ? `${resourceTone[tone]}`
                      : 'border-slate-100 bg-slate-50/30 text-slate-400 dark:border-slate-900/40 dark:bg-slate-950/10'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`p-1.5 rounded-lg ${isUsed ? 'bg-white dark:bg-slate-900 shadow-sm' : 'bg-slate-100 dark:bg-slate-900'}`}>
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <p className="text-xs font-bold truncate tracking-tight">{label}</p>
                    </div>
                    <span className="text-sm font-black tracking-tight">{value}</span>
                  </div>
                );
              })}
            </div>
          </Section>

          {/* Activity Logs Timeline Feed */}
          <Section title="Activity History" icon={Clock3}>
            {dashboard.recentActivity.length ? (
              <div className="flex flex-col gap-5 relative pl-1 max-h-[220px] overflow-y-auto custom-scrollbar">
                {dashboard.recentActivity.map((activity, index) => (
                  <div 
                    key={`${activity.type}-${activity.id}`} 
                    className={`relative pl-5 ${
                      index !== dashboard.recentActivity.length - 1 
                        ? 'before:absolute before:left-1.5 before:top-4 before:h-[calc(100%+16px)] before:w-px before:bg-slate-100 dark:before:bg-slate-900' 
                        : ''
                    }`}
                  >
                    <span className="absolute left-0 top-[5px] h-3 w-3 rounded-full border border-indigo-500 bg-white dark:bg-slate-950 flex items-center justify-center">
                      <span className="h-1 w-1 rounded-full bg-indigo-500" />
                    </span>
                    <div className="space-y-0.5">
                      <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 leading-normal">{activity.text}</p>
                      <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/30 py-8 px-4 text-center text-xs font-medium text-slate-400 dark:border-slate-800/80 dark:bg-slate-950/10">
                Activity records are completely empty.
              </div>
            )}
          </Section>

        </div>
      </div>
    </div>
  );
};