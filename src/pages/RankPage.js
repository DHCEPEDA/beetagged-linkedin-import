import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

// BeeTagged colors
const beeYellow = '#FFEC16';
const beeGold = '#FD9E31';

// ELO Rating Game Component - Core gamification feature
const RatingGame = ({ gameData, onVote, onSkip }) => {
  if (!gameData) return null;

  const { contestant1, contestant2, category, attribute } = gameData;

  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '12px',
      padding: '20px',
      margin: '20px',
      boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
    }}>
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <div style={{
          backgroundColor: beeYellow,
          color: '#333',
          padding: '8px 16px',
          borderRadius: '20px',
          display: 'inline-block',
          fontWeight: 'bold',
          fontSize: '14px',
          marginBottom: '10px'
        }}>
          {category}: {attribute}
        </div>
        <h2 style={{ fontSize: '18px', color: '#333', margin: '10px 0' }}>
          Who's better?
        </h2>
      </div>

      <div style={{ display: 'flex', gap: '15px', justifyContent: 'space-between' }}>
        {/* Contestant 1 */}
        <button
          onClick={() => onVote(contestant1._id)}
          style={{
            flex: 1,
            padding: '20px',
            backgroundColor: '#f8f9fa',
            border: '2px solid #e0e0e0',
            borderRadius: '12px',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            textAlign: 'center'
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = '#e8f5e8';
            e.target.style.borderColor = beeGold;
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = '#f8f9fa';
            e.target.style.borderColor = '#e0e0e0';
          }}
        >
          <div style={{ fontWeight: 'bold', fontSize: '16px', marginBottom: '8px' }}>
            {contestant1.name}
          </div>
          <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>
            {contestant1.priorityData?.employment?.current?.jobFunction} at{' '}
            {contestant1.priorityData?.employment?.current?.employer}
          </div>
          <div style={{ fontSize: '12px', color: '#888' }}>
            Current Rating: {contestant1.eloRating || 1200}
          </div>
        </button>

        {/* Contestant 2 */}
        <button
          onClick={() => onVote(contestant2._id)}
          style={{
            flex: 1,
            padding: '20px',
            backgroundColor: '#f8f9fa',
            border: '2px solid #e0e0e0',
            borderRadius: '12px',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            textAlign: 'center'
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = '#e8f5e8';
            e.target.style.borderColor = beeGold;
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = '#f8f9fa';
            e.target.style.borderColor = '#e0e0e0';
          }}
        >
          <div style={{ fontWeight: 'bold', fontSize: '16px', marginBottom: '8px' }}>
            {contestant2.name}
          </div>
          <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>
            {contestant2.priorityData?.employment?.current?.jobFunction} at{' '}
            {contestant2.priorityData?.employment?.current?.employer}
          </div>
          <div style={{ fontSize: '12px', color: '#888' }}>
            Current Rating: {contestant2.eloRating || 1200}
          </div>
        </button>
      </div>

      <div style={{ textAlign: 'center', marginTop: '20px' }}>
        <button
          onClick={onSkip}
          style={{
            backgroundColor: 'transparent',
            border: '1px solid #ccc',
            padding: '10px 20px',
            borderRadius: '20px',
            cursor: 'pointer',
            color: '#666',
            fontSize: '14px'
          }}
        >
          Skip This Round
        </button>
      </div>
    </div>
  );
};

// Leaderboard component
const Leaderboard = ({ rankings, category }) => {
  if (!rankings || rankings.length === 0) return null;

  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '12px',
      padding: '20px',
      margin: '20px'
    }}>
      <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '15px', textAlign: 'center' }}>
        Top {category} Rankings
      </h3>
      
      {rankings.slice(0, 10).map((contact, index) => (
        <div
          key={contact._id}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px 0',
            borderBottom: index < 9 ? '1px solid #f0f0f0' : 'none'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{
              width: '30px',
              height: '30px',
              borderRadius: '50%',
              backgroundColor: index < 3 ? beeGold : '#f0f0f0',
              color: index < 3 ? 'white' : '#666',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              fontSize: '14px',
              marginRight: '12px'
            }}>
              {index + 1}
            </div>
            <div>
              <div style={{ fontWeight: 'bold', fontSize: '14px' }}>
                {contact.name}
              </div>
              <div style={{ fontSize: '12px', color: '#666' }}>
                {contact.priorityData?.employment?.current?.employer}
              </div>
            </div>
          </div>
          <div style={{ 
            fontWeight: 'bold', 
            color: beeGold,
            fontSize: '14px'
          }}>
            {contact.eloRating || 1200}
          </div>
        </div>
      ))}
    </div>
  );
};

// Game statistics component
const GameStats = ({ stats }) => (
  <div style={{
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '20px',
    margin: '20px'
  }}>
    <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '15px', textAlign: 'center' }}>
      Your Gaming Stats
    </h3>
    
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '24px', fontWeight: 'bold', color: beeGold }}>
          {stats.gamesPlayed || 0}
        </div>
        <div style={{ fontSize: '12px', color: '#666' }}>Games Played</div>
      </div>
      
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '24px', fontWeight: 'bold', color: beeGold }}>
          {stats.accuracy || 0}%
        </div>
        <div style={{ fontSize: '12px', color: '#666' }}>Accuracy</div>
      </div>
      
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '24px', fontWeight: 'bold', color: beeGold }}>
          {stats.streakLength || 0}
        </div>
        <div style={{ fontSize: '12px', color: '#666' }}>Current Streak</div>
      </div>
      
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '24px', fontWeight: 'bold', color: beeGold }}>
          {stats.pointsEarned || 0}
        </div>
        <div style={{ fontSize: '12px', color: '#666' }}>Points Earned</div>
      </div>
    </div>
  </div>
);

// Main rank page component
const RankPage = () => {
  const { user } = useAuth();
  const [currentGame, setCurrentGame] = useState(null);
  const [loading, setLoading] = useState(false);
  const [gameStats, setGameStats] = useState({});
  const [leaderboards, setLeaderboards] = useState({});
  const [activeCategory, setActiveCategory] = useState('skills');
  const [hasNotification, setHasNotification] = useState(false);

  useEffect(() => {
    loadGameData();
    checkForNotifications();
  }, []);

  const loadGameData = async () => {
    try {
      const response = await fetch(`/api/gamification/game-data/${user.id}`);
      const data = await response.json();
      
      if (data.success) {
        setGameStats(data.stats || {});
        setLeaderboards(data.leaderboards || {});
        if (data.availableGame) {
          setCurrentGame(data.availableGame);
        }
      }
    } catch (error) {
      console.error('Failed to load game data:', error);
      // Demo data for development
      setGameStats({
        gamesPlayed: 47,
        accuracy: 78,
        streakLength: 5,
        pointsEarned: 2340
      });
      
      setLeaderboards({
        skills: [
          { _id: '1', name: 'John Smith', eloRating: 1650, priorityData: { employment: { current: { employer: 'Google' } } } },
          { _id: '2', name: 'Sarah Johnson', eloRating: 1590, priorityData: { employment: { current: { employer: 'Meta' } } } }
        ],
        personality: [
          { _id: '3', name: 'Mike Chen', eloRating: 1720, priorityData: { employment: { current: { employer: 'Apple' } } } }
        ]
      });
    }
  };

  const checkForNotifications = () => {
    // Check if there are pending games that need rating
    const lastGameCheck = localStorage.getItem('beetagged_last_game_check');
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    
    if (!lastGameCheck || (now - parseInt(lastGameCheck)) > oneHour) {
      setHasNotification(true);
    }
  };

  const startNewGame = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/gamification/start-game', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setCurrentGame(data.game);
        setHasNotification(false);
        localStorage.setItem('beetagged_last_game_check', Date.now().toString());
      }
    } catch (error) {
      console.error('Failed to start game:', error);
      // Demo game for development
      setCurrentGame({
        _id: 'demo-game-1',
        contestant1: {
          _id: '1',
          name: 'John Smith',
          eloRating: 1450,
          priorityData: {
            employment: { current: { jobFunction: 'Software Engineer', employer: 'Google' } }
          }
        },
        contestant2: {
          _id: '2',
          name: 'Sarah Johnson',
          eloRating: 1380,
          priorityData: {
            employment: { current: { jobFunction: 'Product Manager', employer: 'Meta' } }
          }
        },
        category: 'Skills',
        attribute: 'JavaScript'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (winnerId) => {
    if (!currentGame) return;

    try {
      const response = await fetch('/api/gamification/submit-vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          gameId: currentGame._id,
          winnerId: winnerId
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Update stats and load next game
        setGameStats(prev => ({
          ...prev,
          gamesPlayed: (prev.gamesPlayed || 0) + 1,
          pointsEarned: (prev.pointsEarned || 0) + (data.pointsAwarded || 10),
          streakLength: data.streakLength || 0
        }));
        
        // Load next game automatically
        setTimeout(() => {
          startNewGame();
        }, 1000);
      }
    } catch (error) {
      console.error('Failed to submit vote:', error);
    }
    
    setCurrentGame(null);
  };

  const handleSkip = () => {
    setCurrentGame(null);
    setTimeout(() => {
      startNewGame();
    }, 500);
  };

  const categories = ['skills', 'personality', 'industry'];

  return (
    <div style={{ backgroundColor: '#f5f5f5', minHeight: '100vh', paddingBottom: '20px' }}>
      {/* Header */}
      <div style={{
        backgroundColor: 'white',
        padding: '20px',
        borderBottom: '1px solid #e0e0e0',
        textAlign: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '10px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>
            Rate Game
          </h1>
          {hasNotification && (
            <div style={{
              width: '12px',
              height: '12px',
              backgroundColor: '#FF3B30',
              borderRadius: '50%',
              marginLeft: '8px'
            }} />
          )}
        </div>
        <div style={{ fontSize: '14px', color: '#666' }}>
          Help improve network rankings by rating contacts
        </div>
      </div>

      {/* Current Game */}
      {currentGame ? (
        <RatingGame
          gameData={currentGame}
          onVote={handleVote}
          onSkip={handleSkip}
        />
      ) : (
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '40px 20px',
          margin: '20px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>🏆</div>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '10px' }}>
            Ready to Play?
          </h2>
          <div style={{ fontSize: '14px', color: '#666', marginBottom: '20px' }}>
            Rate contacts to earn points and improve network rankings
          </div>
          <button
            onClick={startNewGame}
            disabled={loading}
            style={{
              backgroundColor: beeGold,
              color: 'white',
              border: 'none',
              padding: '15px 30px',
              borderRadius: '25px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1
            }}
          >
            {loading ? 'Loading...' : 'Start Game'}
          </button>
        </div>
      )}

      {/* Game Stats */}
      <GameStats stats={gameStats} />

      {/* Category Selector */}
      <div style={{ padding: '0 20px', marginBottom: '20px' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          backgroundColor: '#f8f9fa',
          borderRadius: '25px',
          padding: '5px'
        }}>
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              style={{
                padding: '10px 20px',
                margin: '0 5px',
                border: 'none',
                borderRadius: '20px',
                backgroundColor: activeCategory === category ? beeGold : 'transparent',
                color: activeCategory === category ? 'white' : '#666',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                textTransform: 'capitalize'
              }}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Leaderboard */}
      <Leaderboard 
        rankings={leaderboards[activeCategory] || []} 
        category={activeCategory}
      />

      {/* How It Works */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '20px',
        margin: '20px'
      }}>
        <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '15px' }}>
          How the ELO Rating System Works
        </h3>
        <div style={{ fontSize: '14px', color: '#666', lineHeight: '1.5' }}>
          <p>• When two contacts have tied attributes, you rate who's better</p>
          <p>• Winners gain points and advance to play other winners</p>
          <p>• Losers play other losers until rankings stabilize</p>
          <p>• Your ratings improve search results and network organization</p>
          <p>• Earn points for consistent and accurate rating decisions</p>
        </div>
      </div>
    </div>
  );
};

export default RankPage;