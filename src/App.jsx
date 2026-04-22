import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useIsMobile } from './hooks/useIsMobile';
import QuizEditor from './components/Games/Quiz/QuizEditor';
import QuizPlayer from './components/Games/Quiz/QuizPlayer';
import MemoryEditor from './components/Games/Memory/MemoryEditor';
import MemoryPlayer from './components/Games/Memory/MemoryPlayer';
import DragMatchEditor from './components/Games/Match/DragMatchEditor';
import DragMatchPlayer from './components/Games/Match/DragMatchPlayer';
import MathGameEditor from './components/Games/Math/MathGameEditor';
import MathGamePlayer from './components/Games/Math/MathGamePlayer';
import { Rocket, Brain, Layers, Gamepad2, Play, Palette, User, Edit, Trash2, Link2, Calculator } from 'lucide-react';

function OnboardingScreen({ onComplete }) {
  const [name, setName] = useState('');
  const [theme, setTheme] = useState('ocean');
  const [error, setError] = useState(false);
  const isMobile = useIsMobile();

  const themes = [
    { id: 'ocean', name: 'Oceano Azul', color: '#3b82f6', accent: '#8b5cf6' },
    { id: 'forest', name: 'Floresta Viva', color: '#10b981', accent: '#3b82f6' },
    { id: 'fire', name: 'Chama Quente', color: '#ef4444', accent: '#f97316' },
    { id: 'sunset', name: 'Pôr do Sol Violeta', color: '#ec4899', accent: '#a855f7' },
    { id: 'neon', name: 'Cyberpunk Neon', color: '#eab308', accent: '#06b6d4' }
  ];

  useEffect(() => {
    document.body.setAttribute('data-theme', theme);
  }, [theme]);

  const handleStart = () => {
    if (!name.trim()) {
      setError(true);
      return;
    }
    onComplete({ name: name.trim(), theme });
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: isMobile ? '1rem' : '2rem' }}>
      <div className="glass-panel" style={{ maxWidth: '600px', width: '100%', padding: isMobile ? '1.5rem' : '4rem', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', padding: isMobile ? '12px' : '16px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '50%', marginBottom: '1.5rem' }}>
          <Rocket size={isMobile ? 36 : 48} color="var(--primary)" />
        </div>
        <h2 style={{ fontSize: isMobile ? '1.8rem' : '2.5rem', marginBottom: '1rem' }}>Bem-vindo ao Fun Land!</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: isMobile ? '1rem' : '1.2rem', marginBottom: isMobile ? '2rem' : '3rem' }}>
          Qual o seu nome para configurarmos sua plataforma?
        </p>

        <div style={{ textAlign: 'left', marginBottom: '2rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', fontSize: isMobile ? '1rem' : '1.1rem', fontWeight: 600 }}>
            <User size={20} color="var(--primary)" /> Nome do Professor(a)
          </label>
          <input
            type="text"
            placeholder="Digite seu nome..."
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError(false);
            }}
            className={error ? 'error' : ''}
          />
          {error && <span className="error-text">O nome é obrigatório.</span>}
        </div>

        <div style={{ textAlign: 'left', marginBottom: isMobile ? '2rem' : '3rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', fontSize: isMobile ? '1rem' : '1.1rem', fontWeight: 600 }}>
            <Palette size={20} color="var(--primary)" /> Escolha sua cor favorita
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, minmax(0, 1fr))' : 'repeat(auto-fit, minmax(100px, 1fr))', gap: isMobile ? '10px' : '16px' }}>
            {themes.map(t => (
              <div
                key={t.id}
                onClick={() => setTheme(t.id)}
                style={{
                  border: theme === t.id ? '2px solid var(--text-main)' : '2px solid transparent',
                  background: 'rgba(0,0,0,0.2)',
                  borderRadius: '12px',
                  padding: isMobile ? '12px 6px' : '16px 8px',
                  cursor: 'pointer',
                  textAlign: 'center',
                  transform: theme === t.id ? 'scale(1.05)' : 'scale(1)'
                }}
              >
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: `linear-gradient(135deg, ${t.color}, ${t.accent})`, margin: '0 auto 8px auto' }}></div>
                <span style={{ fontSize: isMobile ? '0.78rem' : '0.85rem' }}>{t.name}</span>
              </div>
            ))}
          </div>
        </div>

        <button className="glow-btn" onClick={handleStart} style={{ width: '100%' }}>Vamos Começar!</button>
      </div>
    </div>
  );
}

function HubDashboard({ teacherProfile }) {
  const [games, setGames] = useLocalStorage('hub_custom_games', []);
  const [showTemplates, setShowTemplates] = useState(false);
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const removeGame = (id) => {
    if (window.confirm('Apagar este jogo permanentemente?')) {
      setGames(games.filter(g => g.id !== id));
    }
  };

  return (
    <div style={{ textAlign: 'center', marginTop: isMobile ? '1rem' : '2rem' }}>
      <header style={{ marginBottom: isMobile ? '2rem' : '4rem' }}>
        <h2 style={{ fontSize: isMobile ? '2rem' : '3rem', marginBottom: '0.5rem' }}>Olá, <span style={{ color: 'var(--primary)' }}>{teacherProfile.name}</span>!</h2>
        <p style={{ color: 'var(--text-muted)' }}>Gerencie seus jogos educativos de forma personalizada.</p>
      </header>

      <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'stretch' : 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem', marginBottom: '2rem', gap: isMobile ? '12px' : '0' }}>
        <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px', justifyContent: isMobile ? 'center' : 'flex-start' }}><Gamepad2 /> Seus Jogos</h3>
        <button className="glow-btn" onClick={() => setShowTemplates(!showTemplates)} style={{ width: isMobile ? '100%' : 'auto' }}>
          {showTemplates ? 'Fechar Molduras' : '+ Criar Novo'}
        </button>
      </div>

      {showTemplates && (
        <div style={{ background: 'rgba(0,0,0,0.1)', padding: isMobile ? '1rem' : '2rem', borderRadius: '16px', marginBottom: '3rem', border: '1px dashed var(--glass-border)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px' }}>
            <div className="glass-panel" style={{ padding: '20px' }}>
              <Brain color="var(--primary)" />
              <h4>Quiz</h4>
              <button className="glow-btn" style={{ width: '100%', marginTop: '10px' }} onClick={() => navigate('/create/quiz')}>Novo Quiz</button>
            </div>
            <div className="glass-panel" style={{ padding: '20px' }}>
              <Layers color="var(--primary)" />
              <h4>Memória</h4>
              <button className="glow-btn" style={{ width: '100%', marginTop: '10px' }} onClick={() => navigate('/create/memory')}>Nova Memória</button>
            </div>
            <div className="glass-panel" style={{ padding: '20px' }}>
              <Link2 color="var(--accent)" />
              <h4>Relacionar</h4>
              <button className="glow-btn" style={{ width: '100%', marginTop: '10px', background: 'var(--accent)' }} onClick={() => navigate('/create/match')}>Nova Relação</button>
            </div>
            <div className="glass-panel" style={{ padding: '20px' }}>
              <Calculator color="var(--primary)" />
              <h4>4 Operações</h4>
              <button className="glow-btn" style={{ width: '100%', marginTop: '10px' }} onClick={() => navigate('/create/math')}>Cabo de Guerra</button>
            </div>
          </div>
        </div>
      )}

      {games.length === 0 ? (
        <p style={{ color: 'var(--text-muted)', padding: '3rem' }}>Nenhum jogo criado ainda. Use os moldes acima!</p>
      ) : (
        <div className="game-grid">
          {games.map(g => (
            <div key={g.id} className="glass-panel" style={{ padding: '24px', textAlign: 'left', position: 'relative' }}>
              <div style={{ position: 'absolute', top: '15px', right: '15px', display: 'flex', gap: '5px' }}>
                <button onClick={() => navigate(`/edit/${g.type}/${g.id}`)} style={{ background: 'transparent', color: 'var(--primary)' }}><Edit size={16} /></button>
                <button onClick={() => removeGame(g.id)} style={{ background: 'transparent', color: 'var(--danger)' }}><Trash2 size={16} /></button>
              </div>
              <h4 style={{ margin: '0 0 10px 0', fontSize: '1.2rem' }}>{g.title}</h4>
              <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '10px', background: 'rgba(255,255,255,0.1)', textTransform: 'uppercase' }}>{g.type}</span>
              <button className="glow-btn secondary" style={{ width: '100%', marginTop: '20px' }} onClick={() => navigate(`/play/${g.type}/${g.id}`)}>
                <Play size={16} fill="currentColor" /> Iniciar Jogo
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function App() {
  const [teacherProfile, setTeacherProfile] = useLocalStorage('funland_teacher_profile', null);
  const isRemote = window.location.href.includes('p=1') || window.location.href.includes('p=2') || window.location.href.includes('v=arena');
  const isMobile = useIsMobile();

  useEffect(() => {
    const theme = teacherProfile?.theme || 'ocean';
    document.body.setAttribute('data-theme', theme);
  }, [teacherProfile]);

  if (!teacherProfile && !isRemote) {
    return <OnboardingScreen onComplete={(profile) => setTeacherProfile(profile)} />;
  }

  return (
    <Router>
      <div className="layout-container" style={{ minHeight: '100vh' }}>
        {!isRemote && (
          <header style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'stretch' : 'center', justifyContent: 'space-between', gap: isMobile ? '12px' : '0', marginBottom: isMobile ? '1.5rem' : '3rem' }}>
            <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: isMobile ? 'center' : 'flex-start', gap: '10px' }}>
              <Rocket size={32} color="var(--primary)" />
              <h1 style={{ margin: 0, fontSize: isMobile ? '1.5rem' : '1.8rem', color: 'var(--text-main)' }}>Fun Land</h1>
            </Link>
            <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '12px', alignItems: 'center' }}>
              <span style={{ fontSize: '0.9rem', opacity: 0.7 }}>Prof. <strong>{teacherProfile?.name || 'Visitante'}</strong></span>
              <Link to="/" style={{ width: isMobile ? '100%' : 'auto' }}><button className="glow-btn secondary" style={{ width: isMobile ? '100%' : 'auto' }}>Dashboard</button></Link>
            </div>
          </header>
        )}

        <Routes>
          <Route path="/" element={<HubDashboard teacherProfile={teacherProfile} />} />
          <Route path="/create/quiz" element={<QuizEditor />} />
          <Route path="/edit/quiz/:id" element={<QuizEditor />} />
          <Route path="/play/quiz/:id" element={<QuizPlayer />} />

          <Route path="/create/memory" element={<MemoryEditor />} />
          <Route path="/edit/memory/:id" element={<MemoryEditor />} />
          <Route path="/play/memory/:id" element={<MemoryPlayer />} />

          <Route path="/create/match" element={<DragMatchEditor />} />
          <Route path="/edit/match/:id" element={<DragMatchEditor />} />
          <Route path="/play/match/:id" element={<DragMatchPlayer />} />

          <Route path="/create/math" element={<MathGameEditor />} />
          <Route path="/edit/math/:id" element={<MathGameEditor />} />
          <Route path="/play/math/:id" element={<MathGamePlayer />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
