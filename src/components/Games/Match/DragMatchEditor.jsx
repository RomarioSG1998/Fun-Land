import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLocalStorage } from '../../../hooks/useLocalStorage';
import { Save, Plus, Trash2, HelpCircle, XCircle, Image as ImageIcon, Smile, Link2 } from 'lucide-react';
import { compressImage } from '../../../utils/imageUtils';
import EmojiPicker from 'emoji-picker-react';

export default function DragMatchEditor() {
  const [games, setGames] = useLocalStorage('hub_custom_games', []);
  const navigate = useNavigate();
  const { id } = useParams();
  
  const [title, setTitle] = useState('');
  const [titleError, setTitleError] = useState(false);
  const [formError, setFormError] = useState('');
  const [pairs, setPairs] = useState([{ id: Date.now(), text: '', figure: '' }]);
  
  const [activePicker, setActivePicker] = useState(null); // { index, field: 'text' | 'figure' }

  useEffect(() => {
    if (id) {
      const existing = games.find(g => g.id === id);
      if (existing && existing.type === 'match') {
        setTitle(existing.title);
        setPairs(existing.data.pairs.map((p, i) => ({
          id: p.id || Date.now() + i,
          text: p.text || '',
          figure: p.figure || p.image || '' // Support legacy 'image' field
        })));
      }
    }
  }, [id, games]);

  const addPair = () => {
    setPairs([...pairs, { id: Date.now() + Math.random(), text: '', figure: '' }]);
  };

  const updatePair = (index, field, value) => {
    const updated = [...pairs];
    updated[index][field] = value;
    setPairs(updated);
  };

  const handleEmojiClick = (emojiData) => {
    const { index, field } = activePicker;
    const currentText = pairs[index][field];
    
    // For text, append. For figure, replace (since it's a single pictogram usually).
    if (field === 'text') {
      updatePair(index, field, currentText + emojiData.emoji);
    } else {
      updatePair(index, field, emojiData.emoji);
    }
    setActivePicker(null);
  };

  const handleImageUpload = (index, file) => {
    if (!file) return;
    compressImage(file, (base64) => {
      updatePair(index, 'figure', base64);
    });
  };

  const removePair = (pairId) => {
    if(pairs.length === 1) return;
    setPairs(pairs.filter(p => p.id !== pairId));
  };

  const saveGame = () => {
    setTitleError(false);
    setFormError('');

    if (!title.trim()) {
      setTitleError(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const validPairs = pairs.filter(p => (p.text.trim() || p.image));
    if (validPairs.length < 2) {
      setFormError("Você precisa de pelo menos 2 pares preenchidos para criar o jogo.");
      return;
    }

    // Strict Redundancy Check
    const signatures = validPairs.map(p => (p.text.trim().toLowerCase() + (p.image ? '|img' : '')));
    const uniqueSignatures = new Set(signatures);
    if (uniqueSignatures.size !== signatures.length) {
      setFormError("Existem itens idênticos (mesmo texto e imagem). Evite redundâncias para melhor UX.");
      return;
    }

    const gameData = {
      id: id ? id : Date.now().toString(),
      type: 'match',
      title,
      data: { pairs: validPairs }
    };
    
    if (id) {
       setGames(games.map(g => g.id === id ? gameData : g));
    } else {
       setGames([...games, gameData]);
    }
    navigate('/');
  };

  return (
    <div className="glass-panel" style={{ padding: '3rem', maxWidth: '900px', margin: '0 auto', position: 'relative' }}>
      
      {activePicker && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)' }}>
            <div style={{ position: 'relative' }}>
                <button onClick={() => setActivePicker(null)} style={{ position: 'absolute', top: '-10px', right: '-10px', zIndex: 1001, background: 'var(--danger)', border: 'none', borderRadius: '50%', color: 'white', width: '30px', height: '30px', cursor: 'pointer' }}>X</button>
                <EmojiPicker onEmojiClick={handleEmojiClick} theme="dark" />
            </div>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
           <Link2 size={32} color="var(--accent)" />
           <h2 style={{ margin: 0, fontSize: '2rem' }}>{id ? 'Editar Relacionar' : 'Novo Jogo de Relacionar'}</h2>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
            <button className="glow-btn secondary" onClick={() => navigate('/')} style={{ padding: '12px 24px' }}>
                <XCircle size={20} />
                Cancelar
            </button>
            <button className="glow-btn" onClick={saveGame} style={{ padding: '12px 24px', background: 'linear-gradient(135deg, var(--accent), var(--accent-hover))', border: 'none' }}>
                <Save size={20} />
                {id ? 'Salvar Edições' : 'Salvar Jogo'}
            </button>
        </div>
      </div>

      <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
        Neste jogo, o aluno deverá arrastar os nomes (texto/emoji) até as figuras (imagem) correspondentes.
      </p>
      
      <div style={{ marginBottom: '3rem', background: 'rgba(0,0,0,0.15)', padding: '24px', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
        <label style={{ display: 'block', marginBottom: '12px', color: 'var(--text-main)', fontSize: '1.1rem', fontWeight: 600 }}>
          Título do Jogo:
        </label>
        <input 
          type="text" 
          placeholder="ex. Relacione os Animais" 
          value={title} 
          onChange={(e) => {
             setTitle(e.target.value);
             setTitleError(false);
          }} 
          className={titleError ? 'error' : ''}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '3rem' }}>
        {pairs.map((p, index) => (
          <div key={p.id} style={{ 
            display: 'grid', gridTemplateColumns: 'auto 1fr 1fr auto', gap: '1.5rem', alignItems: 'center',
            background: 'rgba(15, 23, 42, 0.4)', padding: '1.5rem', borderRadius: '12px', 
            border: '1px solid var(--glass-border)'
          }}>
            <div style={{ background: 'var(--accent)', color: 'white', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', fontSize: '0.9rem' }}>
               {index + 1}
            </div>

            <div style={{ position: 'relative' }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Nome / Emoji ✍️</label>
                <div style={{ position: 'relative' }}>
                    <input 
                        type="text" 
                        placeholder="ex. Sol" 
                        value={p.text} 
                        onChange={(e) => updatePair(index, 'text', e.target.value)}
                        style={{ paddingRight: '40px' }}
                    />
                    <button 
                        onClick={() => setActivePicker({ index, field: 'text' })}
                        style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--accent)' }}
                    >
                        <Smile size={20} />
                    </button>
                </div>
            </div>

            <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Figura Correspondente 🖼️</label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    
                    {/* Emoji Selector for Figure */}
                    <button 
                        onClick={() => setActivePicker({ index, field: 'figure' })}
                        className="glow-btn secondary"
                        style={{ flexGrow: 1, padding: '8px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)' }}
                    >
                        <Smile size={18} style={{ color: 'var(--accent)' }} />
                        <span style={{ fontSize: '0.85rem' }}>Escolher Emoji</span>
                    </button>

                    <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>ou</span>

                    {/* Image Upload for Figure */}
                    <label style={{ cursor: 'pointer', padding: '8px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', display: 'flex', alignItems: 'center', border: '1px dashed var(--glass-border)' }}>
                        <ImageIcon size={16} />
                        <input type="file" accept="image/*" onChange={(e) => handleImageUpload(index, e.target.files[0])} style={{ display: 'none' }} />
                    </label>

                    {p.figure && (
                        <div style={{ position: 'relative', minWidth: '45px' }}>
                            {p.figure.startsWith('data:') ? (
                                <img src={p.figure} alt="Preview" style={{ width: '45px', height: '45px', borderRadius: '8px', objectFit: 'cover' }} />
                            ) : (
                                <div style={{ fontSize: '1.8rem', width: '45px', height: '45px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                                    {p.figure}
                                </div>
                            )}
                            <button onClick={() => updatePair(index, 'figure', '')} style={{ position: 'absolute', top: '-5px', right: '-5px', background: 'var(--danger)', border: 'none', borderRadius: '50%', width: '18px', height: '18px', color: 'white', fontSize: '10px', cursor: 'pointer' }}>X</button>
                        </div>
                    )}
                </div>
            </div>

            {pairs.length > 1 && (
              <button onClick={() => removePair(p.id)} style={{ background: 'transparent', color: 'var(--danger)', padding: '8px' }}>
                <Trash2 size={20} />
              </button>
            )}
          </div>
        ))}
      </div>

      {formError && (
        <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--danger)', padding: '16px', borderRadius: '8px', color: 'var(--danger)', marginBottom: '2rem', textAlign: 'center' }}>
          {formError}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <button className="glow-btn secondary" onClick={addPair} style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}>
          <Plus size={24} /> Novo Par de Relação
        </button>
      </div>
    </div>
  );
}
