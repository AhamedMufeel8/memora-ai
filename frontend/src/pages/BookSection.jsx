import { useState } from 'react';
import { useStudy } from '../context/StudyContext';
import { motion } from 'framer-motion';
import {
  BookOpen,
  Search,
  Bookmark,
  ChevronRight,
  Sliders
} from 'lucide-react';
import { Modal } from '../components/Modal';

export const BookSection = () => {
  const {
    books,
    toggleBookmarkBook,
    updateBookProgress,
    addToast
  } = useStudy();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedBook, setSelectedBook] = useState(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [inputPage, setInputPage] = useState('');

  // Extract categories
  const categories = ['All', ...new Set(books.map(bk => bk.category))];

  // Filtering filter logic
  const filteredBooks = books.filter(bk => {
    const matchesSearch = bk.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bk.author.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || bk.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleOpenPreview = (book) => {
    setSelectedBook(book);
    setShowPreviewModal(true);
    setInputPage(book.currentPage.toString());
  };

  const handleSavePageProgress = (e) => {
    e.preventDefault();
    const pageNum = parseInt(inputPage, 10);
    if (isNaN(pageNum) || pageNum < 1 || pageNum > selectedBook.pages) {
      addToast(`Specify a valid page number (1 to ${selectedBook.pages}).`, 'error');
      return;
    }

    updateBookProgress(selectedBook.id, pageNum);

    // Update active book local reference for modal view updates
    setSelectedBook(prev => ({
      ...prev,
      currentPage: pageNum,
      readPercent: Math.round((pageNum / prev.pages) * 100)
    }));

    addToast('Book progress saved!', 'success');
  };

  return (
    <div className="space-y-8 font-sans">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-indigo-500" />
          Book Library
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Browse reference textbooks, track reading stats, and study using linked audio summaries</p>
      </div>

      {/* Continue Reading Section */}
      <div>
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Continue Reading</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {books.filter(bk => bk.readPercent > 0 && bk.readPercent < 100).map(bk => (
            <div
              key={bk.id}
              onClick={() => handleOpenPreview(bk)}
              className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/65 backdrop-blur-md shadow-sm flex gap-4 cursor-pointer hover:border-indigo-500/30 transition-colors"
            >
              <img src={bk.cover} alt="Cover" className="w-16 h-20 object-cover rounded shadow flex-shrink-0" />
              <div className="flex-grow flex flex-col justify-between overflow-hidden">
                <div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-white truncate">{bk.title}</h4>
                  <p className="text-[10px] text-slate-400 truncate mt-0.5">{bk.author}</p>
                </div>

                <div className="space-y-1.5 mt-2">
                  <div className="flex justify-between text-[9px] font-bold text-slate-400">
                    <span>Page {bk.currentPage} of {bk.pages}</span>
                    <span>{bk.readPercent}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-850 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${bk.readPercent}%` }}
                      className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 rounded-full"
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Catalog Filters Controls */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between sm:items-center pt-4">
        {/* Search bar */}
        <div className="relative max-w-xs w-full">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search textbook index..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/40 text-xs text-slate-850 dark:text-white focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        {/* Categories togglers */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all border ${selectedCategory === cat
                  ? 'bg-indigo-500 border-indigo-500 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-350'
                }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Books grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {filteredBooks.map(bk => (
          <motion.div
            key={bk.id}
            whileHover={{ y: -4 }}
            onClick={() => handleOpenPreview(bk)}
            className="p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/65 backdrop-blur-md shadow-sm cursor-pointer flex flex-col justify-between"
          >
            <div className="flex gap-4">
              <img src={bk.cover} alt="Cover" className="w-20 h-28 object-cover rounded shadow flex-shrink-0" />
              <div className="overflow-hidden">
                <span className="text-[9px] font-bold tracking-wider uppercase bg-indigo-500/10 text-indigo-500 px-2 py-0.5 rounded">
                  {bk.category}
                </span>
                <h4 className="text-xs font-bold text-slate-850 dark:text-white mt-2.5 leading-snug truncate">
                  {bk.title}
                </h4>
                <p className="text-[10px] text-slate-400 mt-1 truncate">
                  {bk.author}
                </p>
                <div className="flex items-center gap-1.5 mt-3 text-[10px] text-slate-400">
                  <Bookmark className={`w-3.5 h-3.5 ${bk.bookmarked ? 'fill-cyan-500 text-cyan-500' : ''}`} />
                  <span>{bk.bookmarked ? 'Bookmarked' : 'Unsaved'}</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-850 flex items-center justify-between text-[10px] text-slate-500">
              <span>{bk.pages} pages total</span>
              <button className="flex items-center gap-0.5 text-indigo-500 font-bold hover:underline">
                Open Preview
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Book details Modal Preview */}
      <Modal isOpen={showPreviewModal} onClose={() => setShowPreviewModal(false)} title="Textbook Summary Detail">
        {selectedBook && (
          <div className="space-y-6 font-sans text-xs">
            <div className="flex gap-5">
              <img src={selectedBook.cover} alt="Cover" className="w-24 h-32 object-cover rounded-xl shadow-lg flex-shrink-0" />
              <div className="space-y-2">
                <span className="inline-block text-[9px] font-bold tracking-wider uppercase bg-indigo-500/10 text-indigo-500 px-2 py-0.5 rounded">
                  {selectedBook.category}
                </span>
                <h3 className="text-sm font-bold text-slate-800 dark:text-white">{selectedBook.title}</h3>
                <p className="text-slate-400 font-medium">Author: {selectedBook.author}</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">{selectedBook.summary}</p>
              </div>
            </div>

            {/* Reading progression form */}
            <form onSubmit={handleSavePageProgress} className="p-4 rounded-xl border border-slate-100 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-950/20">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-indigo-500" />
                Track Reading Progression
              </h4>
              <div className="flex items-center gap-4">
                <div className="flex-grow">
                  <div className="flex justify-between text-[10px] text-slate-400 font-semibold mb-1">
                    <span>Reading Progress: Page {selectedBook.currentPage} / {selectedBook.pages}</span>
                    <span>{selectedBook.readPercent}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${selectedBook.readPercent}%` }}
                      className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 rounded-full animate-pulse"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    placeholder="Page"
                    value={inputPage}
                    onChange={(e) => setInputPage(e.target.value)}
                    className="w-16 px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-950 text-center text-xs text-slate-800 dark:text-white"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-[10px]"
                  >
                    Save
                  </button>
                </div>
              </div>
            </form>

            {/* Actions footer */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-850 flex justify-between items-center">
              <button
                type="button"
                onClick={() => {
                  toggleBookmarkBook(selectedBook.id);
                  setSelectedBook(prev => ({ ...prev, bookmarked: !prev.bookmarked }));
                }}
                className={`px-4 py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors ${selectedBook.bookmarked
                    ? 'border-cyan-500/25 bg-cyan-500/10 text-cyan-400'
                    : 'border-slate-200 dark:border-slate-800 text-slate-500'
                  }`}
              >
                <Bookmark className={`w-3.5 h-3.5 ${selectedBook.bookmarked ? 'fill-cyan-400' : ''}`} />
                {selectedBook.bookmarked ? 'Bookmarked' : 'Add Bookmark'}
              </button>


            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
