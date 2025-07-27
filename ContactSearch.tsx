import { useState, KeyboardEvent } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ContactCard } from './ContactCard';
import { useContactSearch } from '@/hooks/useContactSearch';
import { Search, Loader2, X } from 'lucide-react';

const exampleQueries = [
  "who works at Google",
  "good developers in Austin", 
  "would invest in my project",
  "loves hiking and photography"
];

export function ContactSearch() {
  const [searchInput, setSearchInput] = useState('');
  const { results, loading, query, search, clearResults, hasResults } = useContactSearch();

  const handleSearch = () => {
    if (searchInput.trim()) {
      search(searchInput.trim());
    }
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleExampleClick = (exampleQuery: string) => {
    setSearchInput(exampleQuery);
    search(exampleQuery);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
        <Input 
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyPress={handleKeyPress}
          className="pl-12 pr-24 py-6 text-lg bg-background/50 backdrop-blur-sm border-border/50" 
          placeholder="Find me all friends who play poker in Round Rock..."
          disabled={loading}
        />
        <Button 
          onClick={handleSearch}
          disabled={loading || !searchInput.trim()}
          className="absolute right-2 top-1/2 transform -translate-y-1/2"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            'Search'
          )}
        </Button>
      </div>

      {/* Example Queries */}
      {!hasResults && (
        <div className="flex flex-wrap justify-center gap-2">
          {exampleQueries.map((example, index) => (
            <button
              key={index}
              onClick={() => handleExampleClick(example)}
              className="inline-flex"
            >
              <Badge 
                variant="secondary" 
                className="px-3 py-1 cursor-pointer hover:bg-accent/80"
              >
                "{example}"
              </Badge>
            </button>
          ))}
        </div>
      )}

      {/* Search Results */}
      {hasResults && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">
              Search Results for "{query}"
            </h2>
            <Button
              variant="outline" 
              size="sm"
              onClick={() => {
                clearResults();
                setSearchInput('');
              }}
              className="gap-2"
            >
              <X className="h-4 w-4" />
              Clear
            </Button>
          </div>
          
          {results.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No contacts found for this search.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {results.map((contact, index) => (
                <ContactCard key={contact.id || index} contact={contact} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}