import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLocalStorage } from '../../../hooks/useLocalStorage';
import { useIsMobile } from '../../../hooks/useIsMobile';

export default function QuizPlayer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [games] = useLocalStorage('hub_custom_games', []);
  const [game, setGame] = useState(null);
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [selectedOpt, setSelectedOpt] = useState(null);

  useEffect(() => {
    const found = games.find(g => g.id === id);
    if (found && found.type === 'quiz') setGame(found);
  }, [id, games]);

  if (!game) return <div style={{ textAlign: 'center', padding: '4rem' }}>Carregando Jogo...</div>;

  const handleAnswer = (optIndex) => {
    if (selectedOpt !== null) return; 
    setSelectedOpt(optIndex);
    
    const isCorrect = game.data.questions[currentIndex].correct === optIndex;
    if (isCorrect) setScore(score + 1);

    setTimeout(() => {
      setSelectedOpt(null);
      if (currentIndex + 1 < game.data.questions.length) {
        setCurrentIndex(currentIndex + 1);
      } else {
        setIsFinished(true);
      }
    }, 1200);
  };

  if (isFinished) {
    return (
      <div className="glass-panel" style={{ padding: isMobile ? '1.25rem' : '3rem', textAlign: 'center' }}>
        <h2 style={{ fontSize: isMobile ? '1.8rem' : '2.5rem', marginBottom: '1rem' }}>Quiz Concluído!</h2>
        <h1 style={{ color: 'var(--primary)', fontSize: isMobile ? '2.4rem' : '4rem', marginBottom: '2rem' }}>{score} / {game.data.questions.length}</h1>
        <button className="glow-btn" onClick={() => navigate('/')} style={{ width: isMobile ? '100%' : 'auto' }}>Voltar ao Hub</button>
      </div>
    );
  }

  const currentQ = game.data.questions[currentIndex];

  return (
    <div className="glass-panel" style={{ padding: isMobile ? '1rem' : '2.5rem', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? '6px' : '0', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '0.9rem' }}>
        <span style={{ fontWeight: 600 }}>{game.title}</span>
        <span>{currentIndex + 1} / {game.data.questions.length}</span>
      </div>
      
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        {currentQ.qImage && (
            <img src={currentQ.qImage} alt="Questão" style={{ maxWidth: '100%', maxHeight: '250px', borderRadius: '12px', marginBottom: '1.5rem', border: '2px solid var(--glass-border)' }} />
        )}
        <h2 style={{ fontSize: isMobile ? '1.4rem' : '2rem', marginBottom: '0' }}>{currentQ.q}</h2>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : (currentQ.options.some(o => o.image) ? '1fr 1fr' : '1fr'), gap: '1.5rem' }}>
        {currentQ.options.map((opt, idx) => {
          const isObj = typeof opt === 'object';
          const text = isObj ? opt.text : opt;
          const image = isObj ? opt.image : null;

          let btnStyle = { 
            width: '100%', 
            padding: '20px', 
            background: 'rgba(15,23,42,0.8)', 
            border: '1px solid var(--glass-border)', 
            borderRadius: '12px', 
            transition: 'all 0.3s', 
            textAlign: 'center', 
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px'
          };
          
          if (selectedOpt !== null) {
            if (idx === currentQ.correct) {
              btnStyle.background = 'rgba(16, 185, 129, 0.2)'; 
              btnStyle.borderColor = 'var(--success)';
              btnStyle.boxShadow = '0 0 15px rgba(16, 185, 129, 0.3)';
            } else if (idx === selectedOpt) {
              btnStyle.background = 'rgba(239, 68, 68, 0.2)'; 
              btnStyle.borderColor = 'var(--danger)';
              btnStyle.boxShadow = '0 0 15px rgba(239, 68, 68, 0.3)';
            }
          }

          return (
            <button 
              key={idx} 
              style={btnStyle}
              onClick={() => handleAnswer(idx)}
              onMouseOver={(e) => { if(selectedOpt===null) e.currentTarget.style.borderColor = 'var(--primary)'; }}
              onMouseOut={(e) => { if(selectedOpt===null) e.currentTarget.style.borderColor = 'var(--glass-border)'; }}
            >
              {image && <img src={image} alt={`Opção ${idx}`} style={{ width: '100%', maxHeight: '120px', objectFit: 'contain', borderRadius: '8px' }} />}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ 
                  background: 'rgba(255,255,255,0.05)', 
                  width: '28px', height: '28px', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', 
                  borderRadius: '50%', fontWeight: 'bold', fontSize: '0.8rem'
                }}>
                  {String.fromCharCode(65 + idx)}
                </span>
                <span style={{ fontSize: isMobile ? '1rem' : '1.2rem', color: 'var(--text-main)' }}>{text}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
