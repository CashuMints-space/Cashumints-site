import React, { useState, useMemo } from 'react';
import { ThumbsUp, ThumbsDown, Star, Loader2, Filter } from 'lucide-react';
import { useMints } from '../context/MintsContext';
import MintCard from '../components/MintCard';
import Footer from '../components/Footer';

const AllMints = () => {
  const { mints, loading, error } = useMints();
  const [filters, setFilters] = useState({
    search: '',
    network: '',
    minRating: 0,
    nuts: [] as string[],
    version: '',
    software: '',
    unitOfAccount: '',
    sortBy: 'likes' as 'likes' | 'rating' | 'recent'
  });
  const [showFilters, setShowFilters] = useState(false);

  // Extract all unique values from mints and their info
  const networks = useMemo(() => 
    Array.from(new Set(mints.map(mint => mint.network))).sort(),
    [mints]
  );

  const allNuts = useMemo(() => 
    Array.from(new Set(mints.flatMap(mint => mint.nuts))).sort(),
    [mints]
  );

  const versions = useMemo(() => {
    const uniqueVersions = new Set<string>();
    mints.forEach(mint => {
      if (mint.info?.version) {
        // Extract base version (e.g., "Nutshell/0.15.3" -> "Nutshell")
        const baseVersion = mint.info.version.split('/')[0];
        uniqueVersions.add(baseVersion);
      }
    });
    return Array.from(uniqueVersions).sort();
  }, [mints]);

  const software = useMemo(() => {
    const softwareTypes = new Set<string>();
    mints.forEach(mint => {
      if (mint.info?.nuts?.['1']?.software) {
        softwareTypes.add(mint.info.nuts['1'].software);
      } else if (mint.info?.version) {
        const baseVersion = mint.info.version.split('/')[0].toLowerCase();
        if (baseVersion === 'nutshell' || baseVersion === 'mintd' || baseVersion === 'cashu.space') {
          softwareTypes.add(baseVersion);
        }
      }
    });
    return Array.from(softwareTypes).sort();
  }, [mints]);

  const unitsOfAccount = useMemo(() => {
    const units = new Set<string>();
    mints.forEach(mint => {
      // Check NUT-04 configuration in mint info
      if (mint.info?.nuts?.['4']?.methods) {
        mint.info.nuts['4'].methods.forEach((method: any) => {
          if (method.unit) units.add(method.unit);
        });
      }
      // Also check NUT-04 tags
      const nut04 = mint.nuts.find(nut => nut.startsWith('4-'));
      if (nut04) {
        const unit = nut04.split('-')[1];
        if (unit) units.add(unit);
      }
    });
    return Array.from(units).sort();
  }, [mints]);

  const filteredMints = useMemo(() => {
    let result = [...mints];

    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(mint => 
        mint.name.toLowerCase().includes(searchLower) ||
        mint.description.toLowerCase().includes(searchLower) ||
        mint.url.toLowerCase().includes(searchLower) ||
        mint.info?.description_long?.toLowerCase().includes(searchLower)
      );
    }

    // Apply network filter
    if (filters.network) {
      result = result.filter(mint => mint.network === filters.network);
    }

    // Apply rating filter
    if (filters.minRating > 0) {
      result = result.filter(mint => mint.rating >= filters.minRating);
    }

    // Apply NUTs filter
    if (filters.nuts.length > 0) {
      result = result.filter(mint => 
        filters.nuts.every(nut => mint.nuts.includes(nut))
      );
    }

    // Apply version filter
    if (filters.version) {
      result = result.filter(mint => 
        mint.info?.version?.startsWith(filters.version)
      );
    }

    // Apply software filter
    if (filters.software) {
      result = result.filter(mint => {
        if (mint.info?.nuts?.['1']?.software) {
          return mint.info.nuts['1'].software === filters.software;
        }
        if (mint.info?.version) {
          const baseVersion = mint.info.version.split('/')[0].toLowerCase();
          return baseVersion === filters.software.toLowerCase();
        }
        return false;
      });
    }

    // Apply unit of account filter
    if (filters.unitOfAccount) {
      result = result.filter(mint => {
        // Check NUT-04 configuration
        if (mint.info?.nuts?.['4']?.methods) {
          return mint.info.nuts['4'].methods.some(
            (method: any) => method.unit === filters.unitOfAccount
          );
        }
        // Check NUT-04 tags
        return mint.nuts.some(nut => 
          nut.startsWith('4-') && nut.split('-')[1] === filters.unitOfAccount
        );
      });
    }

    // Apply sorting
    switch (filters.sortBy) {
      case 'likes':
        result.sort((a, b) => b.likes - a.likes);
        break;
      case 'rating':
        result.sort((a, b) => b.rating - a.rating);
        break;
      case 'recent':
        result.sort((a, b) => {
          const aTime = a.recommendations[0]?.createdAt || 0;
          const bTime = b.recommendations[0]?.createdAt || 0;
          return bTime - aTime;
        });
        break;
    }

    return result;
  }, [mints, filters]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-[#f5a623]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <h1 className="text-4xl font-bold mb-4 md:mb-0">All Cashu Mints</h1>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2 bg-gray-800 px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            <Filter className="h-5 w-5" />
            <span>Filters</span>
          </button>
        </div>

        {showFilters && (
          <div className="bg-gray-800 rounded-lg p-4 sm:p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {/* Search */}
              <div>
                <label className="block text-sm font-medium mb-2">Search</label>
                <input
                  type="text"
                  value={filters.search}
                  onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
                  className="w-full bg-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#f5a623]"
                  placeholder="Search mints..."
                />
              </div>

              {/* Network */}
              <div>
                <label className="block text-sm font-medium mb-2">Network</label>
                <select
                  value={filters.network}
                  onChange={e => setFilters(f => ({ ...f, network: e.target.value }))}
                  className="w-full bg-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#f5a623]"
                >
                  <option value="">All Networks</option>
                  {networks.map(network => (
                    <option key={network} value={network}>{network}</option>
                  ))}
                </select>
              </div>

              {/* Rating */}
              <div>
                <label className="block text-sm font-medium mb-2">Minimum Rating</label>
                <select
                  value={filters.minRating}
                  onChange={e => setFilters(f => ({ ...f, minRating: Number(e.target.value) }))}
                  className="w-full bg-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#f5a623]"
                >
                  <option value={0}>Any Rating</option>
                  {[1, 2, 3, 4, 5].map(rating => (
                    <option key={rating} value={rating}>{rating}+ Stars</option>
                  ))}
                </select>
              </div>

              {/* Version */}
              <div>
                <label className="block text-sm font-medium mb-2">Software Version</label>
                <select
                  value={filters.version}
                  onChange={e => setFilters(f => ({ ...f, version: e.target.value }))}
                  className="w-full bg-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#f5a623]"
                >
                  <option value="">Any Version</option>
                  {versions.map(version => (
                    <option key={version} value={version}>{version}</option>
                  ))}
                </select>
              </div>

              {/* Software */}
              <div>
                <label className="block text-sm font-medium mb-2">Software</label>
                <select
                  value={filters.software}
                  onChange={e => setFilters(f => ({ ...f, software: e.target.value }))}
                  className="w-full bg-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#f5a623]"
                >
                  <option value="">Any Software</option>
                  {software.map(sw => (
                    <option key={sw} value={sw}>{sw}</option>
                  ))}
                </select>
              </div>

              {/* Unit of Account */}
              <div>
                <label className="block text-sm font-medium mb-2">Unit of Account</label>
                <select
                  value={filters.unitOfAccount}
                  onChange={e => setFilters(f => ({ ...f, unitOfAccount: e.target.value }))}
                  className="w-full bg-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#f5a623]"
                >
                  <option value="">Any Unit</option>
                  {unitsOfAccount.map(unit => (
                    <option key={unit} value={unit}>{unit}</option>
                  ))}
                </select>
              </div>

              {/* Sort By */}
              <div>
                <label className="block text-sm font-medium mb-2">Sort By</label>
                <select
                  value={filters.sortBy}
                  onChange={e => setFilters(f => ({ ...f, sortBy: e.target.value as any }))}
                  className="w-full bg-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#f5a623]"
                >
                  <option value="likes">Most Liked</option>
                  <option value="rating">Highest Rated</option>
                  <option value="recent">Recently Added</option>
                </select>
              </div>

              {/* NUTs */}
              <div className="md:col-span-2 lg:col-span-3">
                <label className="block text-sm font-medium mb-2">Features (NUTs)</label>
                <div className="flex flex-wrap gap-2">
                  {allNuts.map(nut => (
                    <button
                      key={nut}
                      onClick={() => setFilters(f => ({
                        ...f,
                        nuts: f.nuts.includes(nut)
                          ? f.nuts.filter(n => n !== nut)
                          : [...f.nuts, nut]
                      }))}
                      className={`px-3 py-1 rounded-full text-sm ${
                        filters.nuts.includes(nut)
                          ? 'bg-[#f5a623] text-black'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      {nut}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {filteredMints.map((mint) => (
            <MintCard key={mint.id} mint={mint} />
          ))}
        </div>

        {filteredMints.length === 0 && (
          <div className="text-center py-12 bg-gray-800 rounded-lg">
            <p className="text-gray-400">No mints found matching your filters</p>
          </div>
        )}
      </div>
      <Footer />
    </>
  );
}

export default AllMints;