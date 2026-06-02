import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { quizService } from '../services/quiz.service';
import { useStudy } from '../context/StudyContext';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Award,
  BarChart3,
  CheckCircle2,
  Clock,
  FileText,
  Loader2,
  RotateCcw,
  Search,
  Send,
  Trash2,
  UploadCloud,
  XCircle,
} from 'lucide-react';

const MAX_PDF_SIZE = 10 * 1024 * 1024;

const getQuizId = (quiz) => quiz?._id || quiz?.id;

const performanceCopy = (percentage) => {
  if (percentage >= 85) return 'Excellent understanding of the topic.';
  if (percentage >= 65) return 'Good progress. Review the missed explanations once.';
  if (percentage >= 40) return 'You have the base. Spend time on the weak areas below.';
  return 'Start with a recap, then retake this quiz slowly.';
};

export const SmartQuiz = () => {
  const { addToast, submitQuizScore } = useStudy();
  const fileInputRef = useRef(null);
  const [notesText, setNotesText] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [difficulty, setDifficulty] = useState('');
  const [questionCount, setQuestionCount] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [quizzes, setQuizzes] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [search, setSearch] = useState('');
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [mode, setMode] = useState('build');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [attemptResult, setAttemptResult] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadQuizData = async (searchTerm = search) => {
    try {
      const [quizResponse, attemptResponse, analyticsResponse] = await Promise.all([
        quizService.getQuizzes(searchTerm),
        quizService.getAttempts(),
        quizService.getAnalytics(),
      ]);

      setQuizzes(quizResponse.data || []);
      setAttempts(attemptResponse.data || []);
      setAnalytics(analyticsResponse.data || null);
    } catch (error) {
      addToast(error.message || 'Could not load quiz history.', 'error');
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadQuizData('');
    }, 0);

    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const validatePdf = (file) => {
    if (!file) return false;
    const isPdf = file.name.toLowerCase().endsWith('.pdf') && (!file.type || file.type.includes('pdf') || file.type === 'application/octet-stream');
    if (!isPdf) {
      addToast('Only PDF files are supported.', 'error');
      return false;
    }
    if (file.size > MAX_PDF_SIZE) {
      addToast('PDF is too large. Maximum file size is 10MB.', 'error');
      return false;
    }
    return true;
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (validatePdf(file)) {
      setSelectedFile(file);
      setErrorMessage('');
    }
  };

  const handleGenerateQuiz = async () => {
    if (!selectedFile && notesText.trim().length < 80) {
      addToast('Paste at least 80 characters or upload a PDF.', 'error');
      return;
    }

    if (!difficulty) {
      addToast('Please select a difficulty level.', 'error');
      return;
    }

    const count = parseInt(questionCount, 10);
    if (!count || count < 1 || count > 8) {
      addToast('Please enter a valid question count between 1 and 8.', 'error');
      return;
    }

    setIsGenerating(true);
    setUploadProgress(selectedFile ? 0 : 100);
    setErrorMessage('');

    try {
      const formData = new FormData();
      if (selectedFile) formData.append('file', selectedFile);
      if (notesText.trim()) formData.append('text', notesText.trim());
      formData.append('difficulty', difficulty);
      formData.append('questionCount', String(questionCount));

      const response = await quizService.generateQuiz(formData, (event) => {
        if (!event.total) return;
        setUploadProgress(Math.round((event.loaded * 100) / event.total));
      });

      const quiz = response.data;
      setActiveQuiz(quiz);
      setMode('taking');
      setCurrentIndex(0);
      setAnswers({});
      setAttemptResult(null);
      setNotesText('');
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      await loadQuizData('');
      addToast('AI quiz generated and saved.', 'success');
    } catch (error) {
      const message = error?.message || 'AI quiz generation failed. Please try again.';
      setErrorMessage(message);
      addToast(message, 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const startQuiz = async (quiz) => {
    try {
      const response = await quizService.getQuiz(getQuizId(quiz));
      setActiveQuiz(response.data);
      setMode('taking');
      setCurrentIndex(0);
      setAnswers({});
      setAttemptResult(null);
    } catch (error) {
      addToast(error.message || 'Could not open quiz.', 'error');
    }
  };

  const submitAttempt = async () => {
    if (!activeQuiz) return;

    const missingCount = activeQuiz.questions.filter((question) => !answers[question._id]).length;
    if (missingCount > 0) {
      addToast(`Answer ${missingCount} more question${missingCount === 1 ? '' : 's'} before submitting.`, 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = activeQuiz.questions.map((question) => ({
        questionId: question._id,
        selectedAnswer: answers[question._id],
      }));
      const response = await quizService.submitAttempt(getQuizId(activeQuiz), payload);
      setAttemptResult(response.data);
      setMode('results');
      submitQuizScore(getQuizId(activeQuiz), response.data.percentage);
      await loadQuizData(search);
    } catch (error) {
      addToast(error.message || 'Could not submit quiz.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteQuiz = async (quiz) => {
    try {
      await quizService.deleteQuiz(getQuizId(quiz));
      await loadQuizData(search);
      if (getQuizId(activeQuiz) === getQuizId(quiz)) {
        setActiveQuiz(null);
        setMode('build');
      }
      addToast('Quiz deleted.', 'success');
    } catch (error) {
      addToast(error.message || 'Could not delete quiz.', 'error');
    }
  };

  const currentQuestion = activeQuiz?.questions?.[currentIndex];
  const answeredCount = activeQuiz?.questions?.filter((question) => answers[question._id]).length || 0;
  const progress = activeQuiz?.questions?.length ? Math.round((answeredCount / activeQuiz.questions.length) * 100) : 0;

  const chartData = useMemo(() => {
    return attempts.slice(0, 8).reverse().map((attempt, index) => ({
      name: `Try ${index + 1}`,
      score: attempt.percentage,
    }));
  }, [attempts]);

  const chooseAnswer = (value) => {
    if (!currentQuestion) return;
    setAnswers((prev) => ({ ...prev, [currentQuestion._id]: value }));
  };

  const renderAnswerInput = () => {
    if (!currentQuestion) return null;
    const selected = answers[currentQuestion._id] || '';

    const options = currentQuestion.options || [];

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {options.map((option) => (
          <button
            key={option}
            onClick={() => chooseAnswer(option)}
            className={`min-h-14 rounded-xl border px-4 py-3 text-left text-sm font-semibold transition-all ${selected === option
              ? 'border-indigo-500 bg-indigo-500/10 text-indigo-600 dark:text-cyan-300'
              : 'border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-950/20 text-slate-700 dark:text-slate-300 hover:border-indigo-400'
            }`}
          >
            {option}
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Award className="w-5 h-5 text-indigo-500" />
            AI Smart Quiz
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Create AI-powered quizzes from notes, PDFs, and summaries to improve retention and exam readiness.</p>
        </div>
        <div className="flex rounded-xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/65 p-1">
          {['build', 'history', 'analytics'].map((tab) => (
            <button
              key={tab}
              onClick={() => setMode(tab)}
              className={`px-4 py-2 rounded-lg text-xs font-bold capitalize transition-colors ${mode === tab
                ? 'bg-indigo-500 text-white'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {mode === 'build' && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
          <section className="xl:col-span-2 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/65 p-6 shadow-sm">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="min-h-52 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/20 p-6 text-center hover:border-indigo-400 transition-colors"
              >
                <input ref={fileInputRef} type="file" accept=".pdf" onChange={handleFileChange} className="hidden" />
                <UploadCloud className="w-10 h-10 text-indigo-500 mx-auto mb-3" />
                <p className="text-sm font-bold text-slate-800 dark:text-white">Upload PDF notes</p>
                <p className="text-xs text-slate-500 mt-1">{selectedFile ? selectedFile.name : 'Files up to 10MB'}</p>
              </button>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Paste Notes</label>
                <textarea
                  value={notesText}
                  onChange={(event) => setNotesText(event.target.value)}
                  placeholder="Paste textbook notes, lecture summaries, or chapter content..."
                  className="mt-2 h-52 w-full resize-none rounded-xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/30 p-4 text-sm text-slate-800 dark:text-white outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Difficulty</label>
                <select
                  value={difficulty}
                  onChange={(event) => setDifficulty(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/40 px-3 py-3 text-sm dark:text-white outline-none"
                >
                  <option value="" disabled hidden>Select Difficulty</option>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Question Count</label>
                <input
                  type="number"
                  min="1"
                  max="8"
                  placeholder="Max 8"
                  value={questionCount}
                  onChange={(event) => setQuestionCount(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/40 px-3 py-3 text-sm dark:text-white outline-none"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={handleGenerateQuiz}
                  disabled={isGenerating}
                  className="w-full h-12 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Generate Quiz
                </button>
              </div>
            </div>

            {isGenerating && (
              <div className="mt-5 rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-4">
                <div className="flex items-center gap-3">
                  <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />
                  <div>
                    <p className="text-sm font-bold text-slate-800 dark:text-white">AI is creating your personalized quiz...</p>
                    <p className="text-xs text-slate-500">Extracting content, designing questions, and saving your assessment.</p>
                  </div>
                </div>
                <div className="mt-4 h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div className="h-full bg-indigo-500 transition-all" style={{ width: `${uploadProgress}%` }} />
                </div>
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[1, 2, 3].map((item) => <div key={item} className="h-16 rounded-xl bg-slate-100 dark:bg-slate-800/70 animate-pulse" />)}
                </div>
              </div>
            )}

            {errorMessage && (
              <div className="mt-5 rounded-xl border border-rose-500/20 bg-rose-500/5 p-4 flex items-start gap-2 text-sm text-rose-600 dark:text-rose-300">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                {errorMessage}
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/65 p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-500" />
              Recent Quizzes
            </h3>
            <div className="mt-4 space-y-3">
              {quizzes.slice(0, 5).map((quiz) => (
                <div key={getQuizId(quiz)} className="rounded-xl border border-slate-200 dark:border-slate-800 p-3">
                  <p className="text-xs font-bold text-slate-800 dark:text-white line-clamp-1">{quiz.title}</p>
                  <p className="text-[10px] text-slate-400 mt-1">{quiz.questionCount || quiz.questions?.length || 0} questions • {quiz.difficulty}</p>
                  <button onClick={() => startQuiz(quiz)} className="mt-3 text-xs font-bold text-indigo-500">Retake quiz</button>
                </div>
              ))}
              {!quizzes.length && <p className="text-xs text-slate-400 py-6 text-center">No quizzes generated yet.</p>}
            </div>
          </section>
        </div>
      )}

      {mode === 'taking' && activeQuiz && currentQuestion && (
        <section className="max-w-3xl mx-auto rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/75 dark:bg-slate-900/70 p-6 md:p-8 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-500">{activeQuiz.difficulty} quiz</p>
              <h3 className="text-lg font-bold text-slate-800 dark:text-white mt-1">{activeQuiz.title}</h3>
              <p className="text-xs text-slate-400 mt-1">Question {currentIndex + 1} of {activeQuiz.questions.length}</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold text-slate-500">{progress}% answered</p>
              <div className="mt-2 w-28 h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div className="h-full bg-indigo-500" style={{ width: `${progress}%` }} />
              </div>
            </div>
          </div>

          <motion.div key={currentQuestion._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-8">
            <p className="text-base md:text-lg font-bold leading-relaxed text-slate-850 dark:text-white">{currentQuestion.question}</p>
            <div className="mt-6">{renderAnswerInput()}</div>
          </motion.div>

          <div className="mt-8 flex flex-col sm:flex-row justify-between gap-3">
            <button
              onClick={() => setCurrentIndex((value) => Math.max(value - 1, 0))}
              disabled={currentIndex === 0}
              className="px-5 py-3 rounded-xl border border-slate-200 dark:border-slate-800 text-sm font-bold text-slate-600 dark:text-slate-300 disabled:opacity-40 flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Previous
            </button>
            {currentIndex + 1 < activeQuiz.questions.length ? (
              <button
                onClick={() => setCurrentIndex((value) => Math.min(value + 1, activeQuiz.questions.length - 1))}
                className="px-5 py-3 rounded-xl bg-indigo-500 text-white text-sm font-bold flex items-center justify-center gap-2"
              >
                Next
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={submitAttempt}
                disabled={isSubmitting}
                className="px-5 py-3 rounded-xl bg-emerald-500 text-white text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                Submit Quiz
              </button>
            )}
          </div>
        </section>
      )}

      {mode === 'results' && activeQuiz && attemptResult && (
        <section className="max-w-4xl mx-auto rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/75 dark:bg-slate-900/70 p-6 md:p-8 shadow-sm">
          <div className="text-center">
            <p className="text-sm font-bold text-slate-500">Score</p>
            <h3 className="text-4xl font-black text-slate-850 dark:text-white mt-1">{attemptResult.score}/{attemptResult.totalQuestions}</h3>
            <p className="text-2xl font-black text-indigo-500 mt-2">{attemptResult.percentage}%</p>
            <p className="text-sm text-slate-500 mt-2">{performanceCopy(attemptResult.percentage)}</p>
          </div>

          <div className="mt-8 space-y-3">
            {attemptResult.answers.map((answer, index) => (
              <div key={`${answer.question}-${index}`} className={`rounded-xl border p-4 ${answer.isCorrect ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-rose-500/20 bg-rose-500/5'}`}>
                <div className="flex gap-3">
                  {answer.isCorrect ? <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" /> : <XCircle className="w-5 h-5 text-rose-500 flex-shrink-0" />}
                  <div>
                    <p className="text-sm font-bold text-slate-800 dark:text-white">{answer.question}</p>
                    <p className="text-xs text-slate-500 mt-2">Your answer: <span className="font-semibold">{answer.selectedAnswer || 'No answer'}</span></p>
                    {!answer.isCorrect && <p className="text-xs text-emerald-600 dark:text-emerald-300 mt-1">Correct answer: {answer.correctAnswer}</p>}
                    <p className="text-xs text-slate-600 dark:text-slate-350 mt-2 leading-relaxed">{answer.explanation}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-col sm:flex-row justify-between gap-3">
            <button onClick={() => setMode('build')} className="px-5 py-3 rounded-xl border border-slate-200 dark:border-slate-800 text-sm font-bold text-slate-600 dark:text-slate-300">Back to Generator</button>
            <button onClick={() => startQuiz(activeQuiz)} className="px-5 py-3 rounded-xl bg-indigo-500 text-white text-sm font-bold flex items-center justify-center gap-2">
              <RotateCcw className="w-4 h-4" />
              Retake Quiz
            </button>
          </div>
        </section>
      )}

      {mode === 'history' && (
        <section className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/65 p-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2"><FileText className="w-4 h-4 text-indigo-500" /> Quiz History</h3>
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 px-3 py-2">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                onKeyDown={(event) => event.key === 'Enter' && loadQuizData(event.currentTarget.value)}
                placeholder="Search quizzes"
                className="bg-transparent text-sm outline-none dark:text-white"
              />
            </div>
          </div>
          <div className="mt-5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {quizzes.map((quiz) => (
              <div key={getQuizId(quiz)} className="rounded-xl border border-slate-200 dark:border-slate-800 p-4">
                <p className="text-sm font-bold text-slate-800 dark:text-white">{quiz.title}</p>
                <p className="text-xs text-slate-500 mt-2">{quiz.sourceName} • {quiz.questionCount || quiz.questions?.length || 0} questions</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(quiz.topics || []).slice(0, 3).map((topic) => <span key={topic} className="px-2 py-1 rounded bg-indigo-500/10 text-[10px] font-bold text-indigo-500">{topic}</span>)}
                </div>
                <div className="mt-4 flex gap-2">
                  <button onClick={() => startQuiz(quiz)} className="flex-1 py-2 rounded-lg bg-indigo-500 text-white text-xs font-bold">Retake</button>
                  <button onClick={() => deleteQuiz(quiz)} className="p-2 rounded-lg border border-rose-500/20 text-rose-500" title="Delete quiz"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </div>
          {!quizzes.length && <p className="text-xs text-slate-400 text-center py-10">No matching quizzes found.</p>}
        </section>
      )}

      {mode === 'analytics' && (
        <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/65 p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2"><BarChart3 className="w-4 h-4 text-indigo-500" /> Score Trend</h3>
            <div className="mt-6 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
                  <XAxis dataKey="name" fontSize={11} />
                  <YAxis domain={[0, 100]} fontSize={11} />
                  <Tooltip />
                  <Bar dataKey="score" fill="#6366f1" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="space-y-4">
            {[
              ['Total quizzes', analytics?.totalQuizzes || 0],
              ['Total attempts', analytics?.totalAttempts || 0],
              ['Average score', `${analytics?.averageScore || 0}%`],
              ['Best score', `${analytics?.bestScore || 0}%`],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/65 p-5">
                <p className="text-xs text-slate-500">{label}</p>
                <p className="text-2xl font-black text-slate-850 dark:text-white mt-1">{value}</p>
              </div>
            ))}
          </div>
          <div className="xl:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              ['Weak topics', analytics?.weakTopics || [], 'text-rose-500'],
              ['Strong topics', analytics?.strongTopics || [], 'text-emerald-500'],
            ].map(([title, topics, color]) => (
              <div key={title} className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/65 p-6">
                <h3 className="text-sm font-bold text-slate-800 dark:text-white">{title}</h3>
                <div className="mt-4 space-y-3">
                  {topics.map((topic) => (
                    <div key={topic.topic} className="flex items-center justify-between rounded-xl bg-slate-50 dark:bg-slate-950/30 p-3">
                      <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{topic.topic}</span>
                      <span className={`text-sm font-black ${color}`}>{topic.average}%</span>
                    </div>
                  ))}
                  {!topics.length && <p className="text-xs text-slate-400 py-4">Take a quiz to unlock topic insights.</p>}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
