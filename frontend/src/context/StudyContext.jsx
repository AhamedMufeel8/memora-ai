import { createContext, useContext, useState } from 'react';

const StudyContext = createContext();

let nextToastId = 1;

export const StudyProvider = ({ children }) => {
  // Toast notifications state
  const [toasts, setToasts] = useState([]);
  
  // Custom mock data for books, flashcards, quizzes, audio lessons, etc.
  const [documents, setDocuments] = useState([]);

  const [books, setBooks] = useState([]);

  const [flashcards, setFlashcards] = useState([]);

  const [quizzes] = useState([]);

  const [audioLessons] = useState([]);

  const [activities, setActivities] = useState([]);

  const [heatmapData] = useState([]);

  const [streak] = useState(0);
  const [points, setPoints] = useState(0);
  const [achievements, setAchievements] = useState([]);

  // Toast controls
  const addToast = (message, type = 'success') => {
    const id = nextToastId++;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  // Upload actions
  const uploadDocument = (file) => {
    const newDoc = {
      id: `doc_${Date.now()}`,
      name: file.name,
      size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
      uploadedAt: new Date().toLocaleDateString(),
      summary: `AI generated summary for ${file.name}. \n\nKey takeaways:\n1. This uploaded file is being analyzed by the AI Tutor.\n2. Summarization complete: generated chapters and related quiz templates.\n3. Custom flashcards are automatically synced inside the Flashcards page.`
    };
    setDocuments(prev => [newDoc, ...prev]);
    
    // Add custom activity
    setActivities(prev => [
      { id: `act_${Date.now()}`, type: 'upload', text: `Uploaded and summarized ${file.name}`, time: 'Just now' },
      ...prev
    ]);
    
    // Reward user
    setPoints(prev => prev + 50);
    addToast(`Successfully summarized ${file.name}! +50 XP Reward!`, 'success');
  };

  // Flashcards actions
  const toggleBookmarkFlashcard = (id) => {
    setFlashcards(prev =>
      prev.map(fc => (fc.id === id ? { ...fc, bookmarked: !fc.bookmarked } : fc))
    );
    addToast('Flashcard bookmark updated!', 'info');
  };

  const setDifficultyRating = (id, difficulty) => {
    setFlashcards(prev =>
      prev.map(fc => (fc.id === id ? { ...fc, difficulty } : fc))
    );
    addToast(`Tag updated to: ${difficulty}`, 'info');
  };

  // Book Section actions
  const toggleBookmarkBook = (id) => {
    setBooks(prev =>
      prev.map(bk => (bk.id === id ? { ...bk, bookmarked: !bk.bookmarked } : bk))
    );
    addToast('Library bookmark updated!', 'info');
  };

  const updateBookProgress = (id, pageNum) => {
    setBooks(prev =>
      prev.map(bk => {
        if (bk.id === id) {
          const nextPercent = Math.min(Math.round((pageNum / bk.pages) * 100), 100);
          if (nextPercent >= 50 && !achievements.find(a => a.id === 'ach_3').unlocked) {
            unlockAchievement('ach_3');
          }
          return { ...bk, currentPage: pageNum, readPercent: nextPercent };
        }
        return bk;
      })
    );
  };

  // Quiz submission actions
  const submitQuizScore = (quizId, scorePercent) => {
    setActivities(prev => [
      { id: `act_${Date.now()}`, type: 'quiz', text: `Completed quiz with score: ${scorePercent}%`, time: 'Just now' },
      ...prev
    ]);
    setPoints(prev => prev + Math.round(scorePercent * 2));
    
    if (scorePercent === 100) {
      unlockAchievement('ach_4');
    }
    
    // Increase streak if done today
    addToast(`Quiz submitted! Scored ${scorePercent}%. Received +${Math.round(scorePercent * 2)} XP!`, 'success');
  };

  const unlockAchievement = (id) => {
    setAchievements(prev =>
      prev.map(ach => {
        if (ach.id === id && !ach.unlocked) {
          addToast(`🏆 Achievement Unlocked: ${ach.title}!`, 'success');
          setPoints(p => p + 100);
          return { ...ach, unlocked: true };
        }
        return ach;
      })
    );
  };

  return (
    <StudyContext.Provider
      value={{
        toasts,
        addToast,
        removeToast,
        documents,
        uploadDocument,
        books,
        toggleBookmarkBook,
        updateBookProgress,
        flashcards,
        toggleBookmarkFlashcard,
        setDifficultyRating,
        quizzes,
        submitQuizScore,
        audioLessons,
        activities,
        heatmapData,
        streak,
        points,
        achievements,
        unlockAchievement
      }}
    >
      {children}
    </StudyContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useStudy = () => {
  const context = useContext(StudyContext);
  if (!context) {
    throw new Error('useStudy must be used within a StudyProvider');
  }
  return context;
};
