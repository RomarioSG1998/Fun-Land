import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLocalStorage } from '../../../hooks/useLocalStorage';

export default function MemoryPlayer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [games] = useLocalStorage('hub_custom_games', []);
  const [game, setGame] = useState(null);
  
  const [cards, setCards] = useState([]);
  const [flipped, setFlipped] = useState([]); 
  const [matched, setMatched] = useState([]); 
  const [moves, setMoves] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const found = games.find(g => g.id === id);
    if (found && found.type === 'memory') {
      setGame(found);
      
      let initialCards = [];
      found.data.pairs.forEach((p, idx) => {
        initialCards.push({ id: `a_${idx}`, val: p.a, pairId: idx });
        initialCards.push({ id: `b_${idx}`, val: p.b, pairId: idx });
      });
      
      initialCards.sort(() => Math.random() - 0.5);
      setCards(initialCards);
    }
  }, [id, games]);

  useEffect(() => {
    if (flipped.length === 2) {
      setMoves(m => m + 1);
      const [idx1, idx2] = flipped;
      if (cards[idx1].pairId === cards[idx2].pairId) {
        setMatched(prev => {
          const newMatched = [...prev, cards[idx1].pairId];
          if (newMatched.length === game.data.pairs.length) {
            setIsFinished(true);
          }
          return newMatched;
        });
        setFlipped([]);
      } else {
        setTimeout(() => {
          setFlipped([]);
        }, 1200); 
      }
    }
  }, [flipped, cards, game]);

  if (!game) return <div style={{ textAlign: 'center', padding: '4rem' }}>Carregando Jogo...</div>;

  if (isFinished) {
    return (
      <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>
        <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Campeão da Memória!</h2>
        <h1 style={{ color: 'var(--primary)', fontSize: '3rem', marginBottom: '2rem' }}>Você terminou em {moves} movimentos</h1>
        <button className="glow-btn" onClick={() => navigate('/')}>Voltar ao Hub</button>
      </div>
    );
  }

  return (
    <div className="glass-panel" style={{ padding: isMobile ? '1rem' : '2.5rem', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: isMobile ? '0.85rem' : '1rem' }}>
        <span style={{ fontWeight: 600 }}>{game.title}</span>
        <span>Movimentos: {moves}</span>
      </div>
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: `repeat(auto-fit, minmax(${isMobile ? '100px' : '140px'}, 1fr))`, 
        gap: isMobile ? '10px' : '20px' 
      }}>
        {cards.map((card, idx) => {
          const isFlipped = flipped.includes(idx) || matched.includes(card.pairId);
          const isObj = typeof card.val === 'object';
          const text = isObj ? card.val.text : card.val;
          const image = isObj ? card.val.image : null;

          return (
            <div 
              key={card.id}
              onClick={() => {
                if (flipped.length < 2 && !isFlipped) {
                  setFlipped([...flipped, idx]);
                }
              }}
              style={{
                height: '160px',
                perspective: '1000px',
                cursor: isFlipped ? 'default' : 'pointer'
              }}
            >
              <div style={{
                width: '100%',
                height: '100%',
                position: 'relative',
                transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                transformStyle: 'preserve-3d',
                transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
              }}>
                {/* Back */}
                <div style={{
                  position: 'absolute',
                  width: '100%',
                  height: '100%',
                  backfaceVisibility: 'hidden',
                  background: 'linear-gradient(135deg, var(--bg-card), var(--bg-dark))',
                  border: '2px solid var(--primary)',
                  borderRadius: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 8px 15px rgba(0,0,0,0.3)',
                  transition: 'all 0.3s'
                }}
                onMouseOver={(e) => { if (!isFlipped) e.currentTarget.style.boxShadow = 'var(--shadow-glow)' }}
                onMouseOut={(e) => { if (!isFlipped) e.currentTarget.style.boxShadow = '0 8px 15px rgba(0,0,0,0.3)' }}
                >
                  <span style={{ color: 'var(--primary)', fontSize: '2.5rem', opacity: 0.5, fontWeight: 'bold' }}>?</span>
                </div>
                
                {/* Front */}
                <div style={{
                  position: 'absolute',
                  width: '100%',
                  height: '100%',
                  backfaceVisibility: 'hidden',
                  background: matched.includes(card.pairId) ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                  border: matched.includes(card.pairId) ? '2px solid var(--success)' : '2px solid var(--glass-border)',
                  borderRadius: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transform: 'rotateY(180deg)',
                  boxShadow: '0 8px 15px rgba(0,0,0,0.3)',
                  padding: '12px',
                  textAlign: 'center',
                  gap: '8px'
                }}>
                  {image && (
                    <img 
                        src={image} 
                        alt="Carta" 
                        style={{ maxWidth: '100%', maxHeight: image && text ? '70%' : '100%', borderRadius: '8px', objectFit: 'contain' }} 
                    />
                  )}
                  {text && (
                    <span style={{ 
                        fontSize: image ? '0.9rem' : '1.2rem', 
                        fontWeight: 600, 
                        color: matched.includes(card.pairId) ? 'var(--text-main)' : 'var(--primary)',
                        wordBreak: 'break-word'
                    }}>
                        {text}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
