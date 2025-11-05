import { Header } from "@/components/Header";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { RaceCard } from "@/components/RaceCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search as SearchIcon, User, List as ListIcon } from "lucide-react";
import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { searchAll, searchRaces, searchUsers, searchLists, SearchResult } from "@/services/search";
import { getPosterUrl } from "@/services/f1Api";

const Search = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    const q = searchParams.get('q');
    if (q) {
      setQuery(q);
      performSearch(q);
    }
  }, [searchParams]);

  const performSearch = async (searchTerm: string) => {
    if (!searchTerm || searchTerm.trim().length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      let searchResults: SearchResult[] = [];

      if (activeTab === 'all') {
        searchResults = await searchAll(searchTerm);
      } else if (activeTab === 'races') {
        searchResults = await searchRaces(searchTerm, 20);
      } else if (activeTab === 'users') {
        searchResults = await searchUsers(searchTerm, 20);
      } else if (activeTab === 'lists') {
        searchResults = await searchLists(searchTerm, 20);
      }

      setResults(searchResults);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query)}`);
    }
  };

  useEffect(() => {
    const q = searchParams.get('q');
    if (q) {
      performSearch(q);
    }
  }, [activeTab]);

  const raceResults = results.filter(r => r.type === 'race');
  const userResults = results.filter(r => r.type === 'user');
  const listResults = results.filter(r => r.type === 'list');

  return (
    <div className="min-h-screen bg-[#0a0a0a] racing-grid pb-20 lg:pb-0">
      <Header />

      <main className="container px-4 sm:px-6 py-6 sm:py-8">
        <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8">
          <div className="pb-4 border-b-2 border-red-900/50">
            <div className="inline-block px-4 py-1 bg-black/60 backdrop-blur-sm border-2 border-racing-red rounded-full mb-3">
              <span className="text-racing-red font-black text-xs tracking-widest drop-shadow-[0_0_6px_rgba(220,38,38,0.8)]">SEARCH</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] mb-6">FIND RACES & FANS</h1>

            <form onSubmit={handleSearch} className="relative">
              <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="search"
                placeholder="Search for races, users, lists..."
                className="pl-12 h-14 text-lg bg-black/60 border-2 border-red-900/50 text-white placeholder:text-gray-400 focus:border-racing-red"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoFocus
              />
            </form>
          </div>

          {query && (
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="border-2 border-red-900/30 bg-black/50">
                <TabsTrigger value="all" className="font-black uppercase tracking-wider data-[state=active]:bg-racing-red data-[state=active]:text-white">All</TabsTrigger>
                <TabsTrigger value="races" className="font-black uppercase tracking-wider data-[state=active]:bg-racing-red data-[state=active]:text-white">Races</TabsTrigger>
                <TabsTrigger value="users" className="font-black uppercase tracking-wider data-[state=active]:bg-racing-red data-[state=active]:text-white">Users</TabsTrigger>
                <TabsTrigger value="lists" className="font-black uppercase tracking-wider data-[state=active]:bg-racing-red data-[state=active]:text-white">Lists</TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="space-y-6 mt-6">
                {loading ? (
                  <div className="text-center py-12 text-gray-300 font-black uppercase tracking-wider drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">Searching...</div>
                ) : results.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <p className="font-black uppercase tracking-wider drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">No results found for "{query}"</p>
                    <p className="text-sm mt-2 font-bold drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">Try different keywords</p>
                  </div>
                ) : (
                  <>
                    {raceResults.length > 0 && (
                      <div className="space-y-4">
                        <h2 className="text-xl font-black text-white uppercase tracking-wider drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">Races</h2>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
                          {raceResults.map((result) => {
                            const posterUrl = getPosterUrl(result.metadata?.circuit_short_name || result.metadata?.circuit_key);
                            return (
                              <RaceCard
                                key={result.id}
                                season={result.metadata?.year}
                                round={result.metadata?.round}
                                gpName={result.title}
                                circuit={result.metadata?.circuit_short_name}
                                date={result.metadata?.date_start}
                                country={result.metadata?.country_code}
                                posterUrl={posterUrl || undefined}
                              />
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {userResults.length > 0 && (
                      <div className="space-y-4">
                        <h2 className="text-xl font-black text-white uppercase tracking-wider drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">Users</h2>
                        <div className="grid gap-3">
                          {userResults.map((result) => (
                            <Card
                              key={result.id}
                              className="p-4 hover:ring-2 hover:ring-racing-red cursor-pointer transition-all border-2 border-red-900/40 bg-black/90 backdrop-blur"
                              onClick={() => navigate(`/user/${result.id}`)}
                            >
                              <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-full bg-black/80 border-2 border-racing-red/40 flex items-center justify-center overflow-hidden shadow-lg">
                                  {result.metadata?.photoURL ? (
                                    <img src={result.metadata.photoURL} alt={result.title} className="w-full h-full object-cover" />
                                  ) : (
                                    <span className="text-lg font-black text-white drop-shadow-[0_2px_4px_rgba(0,0,0,1)]">{result.title.charAt(0).toUpperCase()}</span>
                                  )}
                                </div>
                                <div className="flex-1">
                                  <p className="font-black text-lg text-white uppercase tracking-wider drop-shadow-[0_2px_4px_rgba(0,0,0,1)]">{result.title}</p>
                                  <p className="text-sm text-gray-300 font-bold drop-shadow-[0_2px_4px_rgba(0,0,0,1)]">{result.subtitle}</p>
                                  {result.metadata?.description && (
                                    <p className="text-sm text-gray-400 mt-1 line-clamp-1 font-medium drop-shadow-[0_2px_4px_rgba(0,0,0,1)]">{result.metadata.description}</p>
                                  )}
                                </div>
                              </div>
                            </Card>
                          ))}
                        </div>
                      </div>
                    )}

                    {listResults.length > 0 && (
                      <div className="space-y-4">
                        <h2 className="text-xl font-black text-white uppercase tracking-wider drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">Lists</h2>
                        <div className="space-y-2">
                          {listResults.map((result) => (
                            <Card
                              key={result.id}
                              className="p-4 hover:ring-2 hover:ring-racing-red cursor-pointer transition-all border-2 border-red-900/40 bg-black/90 backdrop-blur"
                              onClick={() => navigate(`/list/${result.id}`)}
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-lg bg-racing-red/20 border-2 border-racing-red/40 flex items-center justify-center shadow-lg shadow-red-500/30">
                                  <ListIcon className="w-6 h-6 text-racing-red drop-shadow-[0_0_6px_rgba(220,38,38,0.8)]" />
                                </div>
                                <div>
                                  <p className="font-black text-white uppercase tracking-wider drop-shadow-[0_2px_4px_rgba(0,0,0,1)]">{result.title}</p>
                                  <p className="text-sm text-gray-300 font-bold drop-shadow-[0_2px_4px_rgba(0,0,0,1)]">{result.subtitle}</p>
                                </div>
                              </div>
                            </Card>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </TabsContent>

              <TabsContent value="races" className="mt-6">
                {loading ? (
                  <div className="text-center py-12 text-gray-300 font-black uppercase tracking-wider drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">Searching...</div>
                ) : raceResults.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <p className="font-black uppercase tracking-wider drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">No races found for "{query}"</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {raceResults.map((result) => {
                      const posterUrl = getPosterUrl(result.metadata?.circuit_short_name || result.metadata?.circuit_key);
                      return (
                        <RaceCard
                          key={result.id}
                          season={result.metadata?.year}
                          round={result.metadata?.round}
                          gpName={result.title}
                          circuit={result.metadata?.circuit_short_name}
                          date={result.metadata?.date_start}
                          country={result.metadata?.country_code}
                          posterUrl={posterUrl || undefined}
                        />
                      );
                    })}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="users" className="mt-6">
                {loading ? (
                  <div className="text-center py-12 text-gray-300 font-black uppercase tracking-wider drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">Searching...</div>
                ) : userResults.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <p className="font-black uppercase tracking-wider drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">No users found for "{query}"</p>
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {userResults.map((result) => (
                      <Card
                        key={result.id}
                        className="p-4 hover:ring-2 hover:ring-racing-red cursor-pointer transition-all border-2 border-red-900/40 bg-black/90 backdrop-blur"
                        onClick={() => navigate(`/user/${result.id}`)}
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 rounded-full bg-black/80 border-2 border-racing-red/40 flex items-center justify-center overflow-hidden shadow-lg">
                            {result.metadata?.photoURL ? (
                              <img src={result.metadata.photoURL} alt={result.title} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-lg font-black text-white drop-shadow-[0_2px_4px_rgba(0,0,0,1)]">{result.title.charAt(0).toUpperCase()}</span>
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="font-black text-lg text-white uppercase tracking-wider drop-shadow-[0_2px_4px_rgba(0,0,0,1)]">{result.title}</p>
                            <p className="text-sm text-gray-300 font-bold drop-shadow-[0_2px_4px_rgba(0,0,0,1)]">{result.subtitle}</p>
                            {result.metadata?.description && (
                              <p className="text-sm text-gray-400 mt-1 line-clamp-1 font-medium drop-shadow-[0_2px_4px_rgba(0,0,0,1)]">{result.metadata.description}</p>
                            )}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="lists" className="mt-6">
                {loading ? (
                  <div className="text-center py-12 text-gray-300 font-black uppercase tracking-wider drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">Searching...</div>
                ) : listResults.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <p className="font-black uppercase tracking-wider drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">No lists found for "{query}"</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {listResults.map((result) => (
                      <Card
                        key={result.id}
                        className="p-4 hover:ring-2 hover:ring-racing-red cursor-pointer transition-all border-2 border-red-900/40 bg-black/90 backdrop-blur"
                        onClick={() => navigate(`/list/${result.id}`)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-lg bg-racing-red/20 border-2 border-racing-red/40 flex items-center justify-center shadow-lg shadow-red-500/30">
                            <ListIcon className="w-6 h-6 text-racing-red drop-shadow-[0_0_6px_rgba(220,38,38,0.8)]" />
                          </div>
                          <div>
                            <p className="font-black text-white uppercase tracking-wider drop-shadow-[0_2px_4px_rgba(0,0,0,1)]">{result.title}</p>
                            <p className="text-sm text-gray-300 font-bold drop-shadow-[0_2px_4px_rgba(0,0,0,1)]">{result.subtitle}</p>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </div>
      </main>
    </div>
  );
};

export default Search;
