
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { StockListItem } from '../types';

interface SearchBarProps {
    stockList: StockListItem[];
    onSearch: (term: string) => void;
}

const SearchIcon: React.FC<React.SVGProps<SVGSVGElement>> = ({ className, ...props }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${className || ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
);


const CloseIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);

const SearchBar: React.FC<SearchBarProps> = ({ stockList, onSearch }) => {
    const [input, setInput] = useState('');
    const [suggestions, setSuggestions] = useState<StockListItem[]>([]);
    const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
    const [showSuggestions, setShowSuggestions] = useState(false); // New state to control visibility
    const searchContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (input.trim() && stockList.length > 0) {
            const trimmedInput = input.trim();
            const lowerCaseInput = trimmedInput.toLowerCase();
            const filtered = stockList.filter(stock => {
                // Use case-insensitive includes for all fields for better searchability.
                const nameMatch = stock.name.toLowerCase().includes(lowerCaseInput);
                const codeMatch = stock.code.toLowerCase().includes(lowerCaseInput);
                const aliasMatch = stock.alias?.some(a => a.toLowerCase().includes(lowerCaseInput));
                return nameMatch || codeMatch || aliasMatch;
            }).slice(0, 7); // Limit suggestions to 7
            setSuggestions(filtered);
        } else {
            setSuggestions([]);
        }
        setActiveSuggestionIndex(-1);
    }, [input, stockList]);
    
    const handleSearch = (term: string) => {
        onSearch(term);
        setInput(term);
        setShowSuggestions(false); // Hide suggestions on search commit
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInput(e.target.value);
        setShowSuggestions(true); // Show suggestions while typing
    };

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const termToSearch = activeSuggestionIndex > -1 ? suggestions[activeSuggestionIndex].name : input;
        handleSearch(termToSearch.trim());
    };

    const handleSuggestionClick = (stock: StockListItem) => {
        handleSearch(stock.name);
    };
    
    const handleClearInput = () => {
        setInput('');
        onSearch('');
        setShowSuggestions(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!showSuggestions || suggestions.length === 0) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActiveSuggestionIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : prev));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActiveSuggestionIndex(prev => (prev > 0 ? prev - 1 : 0));
        }
    };
    
    // Close suggestions when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const highlightMatch = (text: string) => {
        if (!input.trim()) return text;
        const regex = new RegExp(`(${input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
        const parts = text.split(regex);
        return (
            <>
                {parts.map((part, i) =>
                    regex.test(part) ? (
                        <strong key={i} className="text-primary font-bold">{part}</strong>
                    ) : (
                        <span key={i}>{part}</span>
                    )
                )}
            </>
        );
    };

    return (
        <form onSubmit={handleFormSubmit} className="max-w-2xl mx-auto">
            <div className="relative" ref={searchContainerRef}>
                <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                    <SearchIcon className="text-secondary-light dark:text-secondary-dark" />
                </div>
                <input
                    type="text"
                    value={input}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    onFocus={() => setShowSuggestions(true)}
                    placeholder="搜尋股票 (代號/名稱/縮寫)"
                    className="w-full pl-11 pr-32 py-3 bg-surface-light dark:bg-surface-dark border border-outline-light dark:border-outline-dark rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/80 focus:border-transparent transition-colors shadow-sm text-on-surface-light dark:text-on-surface-dark placeholder:text-secondary-light dark:placeholder:text-secondary-dark"
                    autoComplete="off"
                />
                <div className="absolute inset-y-0 right-0 flex items-center">
                   {input && (
                       <button
                           type="button"
                           onClick={handleClearInput}
                           className="p-2 text-secondary-light dark:text-secondary-dark hover:text-on-surface-light dark:hover:text-on-surface-dark transition-colors rounded-full mr-1"
                           aria-label="清除搜尋"
                       >
                           <CloseIcon className="w-5 h-5"/>
                       </button>
                   )}
                    <button
                        type="submit"
                        className="h-[calc(100%-0.75rem)] my-1.5 mr-1.5 px-5 bg-primary hover:bg-primary/90 text-on-primary rounded-lg text-sm font-semibold transition-colors transform hover:scale-105"
                        aria-label="搜尋"
                    >
                        搜尋
                    </button>
                </div>

                {showSuggestions && suggestions.length > 0 && (
                    <ul className="absolute z-10 w-full mt-2 bg-surface-light dark:bg-surface-dark border border-outline-light dark:border-outline-dark rounded-xl shadow-xl overflow-hidden animate-fade-in">
                        {suggestions.map((stock, index) => (
                            <li
                                key={stock.code}
                                onClick={() => handleSuggestionClick(stock)}
                                className={`px-4 py-3 cursor-pointer text-left transition-colors ${
                                    index === activeSuggestionIndex 
                                    ? 'bg-primary/10' 
                                    : 'hover:bg-gray-100 dark:hover:bg-white/5'
                                }`}
                            >
                                <div className="font-semibold text-on-surface-light dark:text-on-surface-dark">
                                    {highlightMatch(stock.name)}
                                </div>
                                <div className="text-sm text-secondary-light dark:text-secondary-dark">
                                    {highlightMatch(stock.code)}
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </form>
    );
};

export default React.memo(SearchBar);