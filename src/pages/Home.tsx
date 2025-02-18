import React from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, Clock, ArrowRight, Loader2, Shield, Award, MessageSquare, Star } from 'lucide-react';
import { useMints } from '../context/MintsContext';
import MintCard from '../components/MintCard';
import Footer from '../components/Footer';

const Home = () => {
  const { mints, loading, error } = useMints();

  // Sort mints by different criteria
  const topLikedMints = [...mints]
    .sort((a, b) => {
      // First sort by likes
      const likesDiff = b.likes - a.likes;
      // If likes are equal, sort by rating
      if (likesDiff === 0) {
        return b.rating - a.rating;
      }
      return likesDiff;
    })
    .slice(0, 10);

  const topRatedMints = [...mints]
    .sort((a, b) => {
      // First sort by rating
      const ratingDiff = b.rating - a.rating;
      // If ratings are equal, sort by number of recommendations
      if (ratingDiff === 0) {
        return b.recommendations.length - a.recommendations.length;
      }
      return ratingDiff;
    })
    .filter(mint => mint.rating > 0) // Only show mints with ratings
    .slice(0, 10);

  const lastReviewedMints = [...mints]
    .sort((a, b) => {
      const aRecommendation = a.recommendations[0];
      const bRecommendation = b.recommendations[0];
      const aTime = aRecommendation ? aRecommendation.createdAt : 0;
      const bTime = bRecommendation ? bRecommendation.createdAt : 0;
      return bTime - aTime;
    })
    .slice(0, 10);

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
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-[#f5a623] to-[#f7b84b] text-transparent bg-clip-text">
            Discover Trusted Cashu Mints
          </h1>
          <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
            Find, review, and share reliable Cashu mints. Join the community in building a safer and more transparent ecash ecosystem.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              to="/get-started"
              className="bg-[#f5a623] text-black px-6 py-3 rounded-lg font-semibold hover:bg-[#d48c1c] transition-colors"
            >
              Get Started
            </Link>
            <Link
              to="/all-mints"
              className="bg-gray-800 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-700 transition-colors"
            >
              View All Mints
            </Link>
          </div>
        </div>

        {/* Featured Sections */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {/* Most Liked */}
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 shadow-xl">
            <div className="flex items-center space-x-3 mb-6">
              <TrendingUp className="h-8 w-8 text-[#f5a623]" />
              <h2 className="text-2xl font-bold">Most Liked</h2>
            </div>
            <div className="space-y-4">
              {topLikedMints.slice(0, 3).map((mint, index) => (
                <Link 
                  key={mint.id} 
                  to={`/mint/${mint.id}`}
                  className="block"
                >
                  <div className="relative bg-gray-700/50 backdrop-blur-sm rounded-lg p-4 hover:bg-gray-600/50 transition-colors">
                    <div className="absolute -left-2 -top-2 w-8 h-8 bg-[#f5a623] rounded-full flex items-center justify-center text-black font-bold shadow-lg">
                      {index + 1}
                    </div>
                    <div className="ml-6">
                      <h3 className="font-semibold text-lg mb-2">{mint.name}</h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-400">
                        <span>{mint.likes} likes</span>
                        <div className="flex">
                          {[...Array(mint.rating)].map((_, i) => (
                            <Star key={i} className="h-4 w-4 text-yellow-500 fill-current" />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Top Rated */}
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 shadow-xl">
            <div className="flex items-center space-x-3 mb-6">
              <Award className="h-8 w-8 text-[#f5a623]" />
              <h2 className="text-2xl font-bold">Top Rated</h2>
            </div>
            <div className="space-y-4">
              {topRatedMints.slice(0, 3).map((mint) => (
                <Link 
                  key={mint.id} 
                  to={`/mint/${mint.id}`}
                  className="block"
                >
                  <div className="bg-gray-700/50 backdrop-blur-sm rounded-lg p-4 hover:bg-gray-600/50 transition-colors">
                    <h3 className="font-semibold text-lg mb-2">{mint.name}</h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-400">
                      <span>{mint.recommendations.length} reviews</span>
                      <div className="flex">
                        {[...Array(mint.rating)].map((_, i) => (
                          <Star key={i} className="h-4 w-4 text-yellow-500 fill-current" />
                        ))}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Last Reviewed */}
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 shadow-xl">
            <div className="flex items-center space-x-3 mb-6">
              <MessageSquare className="h-8 w-8 text-[#f5a623]" />
              <h2 className="text-2xl font-bold">Last Reviewed</h2>
            </div>
            <div className="space-y-4">
              {lastReviewedMints.slice(0, 3).map((mint) => (
                <Link 
                  key={mint.id} 
                  to={`/mint/${mint.id}`}
                  className="block"
                >
                  <div className="bg-gray-700/50 backdrop-blur-sm rounded-lg p-4 hover:bg-gray-600/50 transition-colors">
                    <h3 className="font-semibold text-lg mb-2">{mint.name}</h3>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">
                        {new Date(mint.recommendations[0]?.createdAt * 1000).toLocaleDateString()}
                      </span>
                      <div className="flex">
                        {[...Array(mint.rating)].map((_, i) => (
                          <Star key={i} className="h-4 w-4 text-yellow-500 fill-current" />
                        ))}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Full Lists */}
        <div className="space-y-12">
          {/* Top Liked Mints */}
          <section>
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-3">
                <TrendingUp className="h-6 w-6 text-[#f5a623]" />
                <h2 className="text-2xl font-bold">Most Liked Mints</h2>
              </div>
              <Link 
                to="/all-mints" 
                className="flex items-center text-[#f5a623] hover:text-[#d48c1c] transition-colors"
              >
                View all
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </div>
            <div className="grid gap-4">
              {topLikedMints.map((mint) => (
                <MintCard key={mint.id} mint={mint} />
              ))}
            </div>
          </section>

          {/* Top Rated Mints */}
          <section>
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-3">
                <Award className="h-6 w-6 text-[#f5a623]" />
                <h2 className="text-2xl font-bold">Highest Rated Mints</h2>
              </div>
              <Link 
                to="/all-mints" 
                className="flex items-center text-[#f5a623] hover:text-[#d48c1c] transition-colors"
              >
                View all
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </div>
            <div className="grid gap-4">
              {topRatedMints.map((mint) => (
                <MintCard key={mint.id} mint={mint} />
              ))}
            </div>
          </section>

          {/* Last Reviewed */}
          <section>
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-3">
                <Clock className="h-6 w-6 text-[#f5a623]" />
                <h2 className="text-2xl font-bold">Last Reviewed</h2>
              </div>
              <Link 
                to="/all-mints" 
                className="flex items-center text-[#f5a623] hover:text-[#d48c1c] transition-colors"
              >
                View all
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </div>
            <div className="grid gap-4">
              {lastReviewedMints.map((mint) => (
                <MintCard key={mint.id} mint={mint} />
              ))}
            </div>
          </section>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Home;