import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Sparkles, X } from 'lucide-react';
import { spring } from './ui';

interface Props {
  stepId: string;
  messages: Record<string, string[]>;
  open: boolean;
  onToggle: () => void;
}

const idleMessages = [
  '💡 Не переживай. Даже если нет опыта работы — учебные проекты тоже являются опытом.',
  '🔥 Ты уже прошёл дальше, чем большинство пользователей.',
  '👏 Осталось всего три небольших шага.',
  '✨ Каждый шаг приближает тебя к первой стажировке.',
];

export function AIAssistant({ stepId, messages, open, onToggle }: Props) {
  const [currentMsg, setCurrentMsg] = useState('');
  const [idleIdx, setIdleIdx] = useState(0);
  const [typed, setTyped] = useState(false);
  const onDoneRef = useRef<() => void>(() => setTyped(true));

  useEffect(() => {
    const stepMsgs = messages[stepId] || [];
    const msg = stepMsgs.length > 0 ? stepMsgs[0] : idleMessages[idleIdx % idleMessages.length];
    setCurrentMsg(msg);
    setTyped(false);
  }, [stepId, idleIdx, messages]);

  useEffect(() => {
    if (typed) return;
    const interval = setInterval(() => setIdleIdx((i) => i + 1), 12000);
    return () => clearInterval(interval);
  }, [typed]);

  return (
    <>
      <motion.div className="ai-bubble" initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.5, ...spring }} onClick={onToggle} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
        <span className="ai-bubble-icon"><Bot size={22} /></span>
      </motion.div>

      <AnimatePresence>
        {open && (
          <motion.div className="ai-panel" initial={{ opacity: 0, y: 30, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 30, scale: 0.9 }} transition={spring}>
            <div className="ai-panel-head">
              <div className="ai-panel-title"><span className="ai-avatar"><Sparkles size={16} /></span><div><strong>Цифровой наставник</strong><span><i className="online-dot" />Онлайн</span></div></div>
              <button className="ai-close" onClick={onToggle}><X size={16} /></button>
            </div>
            <div className="ai-panel-body">
              <div className="ai-msg-bubble">
                <Typewriter text={currentMsg} onDone={onDoneRef.current} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function Typewriter({ text, onDone }: { text: string; onDone: () => void }) {
  const [displayed, setDisplayed] = useState('');
  useEffect(() => {
    setDisplayed('');
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) { clearInterval(interval); onDone(); }
    }, 28);
    return () => clearInterval(interval);
  }, [text, onDone]);
  return <span>{displayed}<motion.span className="cursor-blink" animate={{ opacity: [1, 0, 1] }} transition={{ duration: 0.8, repeat: Infinity }}>|</motion.span></span>;
}
