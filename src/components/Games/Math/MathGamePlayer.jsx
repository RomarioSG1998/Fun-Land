import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useLocalStorage } from '../../../hooks/useLocalStorage';
import { Trophy, Calculator, User, Play, ChevronLeft, ChevronRight, Laptop, X, Link2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Peer } from 'peerjs';

const CHARACTER_TYPES = [
  { id: 'hero', name: 'Herói', color: '#3b82f6', secondary: '#1d4ed8' },
  { id: 'wizard', name: 'Mago', color: '#8b5cf6', secondary: '#5b21b6' },
  { id: 'robot', name: 'Robô', color: '#64748b', secondary: '#334155' },
  { id: 'shadow', name: 'Sombra', color: '#f43f5e', secondary: '#9f1239' },
  { id: 'paladin', name: 'Paladino', color: '#f59e0b', secondary: '#b45309' },
];

const PullingCharacter = ({ side, isPulling, type, name, feedback, isMobile }) => {
  const char = CHARACTER_TYPES.find(c => c.id === type) || CHARACTER_TYPES[0];
  const isLeft = side === 'left';
  const width = isMobile ? 80 : 120;
  const height = isMobile ? 110 : 160;

  // Stable path definitions to prevent 'undefined' errors
  const idlePath = "M50 45 L95 60";
  const pullPath = ["M50 45 L80 58", "M50 45 L70 55", "M50 45 L80 58"];
  
  const idleLegPath = "M50 80 L70 110";
  const pullLegPath = ["M50 80 L75 110", "M50 80 L65 110", "M50 80 L75 110"];

  return (
    <motion.div 
      style={{ width: `${width}px`, height: `${height}px`, position: 'relative', transformOrigin: `50% ${isMobile ? '75px' : '110px'}` }}
      animate={{ 
          rotate: isPulling ? (isLeft ? [-25, -28, -25] : [25, 28, 25]) : (isLeft ? [-10, -12, -10] : [10, 12, 10]),
          x: isPulling ? (isLeft ? [-2, -8, -2] : [2, 8, 2]) : 0
      }}
      transition={{ rotate: { repeat: Infinity, duration: isPulling ? 0.2 : 2 }, x: { repeat: Infinity, duration: 0.2 } }}
    >
      <div style={{ transform: isLeft ? 'none' : 'scaleX(-1)', width: '100%', height: '100%' }}>
        <svg viewBox="0 0 100 120" style={{ width: '100%', height: '100%' }}>
            <ellipse cx="50" cy="115" rx="25" ry="5" fill="black" opacity="0.15" />
            
            {/* Legs */}
            <path d="M50 80 L30 110" stroke={char.secondary} strokeWidth="8" strokeLinecap="round" fill="none" />
            <motion.path animate={{ d: isPulling ? pullLegPath : idleLegPath }} stroke={char.secondary} strokeWidth="8" strokeLinecap="round" fill="none" />
            
            {/* Neck Connection */}
            <path d="M50 25 L50 40" stroke={char.color} strokeWidth="8" strokeLinecap="round" fill="none" />
            
            {/* Torso */}
            <path d="M50 35 L50 80" stroke={char.color} strokeWidth="12" strokeLinecap="round" fill="none" />
            
            <motion.path 
                animate={{ d: isPulling ? pullPath : [idlePath] }}
                transition={{ repeat: isPulling ? Infinity : 0, duration: 0.3 }}
                stroke={char.color} strokeWidth="8" strokeLinecap="round" fill="none" 
            />
            <motion.path 
                animate={{ d: isPulling ? ["M50 55 L75 60", "M50 55 L65 58", "M50 55 L75 60"] : "M50 55 L85 62" }}
                transition={{ repeat: isPulling ? Infinity : 0, duration: 0.3, delay: 0.1 }}
                stroke={char.color} strokeWidth="8" strokeLinecap="round" fill="none" 
            />

            {/* Head - Fixed to body for maximum stability */}
            <g transform="translate(50, 32)">
                <circle cx="0" cy="0" r="16" fill={char.color} />
                <circle cx="6" cy="-3" r="2" fill="white" />
                <path d="M5 6 Q10 10 13 6" stroke="white" strokeWidth="1" fill="none" opacity="0.5" />
                {type === 'wizard' && <path d="M-10 -12 L0 -35 L10 -12 Z" fill="#4B0082" />}
                {type === 'robot' && <rect x="3" y="-6" width="12" height="5" rx="1" fill="cyan" opactiy="0.6" />}
            </g>
        </svg>
      </div>
      <div style={{ position: 'absolute', bottom: isMobile ? '-18px' : '-22px', left: '-20px', right: '-20px', textAlign: 'center', color: 'white', fontWeight: 900, fontSize: isMobile ? '0.7rem' : '0.8rem', textShadow: '0 2px 4px rgba(0,0,0,0.8)', letterSpacing: '0.5px' }}>
        {(name || '').toUpperCase()}
      </div>
    </motion.div>
  );
};

export default function MathGamePlayer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [games] = useLocalStorage('hub_custom_games', []);
  const [game, setGame] = useState(null);
  
  // View Modes: 'full', 'p1', 'p2', 'arena'
  const pParam = searchParams.get('p');
  const viewParam = searchParams.get('v');
  const playerMode = pParam === '1' ? 'p1' : pParam === '2' ? 'p2' : viewParam === 'arena' ? 'arena' : 'full';
  const isHost = playerMode === 'arena' || playerMode === 'full';
  
  // Game State
  const [gameStarted, setGameStarted] = useState(false);
  const [player1, setPlayer1] = useState({ name: 'Jogador 1', charIdx: 0, score: 0, currentQ: null, answer: '', feedback: null });
  const [player2, setPlayer2] = useState({ name: 'Jogador 2', charIdx: 3, score: 0, currentQ: null, answer: '', feedback: null });
  const [ropePosition, setRopePosition] = useState(50); 
  const [isFinished, setIsFinished] = useState(false);
  const [winner, setWinner] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showQR, setShowQR] = useState(false);
  const [localIP, setLocalIP] = useState(window.location.hostname === 'localhost' ? '' : window.location.hostname);
  
  // Real-time Sync State (PeerJS)
  const [peer, setPeer] = useState(null);
  const [conn, setConn] = useState(null); // Remote uses this to talk to Host
  const [remoteConns, setRemoteConns] = useState([]); // Host uses this to listen
  const [isPeerReady, setIsPeerReady] = useState(false);
  const [peerStatus, setPeerStatus] = useState('disconnected'); // 'disconnected', 'connecting', 'connected'

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!id || !games) return;
    const found = games.find(g => String(g.id) === String(id));
    if (found && found.type === 'math') {
        setGame(found);
    } else if (playerMode !== 'full' && playerMode !== 'arena') {
        // Mock game for remote players if local storage is missing
        setGame({
            id: id,
            name: 'Desafio Matemático',
            type: 'math',
            data: { difficulty: { 
                min: parseInt(searchParams.get('mi')) || 1, 
                max: parseInt(searchParams.get('ma')) || 10, 
                ops: (searchParams.get('o') || '+,-').replace(/ /g, '+').split(',')
            }}
        });
    }
  }, [id, games, playerMode, searchParams]);

  useEffect(() => {
    if (ropePosition <= 20 && !isFinished) {
        setWinner(player1?.name || 'Jogador 1');
        setIsFinished(true);
    } else if (ropePosition >= 80 && !isFinished) {
        setWinner(player2?.name || 'Jogador 2');
        setIsFinished(true);
    }
  }, [ropePosition, isFinished]);

  useEffect(() => {
    if (isFinished) {
      const end = Date.now() + (3 * 1000);
      const colors = ['#3b82f6', '#f43f5e', '#ffffff'];
      (function frame() {
        confetti({ particleCount: 3, angle: 60, spread: 55, origin: { x: 0 }, colors: colors });
        confetti({ particleCount: 3, angle: 120, spread: 55, origin: { x: 1 }, colors: colors });
        if (Date.now() < end) requestAnimationFrame(frame);
      }());
    }
  }, [isFinished, winner]);

  useEffect(() => {
    if (!id) return;
    const isHost = playerMode === 'full' || playerMode === 'arena';
    const peerId = `funland-math-${id}`;
    setPeerStatus('connecting');
    
    const newPeer = new Peer(isHost ? peerId : undefined, {
        debug: 1,
        config: {
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' }
            ]
        }
    });

    newPeer.on('open', (pid) => {
        setPeer(newPeer);
        setIsPeerReady(true);
        if (!isHost) {
            const connection = newPeer.connect(peerId);
            setupRemoteConnection(connection);
        } else {
            setPeerStatus('connected');
        }
    });

    newPeer.on('error', (err) => {
        console.error('Peer error:', err);
        setPeerStatus('disconnected');
    });

    const setupRemoteConnection = (connection) => {
        setConn(connection);
        connection.on('open', () => {
            setPeerStatus('connected');
            connection.send({ type: 'JOIN', player: pParam === '1' ? 1 : 2, name: playerMode === 'p1' ? player1.name : player2.name });
        });
        connection.on('data', (data) => {
            if (data.type === 'SYNC') {
                setRopePosition(data.pos);
            } else if (data.type === 'FINISH') {
                setWinner(data.winner);
                setIsFinished(true);
            }
        });
        connection.on('close', () => setPeerStatus('disconnected'));
        connection.on('error', () => setPeerStatus('disconnected'));
    };

    if (isHost) {
        newPeer.on('connection', (c) => {
            setRemoteConns(prev => [...prev, c]);
            c.on('data', (data) => {
                if (data.type === 'PULL') {
                    if (data.player === 1) simulateP1Pull();
                    else simulateP2Pull();
                } else if (data.type === 'JOIN') {
                    setPeerStatus('connected');
                    if (data.player === 1) setPlayer1(p => ({ ...p, name: data.name || 'Jogador 1' }));
                    else setPlayer2(p => ({ ...p, name: data.name || 'Jogador 2' }));
                }
            });
            c.on('close', () => {
                setRemoteConns(prev => prev.filter(conn => conn !== c));
                if (remoteConns.length <= 1) setPeerStatus('connected'); // Still ready
            });
        });
    }

    return () => newPeer.destroy();
  }, [id, playerMode]);

  useEffect(() => {
    if (isHost && (remoteConns.length > 0)) {
        broadcast({ type: 'SYNC', pos: ropePosition });
        if (isFinished && winner) {
            broadcast({ type: 'FINISH', winner: winner });
        }
    }
  }, [ropePosition, isFinished, winner, remoteConns.length]);

  const broadcast = (data) => {
    remoteConns.forEach(c => {
        if (c.open) c.send(data);
    });
  };

  const simulateP1Pull = () => {
    if (isFinished) return;
    setPlayer1(p => ({ ...p, feedback: 'correct', score: p.score + 1 }));
    setRopePosition(pos => Math.max(pos - 6, 0));
    
    setTimeout(() => {
        if (!game) return;
        setPlayer1(p => ({ ...p, feedback: null, answer: '', currentQ: generateQ(game) }));
    }, 800);
  };

  const simulateP2Pull = () => {
    if (isFinished) return;
    setPlayer2(p => ({ ...p, feedback: 'correct', score: p.score + 1 }));
    setRopePosition(pos => Math.min(pos + 6, 100));

    setTimeout(() => {
        if (!game) return;
        setPlayer2(p => ({ ...p, feedback: null, answer: '', currentQ: generateQ(game) }));
    }, 800);
  };

  const generateQ = (g) => {
    if (!g || !g.data || !g.data.difficulty) return { a: 1, op: '+', b: 1, res: 2 };
    const { min, max, ops } = g.data.difficulty || { min: 1, max: 10, ops: ['+', '-'] };
    const op = ops && ops.length > 0 ? ops[Math.floor(Math.random() * ops.length)] : '+';
    let a = Math.floor(Math.random() * ((max || 10) - (min || 1) + 1)) + (min || 1);
    let b = Math.floor(Math.random() * ((max || 10) - (min || 1) + 1)) + (min || 1);
    if (op === '-') { if (a < b) [a, b] = [b, a]; }
    if (op === '/') { a = b * (Math.floor(Math.random() * 5) + 1); }
    let res;
    if (op === '+') res = a + b;
    if (op === '-') res = a - b;
    if (op === '*') res = a * b;
    if (op === '/') res = a / b;
    return { a, op, b, res };
  };

  const startGame = () => {
    setPlayer1(prev => ({ ...prev, currentQ: generateQ(game) }));
    setPlayer2(prev => ({ ...prev, currentQ: generateQ(game) }));
    setGameStarted(true);
  };

  const handleP1Submit = (e) => {
    if (e) e.preventDefault();
    if (!player1.currentQ || player1.feedback) return;
    const correct = parseInt(player1.answer) === player1.currentQ.res;
    if (correct) {
      if (conn) conn.send({ type: 'PULL', player: 1 });
      simulateP1Pull();
    } else {
      setPlayer1(p => ({ ...p, feedback: 'wrong' }));
      setTimeout(() => setPlayer1(p => ({ ...p, feedback: null, answer: '' })), 600);
    }
  };

  const handleP2Submit = (e) => {
    if (e) e.preventDefault();
    if (!player2.currentQ || player2.feedback) return;
    const correct = parseInt(player2.answer) === player2.currentQ.res;
    if (correct) {
      if (conn) conn.send({ type: 'PULL', player: 2 });
      simulateP2Pull();
    } else {
      setPlayer2(p => ({ ...p, feedback: 'wrong' }));
      setTimeout(() => setPlayer2(p => ({ ...p, feedback: null, answer: '' })), 600);
    }
  };

  const changeChar = (player, direction) => {
    const setP = player === 1 ? setPlayer1 : setPlayer2;
    const p = player === 1 ? player1 : player2;
    let nextIndex = (p.charIdx + direction) % CHARACTER_TYPES.length;
    if (nextIndex < 0) nextIndex = CHARACTER_TYPES.length - 1;
    setP(prev => ({ ...prev, charIdx: nextIndex }));
  };

  // Start game automatically for remote controllers if they open the link
  useEffect(() => {
    if (game && !gameStarted && playerMode !== 'full' && playerMode !== 'arena') {
        startGame();
    }
  }, [game, gameStarted, playerMode]);

  if (!game) return (
    <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', margin: '4rem auto', maxWidth: '400px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }} className="spin-slow">⚔️</div>
        <h3 style={{ marginBottom: '1rem' }}>Sincronizando Arena...</h3>
        <p style={{ fontSize: '0.8rem', opacity: 0.6 }}>ID: {id}</p>
        <div style={{ height: '4px', width: '100%', background: 'rgba(255,255,255,0.1)', overflow: 'hidden', position: 'relative', borderRadius: '2px', marginTop: '1rem' }}>
            <motion.div animate={{ left: ['-100%', '100%'] }} transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }} style={{ position: 'absolute', top: 0, bottom: 0, width: '40%', background: 'var(--primary)' }} />
        </div>
    </div>
  );

  if (!gameStarted) {
    return (
      <div className="glass-panel" style={{ padding: isMobile ? '1rem' : '3rem', maxWidth: '800px', margin: '2rem auto', textAlign: 'center' }}>
        <h2 style={{ marginBottom: isMobile ? '1.5rem' : '2.5rem', fontSize: isMobile ? '1.5rem' : '2.2rem', fontWeight: 900 }}>Escolha seu Lutador</h2>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? '1rem' : '3rem', marginBottom: '2rem' }}>
          {[1, 2].map(pNum => {
              const p = pNum === 1 ? player1 : player2;
              const char = (p && p.charIdx !== undefined) ? CHARACTER_TYPES[p.charIdx] : CHARACTER_TYPES[0];
              return (
                <div key={pNum} style={{ background: 'rgba(0,0,0,0.2)', padding: isMobile ? '16px' : '30px', borderRadius: '24px', border: `2px solid ${char.color}` }}>
                  <label style={{ color: char.color, fontWeight: 900, fontSize: '1.1rem', marginBottom: '15px', display: 'block' }}>Jogador {pNum}</label>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: isMobile ? '10px' : '20px', marginBottom: '20px' }}>
                    <button onClick={() => changeChar(pNum, -1)} className="glow-btn" style={{ padding: '10px' }}><ChevronLeft /></button>
                    <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '50%', padding: '10px' }}>
                        <PullingCharacter side={pNum === 1 ? 'left' : 'right'} type={char.id} name="" isMobile={isMobile} />
                    </div>
                    <button onClick={() => changeChar(pNum, 1)} className="glow-btn" style={{ padding: '10px' }}><ChevronRight /></button>
                  </div>
                  <input type="text" value={p.name} onChange={(e) => (pNum === 1 ? setPlayer1 : setPlayer2)({...p, name: e.target.value})} style={{ textAlign: 'center' }} />
                </div>
              );
          })}
        </div>
        <button className="glow-btn" style={{ width: '100%', padding: isMobile ? '16px' : '25px', fontSize: isMobile ? '1.1rem' : '1.5rem', fontWeight: 900 }} onClick={startGame}>LUTAR!</button>
      </div>
    );
  }

  if (isFinished) {
    return (
      <div className="glass-panel" style={{ padding: isMobile ? '1.25rem' : '4rem', textAlign: 'center', maxWidth: '600px', margin: isMobile ? '1rem auto' : '4rem auto' }}>
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1, rotate: [0, 15, -15, 0] }} transition={{ duration: 0.6 }}><Trophy size={80} color="var(--success)" style={{ marginBottom: '2rem' }} /></motion.div>
        <h2 style={{ fontSize: isMobile ? '1.8rem' : '3rem', fontWeight: 900 }}>{winner} VENCEU!</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: isMobile ? '1rem' : '1.2rem', marginBottom: '2rem' }}>Uma vitória histórica no Cabo de Guerra!</p>
        <button className="glow-btn" style={{ padding: '15px 24px', width: isMobile ? '100%' : 'auto' }} onClick={() => navigate('/')}>Voltar ao Hub</button>
      </div>
    );
  }

  const renderFullArena = () => (
    <div className="glass-panel" style={{ height: isMobile ? '180px' : '300px', position: 'relative', overflow: 'hidden', background: 'rgba(0,0,0,0.6)', borderRadius: '30px', border: '2px solid rgba(255,255,255,0.05)' }}>
         {/* Arena Background & Danger Zones */}
         <div style={{ position: 'absolute', inset: 0, opacity: 0.15, background: 'radial-gradient(circle at 50% 50%, rgba(255,0,0,0.3) 0%, transparent 40%)' }} />
         
         {/* Ground Line & Limits */}
         <div style={{ position: 'absolute', bottom: '50px', left: '10%', right: '10%', height: '2px', background: 'rgba(255,255,255,0.05)' }} />
         {/* Main Limit Line */}
         <div style={{ position: 'absolute', bottom: '40px', left: '50%', width: '4px', height: '20px', background: '#cc0000', borderRadius: '2px', transform: 'translateX(-50%)', boxShadow: '0 0 15px #ff0000' }} />
         
         {/* Player Bounday Lines */}
         <div style={{ position: 'absolute', bottom: '45px', left: '20%', width: '2px', height: '10px', background: 'rgba(255,255,255,0.3)' }} />
         <div style={{ position: 'absolute', bottom: '45px', right: '20%', width: '2px', height: '10px', background: 'rgba(255,255,255,0.3)' }} />

         <div style={{ position: 'absolute', top: 0, bottom: 0, left: '50%', width: '2px', background: 'rgba(255,255,255,0.05)', zIndex: 1, borderLeft: '1px dashed rgba(255,255,255,0.2)' }} />
         
         <svg width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0, zIndex: 2 }}>
            <defs>
                <linearGradient id="ropeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#5d2e0c" />
                    <stop offset="50%" stopColor="#8b4513" />
                    <stop offset="100%" stopColor="#5d2e0c" />
                </linearGradient>
            </defs>

             {/* The Rope - Layered for realism */}
            <motion.g 
                animate={{ 
                    y: player1.feedback === 'correct' || player2.feedback === 'correct' ? [0, -2, 2, 0] : 0
                }}
                transition={{ repeat: Infinity, duration: 0.1 }}
            >
                {/* Rope Body - Positioned to align with hands */}
                <rect x="4%" y={isMobile ? "100" : "162"} width="92%" height={isMobile ? "10" : "16"} rx="8" fill="url(#ropeGrad)" />
                
                {/* Twist Details - Simulated with dashed lines */}
                <line x1="5%" y1={isMobile ? "103" : "166"} x2="95%" y2={isMobile ? "103" : "166"} stroke="#a0522d" strokeWidth={isMobile ? "1" : "2"} strokeDasharray="10,5" opacity="0.6" />
                <line x1="5%" y1={isMobile ? "107" : "174"} x2="95%" y2={isMobile ? "107" : "174"} stroke="#4a2508" strokeWidth={isMobile ? "1" : "2"} strokeDasharray="10,5" opacity="0.6" />
                
                {/* Shine Layer */}
                <rect x="4%" y={isMobile ? "100" : "162"} width="92%" height={isMobile ? "3" : "4"} rx="2" fill="white" opacity="0.1" />
            </motion.g>
         </svg>

          <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, display: 'flex', justifyContent: 'center', pointerEvents: 'none' }}>
            {/* P1 at Left Extremity (ropePosition - 35%) */}
            <div style={{ position: 'absolute', left: `${Math.max(0, ropePosition - 35)}%`, top: isMobile ? '-40px' : '-47px', transition: 'left 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)', zIndex: 3 }}>
                <PullingCharacter side="left" isPulling={player1?.feedback === 'correct'} type={CHARACTER_TYPES[player1?.charIdx || 0]?.id} name={player1?.name || ''} feedback={player1?.feedback} isMobile={isMobile} />
            </div>
            {/* P2 at Right Extremity (ropePosition + 20%) */}
            <div style={{ position: 'absolute', left: `${Math.min(100, ropePosition + 15)}%`, top: isMobile ? '-40px' : '-47px', transition: 'left 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)', zIndex: 3 }}>
                <PullingCharacter side="right" isPulling={player2?.feedback === 'correct'} type={CHARACTER_TYPES[player2?.charIdx || 3]?.id} name={player2?.name || ''} feedback={player2?.feedback} isMobile={isMobile} />
            </div>
          </div>
         
         <button onClick={() => setShowQR(true)} style={{ position: 'absolute', bottom: '10px', right: '10px', background: 'rgba(0,0,0,0.4)', color: 'white', padding: '8px', borderRadius: '50%', zIndex: 10 }}>
            <Link2 size={20} />
         </button>

         {/* Connection Indicator */}
         <div style={{ position: 'absolute', top: '15px', right: '15px', display: 'flex', alignItems: 'center', gap: '8px', zIndex: 10, background: 'rgba(0,0,0,0.4)', padding: isMobile ? '4px 8px' : '5px 12px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: peerStatus === 'connected' ? 'var(--success)' : peerStatus === 'connecting' ? 'var(--warning)' : 'var(--danger)', boxShadow: peerStatus === 'connected' ? '0 0 10px var(--success)' : 'none' }}></div>
            <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'white' }}>{peerStatus === 'connected' ? 'SYNC' : peerStatus === 'connecting' ? (isMobile ? 'CONECTANDO' : 'BUSCANDO JOGADORES...') : 'OFFLINE'}</span>
         </div>
      </div>
  );

  const renderPlayerInput = (p, idx, handleS) => {
    if (!p.currentQ) {
        return (
            <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                <div style={{ position: 'absolute', top: '15px', right: '15px', fontSize: '0.7rem', color: peerStatus === 'connected' ? 'var(--success)' : 'var(--danger)', fontWeight: 900 }}>
                   {peerStatus === 'connected' ? '● CONECTADO AO TELÃO' : '○ DESCONECTADO'}
                </div>
                <div style={{ fontSize: '3rem', marginBottom: '1.5rem', opacity: 0.5 }}>📱</div>
                <h3>Aguardando o Professor...</h3>
                <p style={{ color: 'var(--text-muted)' }}>O jogo começará em breve no telão.</p>
            </div>
        );
    }

    return (
        <motion.div animate={{ borderColor: p?.feedback === 'correct' ? 'var(--success)' : p?.feedback === 'wrong' ? 'var(--danger)' : 'rgba(255,255,255,0.1)' }} className="glass-panel" style={{ padding: isMobile ? '1rem' : '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderWidth: '4px', background: p?.feedback === 'correct' ? 'rgba(16,185,129,0.1)' : 'var(--bg-card)', minHeight: playerMode !== 'full' ? '80vh' : 'auto' }}>
            <div style={{ color: CHARACTER_TYPES[p?.charIdx || 0]?.color, fontWeight: 900, marginBottom: '1rem', fontSize: isMobile ? '1rem' : '1.4rem', letterSpacing: '1px', textAlign: 'center', wordBreak: 'break-word' }}>{(p?.name || '').toUpperCase()}</div>
            <motion.div key={p?.currentQ?.res} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ fontSize: isMobile ? '2.3rem' : '5rem', fontWeight: 900, marginBottom: '1.25rem', textShadow: '0 4px 15px rgba(0,0,0,0.5)', textAlign: 'center' }}>
                {p?.currentQ?.a || 0} {p?.currentQ?.op === '*' ? '×' : p?.currentQ?.op === '/' ? '÷' : p?.currentQ?.op || '+'} {p?.currentQ?.b || 0}
            </motion.div>
            <form onSubmit={handleS} style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '12px', width: '100%', justifyContent: 'center', alignItems: 'stretch' }}>
                <input autoFocus type="number" value={p?.answer || ''} onChange={(e) => (idx === 0 ? setPlayer1 : setPlayer2)({...p, answer: e.target.value})} placeholder="?" style={{ fontSize: isMobile ? '2rem' : '3rem', width: isMobile ? '100%' : '150px', minHeight: isMobile ? '64px' : '80px', textAlign: 'center', background: 'rgba(0,0,0,0.8)', borderRadius: '20px', border: `3px solid ${CHARACTER_TYPES[p?.charIdx || 0]?.color}`, color: 'white' }} />
                <button type="submit" className="glow-btn" style={{ padding: isMobile ? '14px' : '0 40px', fontSize: isMobile ? '1.2rem' : '1.8rem', fontWeight: 900, background: CHARACTER_TYPES[p?.charIdx || 0]?.color, minHeight: isMobile ? '64px' : '80px', width: isMobile ? '100%' : 'auto' }}>PUXAR!</button>
            </form>
        </motion.div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: isMobile ? 'auto' : '90vh', gap: '1.5rem', paddingBottom: '2rem' }}>
      
      {/* View Logic */}
      {(playerMode === 'full' || playerMode === 'arena') && renderFullArena()}

      {playerMode === 'full' && (
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', flexGrow: 1, gap: '1rem' }}>
            {renderPlayerInput(player1, 0, handleP1Submit)}
            {renderPlayerInput(player2, 1, handleP2Submit)}
        </div>
      )}

      {playerMode === 'p1' && renderPlayerInput(player1, 0, handleP1Submit)}
      {playerMode === 'p2' && renderPlayerInput(player2, 1, handleP2Submit)}

      {/* QR Code Modal */}
      <AnimatePresence>
        {showQR && (
            <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)' }}>
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="glass-panel" style={{ width: '94%', maxWidth: '700px', maxHeight: '92vh', overflowY: 'auto', padding: isMobile ? '1rem' : '2.5rem', position: 'relative' }}>
                    <button onClick={() => setShowQR(false)} style={{ position: 'absolute', top: '15px', right: '15px', color: 'var(--text-muted)' }}><X /></button>
                    <h2 style={{ textAlign: 'center', marginBottom: '1rem', fontSize: isMobile ? '1.1rem' : '1.6rem' }}>Conectar Celulares (WiFi)</h2>
                    
                    <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '15px', borderRadius: '12px', marginBottom: '2rem', border: '1px solid var(--primary)' }}>
                        <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '8px', fontWeight: 600 }}>1. Digite o IP da sua máquina (Ex: 192.168.1.50):</label>
                        <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '10px' }}>
                            <input 
                                type="text" 
                                placeholder="Digite seu IP local..." 
                                value={localIP} 
                                onChange={(e) => setLocalIP(e.target.value)}
                                style={{ padding: '8px 12px', fontSize: '0.9rem' }}
                            />
                            <div style={{ background: 'var(--bg-dark)', padding: '8px 12px', borderRadius: '8px', fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                                Porta: {window.location.port || '80'}
                            </div>
                        </div>
                        <p style={{ fontSize: '0.75rem', marginTop: '8px', color: 'var(--primary)' }}>💡 Dica: No Windows use 'ipconfig' no terminal para ver seu IPv4.</p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '2rem' }}>
                         {game && [1, 2].map(p => {
                            const d = game.data.difficulty || { min: 1, max: 10, ops: ['+', '-'] };
                            const host = localIP || window.location.hostname;
                            const port = window.location.port ? `:${window.location.port}` : '';
                            const baseUrl = `${window.location.protocol}//${host}${port}${window.location.pathname}#/play/math/${game.id}`;
                            const params = `?p=${p}&mi=${d.min}&ma=${d.max}&o=${encodeURIComponent(d.ops.join(','))}`;
                            const url = `${baseUrl}${params}`;
                            return (
                                <div key={p} style={{ textAlign: 'center', background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '20px' }}>
                                    <h4 style={{ marginBottom: '15px' }}>Scanear Jogador {p}</h4>
                                    <div style={{ background: 'white', padding: '10px', borderRadius: '12px', display: 'inline-block', marginBottom: '15px' }}>
                                        <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`} alt="QR" width={isMobile ? "140" : "180"} />
                                    </div>
                                    <div style={{ fontSize: '0.8rem', wordBreak: 'break-all', opacity: 0.5 }}>{url}</div>
                                </div>
                            );
                        })}
                    </div>
                    <div style={{ marginTop: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                        <p>Cada aluno scaneia um lado para controlar seu lutador direto do celular!</p>
                        <p style={{ marginTop: '5px', fontSize: '0.8rem' }}>(Requer que os dispositivos estejam na mesma rede ou acesso à internet)</p>
                    </div>
                </motion.div>
            </div>
        )}
      </AnimatePresence>
    </div>
  );
}


