import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useIsMobile } from '../../../hooks/useIsMobile';
import { useLocalStorage } from '../../../hooks/useLocalStorage';
import { Save, Plus, Trash2, HelpCircle, XCircle, Calculator, Zap, Settings } from 'lucide-react';

export default function MathGameEditor() {
  const [games, setGames] = useLocalStorage('hub_custom_games', []);
  const navigate = useNavigate();
  const { id } = useParams();
  const isMobile = useIsMobile();
  
  const [title, setTitle] = useState('');
  const [titleError, setTitleError] = useState(false);
  const [formError, setFormError] = useState('');
  
  // Settings for Auto-Generate
  const [autoGen, setAutoGen] = useState(true);
  const [difficulty, setDifficulty] = useState({
    min: 1,
    max: 10,
    ops: ['+', '-']
  });
  const [level, setLevel] = useState('facil'); // 'facil', 'medio', 'dificil', 'custom'

  const applyPreset = (l) => {
    setLevel(l);
    if (l === 'facil') {
      setDifficulty({ min: 1, max: 10, ops: ['+', '-'] });
    } else if (l === 'medio') {
      setDifficulty({ min: 1, max: 50, ops: ['+', '-', '*'] });
    } else if (l === 'dificil') {
      setDifficulty({ min: 1, max: 100, ops: ['+', '-', '*', '/'] });
    }
  };

  // Custom Operations List
  const [customOps, setCustomOps] = useState([{ id: Date.now(), a: 5, op: '+', b: 3, res: 8 }]);

  useEffect(() => {
    if (id) {
      const existing = games.find(g => g.id === id);
      if (existing && existing.type === 'math') {
        setTitle(existing.title);
        setAutoGen(existing.data.autoGen);
        setDifficulty(existing.data.difficulty || { min: 1, max: 10, ops: ['+', '-', '*', '/'] });
        setCustomOps(existing.data.customOps || []);
      }
    }
  }, [id, games]);

  const addOp = () => {
    setCustomOps([...customOps, { id: Date.now() + Math.random(), a: 1, op: '+', b: 1, res: 2 }]);
  };

  const updateOp = (index, field, value) => {
    const updated = [...customOps];
    updated[index][field] = value;
    
    // Auto-calculate result for convenience
    const { a, op, b } = updated[index];
    const na = parseInt(a) || 0;
    const nb = parseInt(b) || 0;
    if (op === '+') updated[index].res = na + nb;
    if (op === '-') updated[index].res = na - nb;
    if (op === '*') updated[index].res = na * nb;
    if (op === '/') updated[index].res = nb !== 0 ? Math.floor(na / nb) : 0;
    
    setCustomOps(updated);
  };

  const removeOp = (opId) => {
    setCustomOps(customOps.filter(o => o.id !== opId));
  };

  const saveGame = () => {
    setTitleError(false);
    setFormError('');

    if (!title.trim()) {
      setTitleError(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (!autoGen && customOps.length === 0) {
      setFormError("Você precisa ativar o Gerador Automático ou adicionar pelo menos uma conta manual.");
      return;
    }

    const gameData = {
      id: id ? id : Date.now().toString(),
      type: 'math',
      title,
      data: { 
        autoGen, 
        difficulty, 
        customOps: autoGen ? [] : customOps // Clean up if auto-gen is the only thing
      }
    };
    
    if (id) {
       setGames(games.map(g => g.id === id ? gameData : g));
    } else {
       setGames([...games, gameData]);
    }
    navigate('/');
  };

  return (
    <div className="glass-panel" style={{ padding: isMobile ? '1rem' : '3rem', maxWidth: '900px', margin: '0 auto' }}>
      
      <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'stretch' : 'center', justifyContent: 'space-between', marginBottom: '2rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1.5rem', gap: isMobile ? '1rem' : '0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
           <Calculator size={32} color="var(--primary)" />
           <h2 style={{ margin: 0, fontSize: isMobile ? '1.4rem' : '2rem' }}>{id ? 'Editar 4 Operações' : 'Novo Jogo: 4 Operações'}</h2>
        </div>
        <div style={{ display: 'flex', gap: '12px', flexDirection: isMobile ? 'column' : 'row' }}>
            <button className="glow-btn secondary" onClick={() => navigate('/')} style={{ padding: '12px 24px', width: isMobile ? '100%' : 'auto' }}>
                <XCircle size={20} /> Cancelar
            </button>
            <button className="glow-btn" onClick={saveGame} style={{ padding: '12px 24px', width: isMobile ? '100%' : 'auto' }}>
                <Save size={20} /> Salvar Jogo
            </button>
        </div>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <label style={{ display: 'block', marginBottom: '12px', fontWeight: 600 }}>Título do Jogo:</label>
        <input 
          type="text" 
          placeholder="ex. Desafio Matemático do Cabo de Guerra" 
          value={title} 
          onChange={(e) => setTitle(e.target.value)}
          className={titleError ? 'error' : ''}
        />
      </div>

      {/* Mode Selector */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '20px', marginBottom: '3rem' }}>
        <div 
            onClick={() => setAutoGen(true)}
            style={{ 
                padding: '24px', borderRadius: '16px', border: '2px solid', 
                borderColor: autoGen ? 'var(--primary)' : 'var(--glass-border)',
                background: autoGen ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                cursor: 'pointer', textAlign: 'center', transition: 'all 0.3s'
            }}
        >
            <Zap size={32} color={autoGen ? 'var(--primary)' : 'var(--text-muted)'} style={{ marginBottom: '12px' }} />
            <h3 style={{ margin: '0 0 8px 0' }}>Gerador Inteligente</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>O sistema cria contas infinitas automaticamente.</p>
        </div>
        <div 
            onClick={() => setAutoGen(false)}
            style={{ 
                padding: '24px', borderRadius: '16px', border: '2px solid', 
                borderColor: !autoGen ? 'var(--primary)' : 'var(--glass-border)',
                background: !autoGen ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                cursor: 'pointer', textAlign: 'center', transition: 'all 0.3s'
            }}
        >
            <Settings size={32} color={!autoGen ? 'var(--primary)' : 'var(--text-muted)'} style={{ marginBottom: '12px' }} />
            <h3 style={{ margin: '0 0 8px 0' }}>Contas Manuais</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>Você escolhe exatamente quais contas o aluno resolverá.</p>
        </div>
      </div>

      {/* Auto-Gen Settings */}
      {autoGen ? (
        <div className="glass-panel" style={{ padding: isMobile ? '16px' : '24px', background: 'rgba(0,0,0,0.15)', marginBottom: '2rem' }}>
            <h4 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}><Settings size={18} /> Configurações do Gerador</h4>
            
            <div style={{ marginBottom: '2.5rem' }}>
                <label style={{ fontSize: '0.9rem', color: 'var(--text-muted)', display: 'block', marginBottom: '15px' }}>Nível de Dificuldade (Presets):</label>
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap: '15px' }}>
                    {[
                        { id: 'facil', name: 'Fácil', color: 'var(--success)' },
                        { id: 'medio', name: 'Médio', color: 'var(--warning)' },
                        { id: 'dificil', name: 'Difícil', color: 'var(--danger)' }
                    ].map(l => (
                        <button 
                            key={l.id}
                            onClick={() => applyPreset(l.id)}
                            className="glow-btn"
                            style={{ 
                                padding: '12px', background: level === l.id ? l.color : 'rgba(0,0,0,0.2)',
                                border: `2px solid ${level === l.id ? 'white' : 'transparent'}`,
                                fontWeight: 900, fontSize: '0.9rem'
                            }}
                        >
                            {l.name}
                        </button>
                    ))}
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '2rem', marginBottom: '20px' }}>
                <div>
                    <label style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Número Mínimo</label>
                    <input type="number" value={difficulty.min} onChange={(e) => { setDifficulty({...difficulty, min: parseInt(e.target.value)}); setLevel('custom'); }} />
                </div>
                <div>
                    <label style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Número Máximo</label>
                    <input type="number" value={difficulty.max} onChange={(e) => { setDifficulty({...difficulty, max: parseInt(e.target.value)}); setLevel('custom'); }} />
                </div>
            </div>

            <label style={{ fontSize: '0.9rem', color: 'var(--text-muted)', display: 'block', marginBottom: '12px' }}>Operações Incluídas:</label>
            <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                {['+', '-', '*', '/'].map(op => (
                    <button 
                        key={op}
                        onClick={() => {
                            const newOps = difficulty.ops.includes(op) 
                                ? difficulty.ops.filter(o => o !== op)
                                : [...difficulty.ops, op];
                            if (newOps.length > 0) {
                                setDifficulty({...difficulty, ops: newOps});
                                setLevel('custom');
                            }
                        }}
                        style={{ 
                            width: '50px', height: '50px', borderRadius: '8px', fontSize: '1.5rem', fontWeight: 'bold',
                            background: difficulty.ops.includes(op) ? 'var(--primary)' : 'rgba(0,0,0,0.3)',
                            color: 'white', border: '1px solid var(--glass-border)'
                        }}
                    >
                        {op === '*' ? '×' : op === '/' ? '÷' : op}
                    </button>
                ))}
            </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {customOps.map((op, idx) => (
                <div key={op.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: isMobile ? 'wrap' : 'nowrap', background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                    <div style={{ width: '30px', fontWeight: 'bold', color: 'var(--primary)' }}>{idx + 1}</div>
                    <input type="number" value={op.a} style={{ width: '80px' }} onChange={(e) => updateOp(idx, 'a', e.target.value)} />
                    <select value={op.op} style={{ width: '70px', fontSize: '1.2rem' }} onChange={(e) => updateOp(idx, 'op', e.target.value)}>
                        <option value="+">+</option>
                        <option value="-">-</option>
                        <option value="*">×</option>
                        <option value="/">÷</option>
                    </select>
                    <input type="number" value={op.b} style={{ width: '80px' }} onChange={(e) => updateOp(idx, 'b', e.target.value)} />
                    <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>=</span>
                    <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '10px 20px', borderRadius: '8px', color: 'var(--success)', fontWeight: 'bold', flexGrow: 1, textAlign: 'center', minWidth: isMobile ? '100%' : 'unset' }}>
                        {op.res}
                    </div>
                    <button onClick={() => removeOp(op.id)} style={{ color: 'var(--danger)', background: 'transparent' }}><Trash2 size={20} /></button>
                </div>
            ))}
            <button className="glow-btn secondary" onClick={addOp}><Plus size={20} /> Adicionar Conta</button>
        </div>
      )}

      {formError && <div style={{ marginTop: '2rem', padding: '16px', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', borderRadius: '8px', border: '1px solid var(--danger)', textAlign: 'center' }}>{formError}</div>}
    </div>
  );
}
