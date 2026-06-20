import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { flashcardService } from '../services/flashcard.service';
import { useStudy } from '../context/StudyContext';
import {
  AlertCircle,
  Award,
  BookMarked,
  ChevronLeft,
  ChevronRight,
  Layers,
  Loader2,
  RefreshCcw,
  Search,
  Shuffle,
  Sparkles,
  Trash2,
  UploadCloud,
} from 'lucide-react';

const MAX_PDF_SIZE = 10 * 1024 * 1024;

const getDeckId = (deck) => deck?._id || deck?.id;
const getTimestamp = () => new Date().getTime();

const shuffleCards = (cards) => {
  const nextCards = [...cards];
  for (let i = nextCards.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [nextCards[i], nextCards[j]] = [nextCards[j], nextCards[i]];
  }
  return nextCards;
};

export const Flashcards = () => {
  const { addToast } = useStudy();
  const fileInputRef = useRef(null);
  const studyStartedAtRef = useRef(0);
  const [mode, setMode] = useState('generate');
  const [notesText, setNotesText] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [difficulty, setDifficulty] = useState('');
  const [cardCount, setCardCount] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [decks, setDecks] = useState([]);
  const [progress, setProgress] = useState(null);
  const [search, setSearch] = useState('');
  const [activeDeck, setActiveDeck] = useState(null);
  const [studyCards, setStudyCards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isSavingStudy, setIsSavingStudy] = useState(false);
  const [renamingId, setRenamingId] = useState('');
  const [renameValue, setRenameValue] = useState('');

  const loadData = async (searchTerm = search) => {
    try {
      const [deckResponse, progressResponse] = await Promise.all([
        flashcardService.getDecks(searchTerm),
        flashcardService.getProgress(),
      ]);
      setDecks(deckResponse.data || []);
      setProgress(progressResponse.data || null);
    } catch (error) {
      setErrorMessage(error.message || 'Could not load flashcard decks.');
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadData('');
    }, 0);

    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const validatePdf = (file) => {
    if (!file) return false;
    const isPdf = file.name.toLowerCase().endsWith('.pdf') && (!file.type || file.type.includes('pdf') || file.type === 'application/octet-stream');
    if (!isPdf) {
      setErrorMessage('Only PDF files are supported.');
      return false;
    }
    if (file.size > MAX_PDF_SIZE) {
      setErrorMessage('PDF is too large. Maximum file size is 10MB.');
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

  const handleGenerate = async () => {
    if (!selectedFile && notesText.trim().length < 80) {
      setErrorMessage('Paste at least 80 characters or upload a PDF.');
      return;
    }

    if (!difficulty) {
      setErrorMessage('Please select a difficulty level.');
      return;
    }

    const count = parseInt(cardCount, 10);
    if (!count || count < 1 || count > 8) {
      setErrorMessage('Please enter a valid card count between 1 and 8.');
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
      formData.append('cardCount', String(cardCount));

      const response = await flashcardService.generateDeck(formData, (event) => {
        if (!event.total) return;
        setUploadProgress(Math.round((event.loaded * 100) / event.total));
      });

      setNotesText('');
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      await openDeck(response.data);
      await loadData('');
      addToast('AI flashcard deck generated and saved.', 'success');
    } catch (error) {
      const message = error?.response?.data?.message || error?.message || 'AI flashcard generation failed. Please try again.';
      console.error('[Flashcards] Generation failed:', error);
      if (error?.response?.data) {
        console.error('[Flashcards] Backend Error Data:', error.response.data);
      }
      setErrorMessage(message);
      setErrorMessage(message);
    } finally {
      setIsGenerating(false);
    }
  };

  const openDeck = async (deck) => {
    try {
      const deckId = getDeckId(deck);
      const response = deck.flashcards ? { data: deck } : await flashcardService.getDeck(deckId);
      const fullDeck = response.data;
      const cards = fullDeck.flashcards || [];
      setActiveDeck(fullDeck);
      setStudyCards(cards);
      setCurrentIndex(0);
      setIsFlipped(false);
      studyStartedAtRef.current = getTimestamp();
      setMode('study');
    } catch (error) {
      setErrorMessage(error.message || 'Could not open flashcard deck.');
    }
  };

  const markCard = async (rating) => {
    const activeCard = studyCards[currentIndex];
    if (!activeDeck || !activeCard) return;

    setIsSavingStudy(true);
    try {
      const studyTime = Math.max(Math.round((getTimestamp() - studyStartedAtRef.current) / 1000), 1);
      const response = await flashcardService.recordStudy(getDeckId(activeDeck), {
        cardId: activeCard._id,
        rating,
        studyTime,
      });
      setActiveDeck((prev) => ({ ...prev, study: response.data }));
      studyStartedAtRef.current = getTimestamp();

      if (currentIndex + 1 < studyCards.length) {
        setCurrentIndex((value) => value + 1);
        setIsFlipped(false);
      } else {
        addToast('Deck complete. Progress saved.', 'success');
      }
      await loadData(search);
    } catch (error) {
      setErrorMessage(error.message || 'Could not save study progress.');
    } finally {
      setIsSavingStudy(false);
    }
  };

  const deleteDeck = async (deck) => {
    try {
      await flashcardService.deleteDeck(getDeckId(deck));
      if (getDeckId(activeDeck) === getDeckId(deck)) {
        setActiveDeck(null);
        setMode('library');
      }
      await loadData(search);
      addToast('Flashcard deck deleted.', 'success');
    } catch (error) {
      setErrorMessage(error.message || 'Could not delete deck.');
    }
  };

  const saveRename = async (deck) => {
    if (renameValue.trim().length < 2) {
      setErrorMessage('Deck title is required.');
      return;
    }

    try {
      await flashcardService.renameDeck(getDeckId(deck), renameValue.trim());
      setRenamingId('');
      setRenameValue('');
      await loadData(search);
      addToast('Deck renamed.', 'success');
    } catch (error) {
      setErrorMessage(error.message || 'Could not rename deck.');
    }
  };

  const currentCard = studyCards[currentIndex];
  const deckStudy = activeDeck?.study;
  const studiedCards = deckStudy?.studiedCards || 0;
  const masteredCards = deckStudy?.masteredCards || 0;
  const completion = activeDeck?.cardCount ? Math.round((masteredCards / activeDeck.cardCount) * 100) : 0;

  const progressCards = useMemo(() => ([
    ['Total decks', progress?.totalDecks || 0],
    ['Cards studied', progress?.studiedCards || 0],
    ['Mastered cards', progress?.masteredCards || 0],
    ['Completion', `${progress?.completionPercentage || 0}%`],
  ]), [progress]);

  const restartDeck = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
    studyStartedAtRef.current = getTimestamp();
  };

  const shuffleDeck = () => {
    setStudyCards((cards) => shuffleCards(cards));
    setCurrentIndex(0);
    setIsFlipped(false);
    studyStartedAtRef.current = getTimestamp();
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-500" />
            AI Flashcards
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Generate AI-powered flashcards from your notes and master concepts faster.</p>
        </div>
        <div className="flex rounded-xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/65 p-1">
          {['generate', 'library', 'progress'].map((tab) => (
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

      {mode === 'generate' && (
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
                  placeholder="Paste study notes, textbook sections, formulas, or lecture content..."
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
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Card Count</label>
                <input
                  type="number"
                  min="1"
                  max="8"
                  placeholder="Max 8"
                  value={cardCount}
                  onChange={(event) => setCardCount(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/40 px-3 py-3 text-sm dark:text-white outline-none"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="w-full h-12 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  Generate Flashcards
                </button>
              </div>
            </div>

            {isGenerating && (
              <div className="mt-5 rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-4">
                <div className="flex items-center gap-3">
                  <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />
                  <div>
                    <p className="text-sm font-bold text-slate-800 dark:text-white">AI is creating your personalized flashcards...</p>
                    <p className="text-xs text-slate-500">Extracting content, selecting key concepts, and saving your deck.</p>
                  </div>
                </div>
                <div className="mt-4 h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div className="h-full bg-indigo-500 transition-all" style={{ width: `${uploadProgress}%` }} />
                </div>
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[1, 2, 3].map((item) => <div key={item} className="h-20 rounded-xl bg-slate-100 dark:bg-slate-800/70 animate-pulse" />)}
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
              <BookMarked className="w-4 h-4 text-indigo-500" />
              Recent Decks
            </h3>
            <div className="mt-4 space-y-3">
              {decks.slice(0, 5).map((deck) => (
                <button key={getDeckId(deck)} onClick={() => openDeck(deck)} className="w-full rounded-xl border border-slate-200 dark:border-slate-800 p-3 text-left hover:border-indigo-400">
                  <p className="text-xs font-bold text-slate-800 dark:text-white line-clamp-1">{deck.title}</p>
                  <p className="text-[10px] text-slate-400 mt-1">{deck.cardCount} cards • {deck.difficulty}</p>
                </button>
              ))}
              {!decks.length && <p className="text-xs text-slate-400 py-6 text-center">No decks generated yet.</p>}
            </div>
          </section>
        </div>
      )}

      {mode === 'study' && activeDeck && currentCard && (
        <section className="max-w-3xl mx-auto space-y-5">
          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/65 p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="text-[10px] uppercase font-bold tracking-wider text-indigo-500">{activeDeck.difficulty} deck</p>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">{activeDeck.title}</h3>
                <p className="text-xs text-slate-400 mt-1">Card {currentIndex + 1} of {studyCards.length} • {studiedCards} studied • {masteredCards} mastered</p>
              </div>
              <div className="flex gap-2">
                <button onClick={shuffleDeck} className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500" title="Shuffle cards"><Shuffle className="w-4 h-4" /></button>
                <button onClick={restartDeck} className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500" title="Restart deck"><RefreshCcw className="w-4 h-4" /></button>
              </div>
            </div>
            <div className="mt-4 h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div className="h-full bg-indigo-500" style={{ width: `${completion}%` }} />
            </div>
          </div>

          <motion.button
            key={`${currentCard._id}-${isFlipped}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => setIsFlipped((value) => !value)}
            className="w-full min-h-80 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 p-8 text-center shadow-sm flex flex-col justify-between"
          >
            <span className="self-center rounded-lg bg-indigo-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-indigo-500">
              {isFlipped ? 'Answer' : currentCard.topic || 'Question'}
            </span>
            <p className={`${isFlipped ? 'text-base' : 'text-xl'} font-bold leading-relaxed text-slate-800 dark:text-white`}>
              {isFlipped ? currentCard.answer : currentCard.question}
            </p>
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Tap to flip</span>
          </motion.button>

          <div className="grid grid-cols-3 gap-3">
            {[
              ['hard', 'Hard', 'bg-rose-500 hover:bg-rose-600'],
              ['medium', 'Medium', 'bg-amber-500 hover:bg-amber-600'],
              ['easy', 'Easy', 'bg-emerald-500 hover:bg-emerald-600'],
            ].map(([rating, label, color]) => (
              <button
                key={rating}
                onClick={() => markCard(rating)}
                disabled={isSavingStudy}
                className={`rounded-xl py-3 text-sm font-bold text-white ${color} disabled:opacity-60`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between">
            <button
              onClick={() => {
                setCurrentIndex((value) => Math.max(value - 1, 0));
                setIsFlipped(false);
              }}
              disabled={currentIndex === 0}
              className="p-3 rounded-full border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 disabled:opacity-40"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button onClick={() => setMode('library')} className="text-xs font-bold text-indigo-500">Back to library</button>
            <button
              onClick={() => {
                setCurrentIndex((value) => Math.min(value + 1, studyCards.length - 1));
                setIsFlipped(false);
              }}
              disabled={currentIndex + 1 >= studyCards.length}
              className="p-3 rounded-full border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 disabled:opacity-40"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </section>
      )}

      {mode === 'library' && (
        <section className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/65 p-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2"><BookMarked className="w-4 h-4 text-indigo-500" /> Flashcard Library</h3>
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 px-3 py-2">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                onKeyDown={(event) => event.key === 'Enter' && loadData(event.currentTarget.value)}
                placeholder="Search decks"
                className="bg-transparent text-sm outline-none dark:text-white"
              />
            </div>
          </div>
          <div className="mt-5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {decks.map((deck) => (
              <div key={getDeckId(deck)} className="rounded-xl border border-slate-200 dark:border-slate-800 p-4">
                {renamingId === getDeckId(deck) ? (
                  <div className="flex gap-2">
                    <input
                      value={renameValue}
                      onChange={(event) => setRenameValue(event.target.value)}
                      className="min-w-0 flex-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-transparent px-3 py-2 text-sm dark:text-white outline-none"
                    />
                    <button onClick={() => saveRename(deck)} className="px-3 rounded-lg bg-indigo-500 text-xs font-bold text-white">Save</button>
                  </div>
                ) : (
                  <button onClick={() => openDeck(deck)} className="text-left">
                    <p className="text-sm font-bold text-slate-800 dark:text-white">{deck.title}</p>
                    <p className="text-xs text-slate-500 mt-2">{deck.sourceName} • {deck.cardCount} cards • {deck.difficulty}</p>
                  </button>
                )}
                <div className="mt-3 flex flex-wrap gap-2">
                  {(deck.topics || []).slice(0, 3).map((topic) => <span key={topic} className="px-2 py-1 rounded bg-indigo-500/10 text-[10px] font-bold text-indigo-500">{topic}</span>)}
                </div>
                <div className="mt-4 flex gap-2">
                  <button onClick={() => openDeck(deck)} className="flex-1 py-2 rounded-lg bg-indigo-500 text-white text-xs font-bold">Study</button>
                  <button
                    onClick={() => {
                      setRenamingId(getDeckId(deck));
                      setRenameValue(deck.title);
                    }}
                    className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-500"
                  >
                    Rename
                  </button>
                  <button onClick={() => deleteDeck(deck)} className="p-2 rounded-lg border border-rose-500/20 text-rose-500" title="Delete deck"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </div>
          {!decks.length && <p className="text-xs text-slate-400 text-center py-10">No matching decks found.</p>}
        </section>
      )}

      {mode === 'progress' && (
        <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-3 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {progressCards.map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/65 p-5">
                <p className="text-xs text-slate-500">{label}</p>
                <p className="text-2xl font-black text-slate-850 dark:text-white mt-1">{value}</p>
              </div>
            ))}
          </div>

          <div className="xl:col-span-2 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/65 p-6">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white">Mastery Progress</h3>
            <div className="mt-6 h-4 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div className="h-full bg-emerald-500" style={{ width: `${progress?.completionPercentage || 0}%` }} />
            </div>
            <p className="mt-3 text-xs text-slate-500">{progress?.remainingCards || 0} cards remaining to master.</p>
          </div>

         
        </section>
      )}
    </div>
  );
};
