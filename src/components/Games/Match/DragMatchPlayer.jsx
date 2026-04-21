import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLocalStorage } from '../../../hooks/useLocalStorage';
import { CheckCircle, Info } from 'lucide-react';

export default function DragMatchPlayer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [games] = useLocalStorage('hub_custom_games', []);
  const [game, setGame] = useState(null);
  
  const [names, setNames] = useState([]); // { text, pairId }
  const [targets, setTargets] = useState([]); // { image, pairId }
  const [matches, setMatches] = useState({}); // { pairId: bool }
  const [draggedName, setDraggedName] = useState(null);
  const [isFinished, setIsFinished] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const found = games.find(g => g.id === id);
    if (found && found.type === 'match') {
      setGame(found);
      
      const pairs = found.data.pairs;
      // Shuffle names
      const shuffledNames = pairs.map((p, idx) => ({ text: p.text, pairId: idx }))
                                .sort(() => Math.random() - 0.5);
      // Shuffle targets
      const shuffledTargets = pairs.map((p, idx) => ({ figure: p.figure || p.image, pairId: idx }))
                                  .sort(() => Math.random() - 0.5);
                                  
      setNames(shuffledNames);
      setTargets(shuffledTargets);
    }
  }, [id, games]);

  useEffect(() => {
    if (game && Object.keys(matches).length === game.data.pairs.length) {
      setIsFinished(true);
    }
  }, [matches, game]);

  if (!game) return <div style={{ textAlign: 'center', padding: '4rem' }}>Carregando Jogo...</div>;

  if (isFinished) {
    return (
      <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>
        <CheckCircle size={64} color="var(--success)" style={{ marginBottom: '1.5rem' }} />
        <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Excelente Trabalho!</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Você relacionou todos os nomes corretamente.</p>
        <button className="glow-btn" onClick={() => navigate('/')}>Voltar ao Hub</button>
      </div>
    );
  }

  const handleDragStart = (nameItem) => {
    setDraggedName(nameItem);
  };

  const handleDrop = (targetId) => {
    if (!draggedName) return;
    
    if (draggedName.pairId === targetId) {
      setMatches({ ...matches, [targetId]: true });
      setNames(names.filter(n => n.pairId !== targetId));
    } else {
      // Visual feedback for wrong match could be added here
    }
    setDraggedName(null);
  };

  return (
    <div className="glass-panel" style={{ padding: isMobile ? '1.5rem' : '2.5rem', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: isMobile ? '1.5rem' : '3rem', gap: '1rem' }}>
        <h2 style={{ margin: 0, color: 'var(--text-main)', fontSize: isMobile ? '1.5rem' : '2rem' }}>{game.title}</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}>
            <Info size={18} />
            <span>Arraste o nome até a figura</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '300px 1fr', gap: isMobile ? '2.5rem' : '4rem', alignItems: 'start' }}>
        
        {/* Names List (Draggable) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
           <h4 style={{ color: 'var(--accent)', textTransform: 'uppercase', fontSize: '0.9rem', letterSpacing: '2px', marginBottom: '0.5rem', borderBottom: '2px solid var(--accent)', paddingBottom: '8px', width: 'fit-content' }}>Nomes</h4>
           {names.map((n) => (
             <div 
                key={n.pairId}
                draggable
                onDragStart={() => handleDragStart(n)}
                style={{ 
                    padding: '20px', background: 'var(--bg-card)', 
                    border: '2px solid var(--accent)', borderRadius: '16px',
                    cursor: 'grab', textAlign: 'center', fontSize: '1.3rem', fontWeight: 600,
                    boxShadow: '0 4px 15px rgba(0,0,0,0.3)', transition: 'all 0.3s'
                }}
                onDrag={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
                onDragEnd={(e) => e.currentTarget.style.transform = 'scale(1)'}
                onMouseOver={(e) => e.currentTarget.style.boxShadow = '0 0 15px var(--accent)'}
                onMouseOut={(e) => e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.3)'}
             >
                {n.text}
             </div>
           ))}
           {names.length === 0 && <div style={{ color: 'var(--text-muted)', fontStyle: 'italic', padding: '20px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', textAlign: 'center' }}>Todos relacionados! ✨</div>}
        </div>

        {/* Targets Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '2rem' }}>
           {targets.map((t) => {
             const isMatched = matches[t.pairId];
             const isImage = t.figure && t.figure.startsWith('data:');
             
             return (
               <div 
                  key={t.pairId}
                  onDragOver={(e) => {
                    e.preventDefault();
                    if (!isMatched) e.currentTarget.style.borderColor = 'var(--accent)';
                  }}
                  onDragLeave={(e) => {
                    if (!isMatched) e.currentTarget.style.borderColor = 'var(--glass-border)';
                  }}
                  onDrop={() => handleDrop(t.pairId)}
                  style={{ 
                      aspectRatio: '1', background: isMatched ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255,255,255,0.03)',
                      border: isMatched ? '3px solid var(--success)' : '2px dashed var(--glass-border)',
                      borderRadius: '24px', display: 'flex', flexDirection: 'column',
                      alignItems: 'center', justifyContent: 'center', position: 'relative',
                      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                      boxShadow: isMatched ? '0 0 20px rgba(16, 185, 129, 0.2)' : 'none'
                  }}
               >
                  {t.figure ? (
                      isImage ? (
                        <img 
                            src={t.figure} 
                            alt="Alvo" 
                            style={{ width: '85%', height: '85%', objectFit: 'contain', opacity: isMatched ? 0.2 : 1, transition: 'opacity 0.5s' }} 
                        />
                      ) : (
                        <div style={{ fontSize: '4.5rem', opacity: isMatched ? 0.2 : 1, transition: 'opacity 0.5s' }}>
                            {t.figure}
                        </div>
                      )
                  ) : (
                      <div style={{ color: 'var(--text-muted)', background: 'rgba(0,0,0,0.2)', padding: '20px', borderRadius: '50%' }}>
                        <Link2 size={32} opacity={0.3} />
                      </div>
                  )}
                  
                  {isMatched && (
                      <div style={{ 
                        position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', 
                        justifyContent: 'center', flexDirection: 'column', gap: '12px',
                        animation: 'fadeInScale 0.5s ease-out'
                      }}>
                          <CheckCircle size={48} color="var(--success)" />
                          <span style={{ fontWeight: 800, fontSize: '1.4rem', color: 'var(--text-main)', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                              {game.data.pairs[t.pairId].text}
                          </span>
                      </div>
                  )}
               </div>
             );
           })}
        </div>

      </div>
    </div>
  );
}
