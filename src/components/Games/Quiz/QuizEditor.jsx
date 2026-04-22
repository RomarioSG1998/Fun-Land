import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useIsMobile } from '../../../hooks/useIsMobile';
import { useLocalStorage } from '../../../hooks/useLocalStorage';
import { Save, Plus, Trash2, HelpCircle, XCircle, Image as ImageIcon, Smile } from 'lucide-react';
import { compressImage } from '../../../utils/imageUtils';
import EmojiPicker from 'emoji-picker-react';

export default function QuizEditor() {
  const [games, setGames] = useLocalStorage('hub_custom_games', []);
  const navigate = useNavigate();
  const { id } = useParams();
  const isMobile = useIsMobile();
  
  const [title, setTitle] = useState('');
  const [titleError, setTitleError] = useState(false);
  const [formError, setFormError] = useState('');
  const [questions, setQuestions] = useState([{ id: Date.now(), q: '', qImage: '', options: [{text: '', image: ''}, {text: '', image: ''}, {text: '', image: ''}, {text: '', image: ''}], correct: 0 }]);
  
  // Emoji Picker State
  const [activePicker, setActivePicker] = useState(null); // { qIndex, optIndex }

  // Load existing game if we are editing
  useEffect(() => {
    if (id) {
      const existing = games.find(g => g.id === id);
      if (existing && existing.type === 'quiz') {
        setTitle(existing.title);
        setQuestions(existing.data.questions.map(q => ({
          ...q,
          id: q.id || Date.now() + Math.random(),
          qImage: q.qImage || '',
          options: q.options.map(opt => typeof opt === 'string' ? { text: opt, image: '' } : opt)
        })));
      }
    }
  }, [id, games]);

  const addQuestion = () => {
    setQuestions([...questions, { 
      id: Date.now() + Math.random(), 
      q: '', 
      qImage: '', 
      options: [{text: '', image: ''}, {text: '', image: ''}, {text: '', image: ''}, {text: '', image: ''}], 
      correct: 0 
    }]);
  };

  const removeQuestion = (qId) => {
    if(questions.length === 1) return; 
    setQuestions(questions.filter(q => q.id !== qId));
  };

  const updateQuestion = (index, field, value) => {
    const updated = [...questions];
    updated[index][field] = value;
    setQuestions(updated);
  };

  const updateOption = (qIndex, optIndex, field, value) => {
    const updated = [...questions];
    updated[qIndex].options[optIndex][field] = value;
    setQuestions(updated);
  };

  const handleEmojiClick = (emojiData) => {
    const { qIndex, optIndex } = activePicker;
    if (optIndex === null) {
      const currentText = questions[qIndex].q;
      updateQuestion(qIndex, 'q', currentText + emojiData.emoji);
    } else {
      const currentText = questions[qIndex].options[optIndex].text;
      updateOption(qIndex, optIndex, 'text', currentText + emojiData.emoji);
    }
    setActivePicker(null);
  };

  const handleImageUpload = (qIndex, optIndex, file) => {
    if (!file) return;
    compressImage(file, (base64) => {
      if (optIndex === null) {
        updateQuestion(qIndex, 'qImage', base64);
      } else {
        updateOption(qIndex, optIndex, 'image', base64);
      }
    });
  };

  const saveGame = () => {
    setTitleError(false);
    setFormError('');
    
    if (!title.trim()) {
      setTitleError(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const questionContents = questions.map(q => (q.q.trim() + q.qImage).toLowerCase()).filter(txt => txt.length > 0);
    if (questionContents.length < questions.length) {
      setFormError("Por favor, preencha o texto ou imagem de todas as perguntas.");
      return;
    }

    const gameData = {
      id: id ? id : Date.now().toString(),
      type: 'quiz',
      title,
      data: { questions }
    };
    
    if (id) {
      setGames(games.map(g => g.id === id ? gameData : g));
    } else {
      setGames([...games, gameData]);
    }
    
    navigate('/');
  };

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
           <HelpCircle size={32} color="var(--primary)" />
           <h2 style={{ margin: 0, fontSize: isMobile ? '1.4rem' : '2rem' }}>{id ? 'Editar Quiz' : 'Criar Novo Quiz'}</h2>
        </div>
        <div style={{ display: 'flex', gap: '12px', flexDirection: isMobile ? 'column' : 'row' }}>
          <button className="glow-btn secondary" onClick={() => navigate('/')} style={{ padding: '12px 24px', width: isMobile ? '100%' : 'auto' }}>
            <XCircle size={20} />
            Cancelar
          </button>
          <button className="glow-btn" onClick={saveGame} style={{ padding: '12px 24px', width: isMobile ? '100%' : 'auto' }}>
            <Save size={20} />
            {id ? 'Salvar Edições' : 'Salvar Jogo'}
          </button>
        </div>
      </div>
      
      <div style={{ marginBottom: '3rem', background: 'rgba(0,0,0,0.15)', padding: isMobile ? '16px' : '24px', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
        <label style={{ display: 'block', marginBottom: '12px', color: 'var(--text-main)', fontSize: '1.1rem', fontWeight: 600 }}>
          Qual o Título do Quiz?
        </label>
        <input 
          type="text" 
          placeholder="ex. Curiosidades de História..." 
          value={title} 
          onChange={(e) => {
             setTitle(e.target.value);
             setTitleError(false);
             setFormError('');
          }} 
          className={titleError ? 'error' : ''}
          style={{ fontSize: '1.2rem', padding: '16px' }}
        />
        {titleError && <span className="error-text">O título é obrigatório antes de salvar.</span>}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem', marginBottom: '3rem' }}>
        {questions.map((q, qIndex) => (
          <div key={q.id} style={{ 
            background: 'rgba(15, 23, 42, 0.4)', padding: isMobile ? '1rem' : '2rem', borderRadius: '12px', 
            border: '1px solid var(--glass-border)', position: 'relative',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', marginBottom: '1.5rem', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? '10px' : '0' }}>
               <h4 style={{ margin: 0, color: 'var(--primary)', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ background: 'var(--primary)', color: 'white', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', fontSize: '0.9rem' }}>
                     {qIndex + 1}
                  </div>
                  Pergunta
               </h4>
               {questions.length > 1 && (
                  <button 
                    onClick={() => removeQuestion(q.id)}
                    style={{ background: 'transparent', color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem' }}
                  >
                    <Trash2 size={18} /> Mover para lixeira
                  </button>
               )}
            </div>

            <div style={{ display: 'flex', gap: '16px', marginBottom: '1.5rem', alignItems: 'flex-start', flexDirection: isMobile ? 'column' : 'row' }}>
              <div style={{ flexGrow: 1 }}>
                <div style={{ position: 'relative' }}>
                  <input 
                    type="text" 
                    placeholder="Digite sua pergunta..." 
                    value={q.q} 
                    onChange={(e) => {
                       updateQuestion(qIndex, 'q', e.target.value);
                       setFormError('');
                    }}
                    style={{ paddingRight: '45px' }}
                  />
                  <button 
                    onClick={() => setActivePicker({ qIndex, optIndex: null })}
                    style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', cursor: 'pointer', opacity: 0.7, color: 'var(--primary)' }}
                  >
                    <Smile size={24} />
                  </button>
                </div>
              </div>
              
              <label className="glow-btn secondary" style={{ padding: '10px', height: '48px', width: isMobile ? '100%' : '48px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ImageIcon size={20} />
                <input type="file" accept="image/*" onChange={(e) => handleImageUpload(qIndex, null, e.target.files[0])} style={{ display: 'none' }} />
              </label>
            </div>

            {q.qImage && (
              <div style={{ position: 'relative', width: 'fit-content', marginBottom: '1.5rem' }}>
                <img src={q.qImage} alt="Preview" style={{ maxWidth: '200px', borderRadius: '8px', border: '1px solid var(--glass-border)' }} />
                <button 
                  onClick={() => updateQuestion(qIndex, 'qImage', '')}
                  style={{ position: 'absolute', top: '-8px', right: '-8px', background: 'var(--danger)', color: 'white', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                >
                  <XCircle size={14} />
                </button>
              </div>
            )}
            
            <label style={{ display: 'block', marginBottom: '12px', color: 'var(--text-muted)', fontSize: '0.95rem' }}>
               Alternativas (Adicione Emojis ou Imagens):
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '1.5rem' }}>
              {q.options.map((opt, optIndex) => (
                <div key={optIndex} style={{ 
                    display: 'flex', flexDirection: 'column',
                    background: q.correct === optIndex ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                    border: q.correct === optIndex ? '1px solid var(--primary)' : '1px solid var(--glass-border)',
                    borderRadius: '8px', padding: '12px'
                 }}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ 
                      padding: '8px', display: 'flex', alignItems: 'center', 
                      background: q.correct === optIndex ? 'var(--primary)' : 'rgba(0,0,0,0.3)',
                      cursor: 'pointer', borderRadius: '8px'
                    }} onClick={() => updateQuestion(qIndex, 'correct', optIndex)}>
                      <input 
                        type="radio" 
                        name={`correct-${q.id}`} 
                        checked={q.correct === optIndex}
                        onChange={() => {}}
                        style={{ width: '16px', height: '16px', cursor: 'pointer', margin: 0 }}
                      />
                    </div>
                    <div style={{ position: 'relative', flexGrow: 1 }}>
                      <input 
                        type="text" 
                        placeholder={`Opção ${String.fromCharCode(65 + optIndex)}`} 
                        value={opt.text} 
                        onChange={(e) => updateOption(qIndex, optIndex, 'text', e.target.value)}
                        style={{ border: 'none', background: 'rgba(0,0,0,0.2)', padding: '8px', paddingRight: '35px' }}
                      />
                      <button 
                        onClick={() => setActivePicker({ qIndex, optIndex })}
                        style={{ position: 'absolute', right: '5px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', cursor: 'pointer', opacity: 0.7, color: 'var(--primary)' }}
                      >
                        <Smile size={18} />
                      </button>
                    </div>
                  </div>
                  
                  {opt.image && (
                    <div style={{ position: 'relative', width: 'fit-content', marginTop: '8px' }}>
                      <img src={opt.image} alt="Opt Preview" style={{ maxHeight: '80px', borderRadius: '4px' }} />
                      <button 
                        onClick={() => updateOption(qIndex, optIndex, 'image', '')}
                        style={{ position: 'absolute', top: '-6px', right: '-6px', background: 'var(--danger)', color: 'white', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px' }}
                      >
                        <XCircle size={10} />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <button className="glow-btn secondary" onClick={addQuestion} style={{ fontSize: '1.1rem', padding: '16px 32px', width: isMobile ? '100%' : 'auto' }}>
          <Plus size={24} /> 
          Nova Pergunta
        </button>
      </div>
    </div>
  );
}
