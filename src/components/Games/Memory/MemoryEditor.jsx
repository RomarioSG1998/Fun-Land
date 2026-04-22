import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useIsMobile } from '../../../hooks/useIsMobile';
import { useLocalStorage } from '../../../hooks/useLocalStorage';
import { Save, Plus, Trash2, HelpCircle, XCircle, Image as ImageIcon, Smile } from 'lucide-react';
import { compressImage } from '../../../utils/imageUtils';
import EmojiPicker from 'emoji-picker-react';

export default function MemoryEditor() {
  const [games, setGames] = useLocalStorage('hub_custom_games', []);
  const navigate = useNavigate();
  const { id } = useParams(); 
  const isMobile = useIsMobile();
  
  const [title, setTitle] = useState('');
  const [titleError, setTitleError] = useState(false);
  const [formError, setFormError] = useState('');
  const [pairs, setPairs] = useState([{ id: Date.now(), a: {text: '', image: ''}, b: {text: '', image: ''} }]);

  // Emoji Picker State
  const [activePicker, setActivePicker] = useState(null); // { index, side }

  useEffect(() => {
    if (id) {
      const existing = games.find(g => g.id === id);
      if (existing && existing.type === 'memory') {
        setTitle(existing.title);
        setPairs(existing.data.pairs.map((p, i) => ({
          id: p.id || Date.now() + i,
          a: typeof p.a === 'string' ? { text: p.a, image: '' } : p.a,
          b: typeof p.b === 'string' ? { text: p.b, image: '' } : p.b,
        })));
      }
    }
  }, [id, games]);

  const addPair = () => {
    setPairs([...pairs, { id: Date.now() + Math.random(), a: {text: '', image: ''}, b: {text: '', image: ''} }]);
  };

  const updatePair = (index, field, value) => {
    const updated = [...pairs];
    const [side, key] = field.split('.');
    updated[index][side][key] = value;
    setPairs(updated);
  };

  const handleEmojiClick = (emojiData) => {
    const { index, side } = activePicker;
    const currentText = pairs[index][side].text;
    updatePair(index, `${side}.text`, currentText + emojiData.emoji);
    setActivePicker(null);
  };

  const handleImageUpload = (index, side, file) => {
    if (!file) return;
    compressImage(file, (base64) => {
      updatePair(index, `${side}.image`, base64);
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

    const validPairs = pairs.filter(p => (p.a.text.trim() || p.a.image) && (p.b.text.trim() || p.b.image));
    if (validPairs.length < 2) {
      setFormError("Você precisa preencher pelo menos 2 pares válidos.");
      return;
    }
    
    const gameData = {
      id: id ? id : Date.now().toString(),
      type: 'memory',
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

  const RenderSide = ({ side, p, index }) => (
    <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '8px', padding: '8px', display: 'flex', flexDirection: 'column', gap: '8px', flexGrow: 1 }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexDirection: isMobile ? 'column' : 'row' }}>
            <div style={{ position: 'relative', flexGrow: 1 }}>
                <input 
                    type="text" 
                    placeholder="Texto..." 
                    value={p[side].text} 
                    onChange={(e) => updatePair(index, `${side}.text`, e.target.value)}
                    style={{ border: 'none', background: 'transparent', padding: '8px', paddingRight: '35px' }}
                />
                <button 
                    onClick={() => setActivePicker({ index, side })}
                    style={{ position: 'absolute', right: '5px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', cursor: 'pointer', opacity: 0.7, color: 'var(--success)' }}
                >
                    <Smile size={18} />
                </button>
            </div>
            <label style={{ cursor: 'pointer', padding: '8px', width: isMobile ? '100%' : 'auto', justifyContent: 'center', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', display: 'flex', alignItems: 'center' }}>
                <ImageIcon size={16} />
                <input type="file" accept="image/*" onChange={(e) => handleImageUpload(index, side, e.target.files[0])} style={{ display: 'none' }} />
            </label>
        </div>
        {p[side].image && (
            <div style={{ position: 'relative', width: 'fit-content' }}>
                <img src={p[side].image} alt="Preview" style={{ maxHeight: '60px', borderRadius: '4px', border: '1px solid var(--glass-border)' }} />
                <button 
                    onClick={() => updatePair(index, `${side}.image`, '')}
                    style={{ position: 'absolute', top: '-6px', right: '-6px', background: 'var(--danger)', color: 'white', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                >
                    <XCircle size={10} />
                </button>
            </div>
        )}
    </div>
  );

  return (
    <div className="glass-panel" style={{ padding: isMobile ? '1rem' : '3rem', maxWidth: '900px', margin: '0 auto', position: 'relative' }}>
      
      {activePicker && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)' }}>
            <div style={{ position: 'relative' }}>
                <button onClick={() => setActivePicker(null)} style={{ position: 'absolute', top: '-10px', right: '-10px', zIndex: 1001, background: 'var(--danger)', border: 'none', borderRadius: '50%', color: 'white', width: '30px', height: '30px', cursor: 'pointer' }}>X</button>
                <EmojiPicker onEmojiClick={handleEmojiClick} theme="dark" />
            </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'stretch' : 'center', justifyContent: 'space-between', marginBottom: '2rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1.5rem', gap: isMobile ? '1rem' : '0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
           <HelpCircle size={32} color="var(--success)" />
           <h2 style={{ margin: 0, fontSize: isMobile ? '1.4rem' : '2rem' }}>{id ? 'Editar Jogo' : 'Criar Jogo da Memória'}</h2>
        </div>
        <div style={{ display: 'flex', gap: '12px', flexDirection: isMobile ? 'column' : 'row' }}>
            <button className="glow-btn secondary" onClick={() => navigate('/')} style={{ padding: '12px 24px', width: isMobile ? '100%' : 'auto' }}>
                <XCircle size={20} />
                Cancelar
            </button>
            <button className="glow-btn" onClick={saveGame} style={{ padding: '12px 24px', width: isMobile ? '100%' : 'auto', background: 'linear-gradient(135deg, var(--success), #059669)', border: 'none' }}>
                <Save size={20} />
                {id ? 'Salvar Edições' : 'Salvar Jogo'}
            </button>
        </div>
      </div>
      
      <div style={{ marginBottom: '3rem', background: 'rgba(0,0,0,0.15)', padding: isMobile ? '16px' : '24px', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
        <label style={{ display: 'block', marginBottom: '12px', color: 'var(--text-main)', fontSize: '1.1rem', fontWeight: 600 }}>
          Título do Jogo:
        </label>
        <input 
          type="text" 
          placeholder="ex. Tradução: Animais" 
          value={title} 
          onChange={(e) => {
             setTitle(e.target.value);
             setTitleError(false);
             setFormError('');
          }} 
          className={titleError ? 'error' : ''}
        />
        {titleError && <span className="error-text">O título é obrigatório.</span>}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '3rem' }}>
        {pairs.map((p, index) => (
          <div key={p.id} style={{ 
            display: 'flex', gap: '1rem', alignItems: 'flex-start', flexDirection: isMobile ? 'column' : 'row',
            background: 'rgba(15, 23, 42, 0.4)', padding: isMobile ? '1rem' : '1.5rem', borderRadius: '12px', 
            border: '1px solid var(--glass-border)', position: 'relative'
          }}>
            <div style={{ background: 'var(--success)', color: 'white', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', fontSize: '0.9rem', flexShrink: 0, marginTop: '8px' }}>
               {index + 1}
            </div>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'stretch', flexGrow: 1, flexDirection: isMobile ? 'column' : 'row' }}>
              <RenderSide side="a" p={p} index={index} />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>+</div>
              <RenderSide side="b" p={p} index={index} />
            </div>
            {pairs.length > 1 && (
              <button onClick={() => removePair(p.id)} style={{ background: 'transparent', color: 'var(--danger)', padding: '8px' }}>
                <Trash2 size={20} />
              </button>
            )}
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <button className="glow-btn secondary" onClick={addPair} style={{ borderColor: 'var(--success)', color: 'var(--success)', width: isMobile ? '100%' : 'auto' }}>
          <Plus size={24} /> Novo Par
        </button>
      </div>
    </div>
  );
}
