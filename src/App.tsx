import React, { useState, useEffect } from 'react';
import { DndContext, useDraggable, useDroppable, DragEndEvent, TouchSensor, MouseSensor, useSensor, useSensors } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Circle, Square, Triangle, Star, Trophy } from 'lucide-react';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'motion/react';

type ColorType = 'red' | 'blue' | 'green' | 'yellow';
type ShapeType = 'circle' | 'square' | 'triangle' | 'star';

interface GameObject {
  id: string;
  color: ColorType;
  shape: ShapeType;
  isSorted: boolean;
}

const COLORS: Record<ColorType, { name: string; hex: string; bgClass: string; textClass: string; borderClass: string; icon: string }> = {
  red: { name: 'MÀU ĐỎ', hex: '#FF6B6B', bgClass: 'bg-[#FF6B6B]/5', textClass: 'text-[#FF6B6B]', borderClass: 'border-[#FF6B6B]', icon: '🍎' },
  blue: { name: 'MÀU XANH', hex: '#4D96FF', bgClass: 'bg-[#4D96FF]/5', textClass: 'text-[#4D96FF]', borderClass: 'border-[#4D96FF]', icon: '🐳' },
  green: { name: 'MÀU XANH LÁ', hex: '#6BCB77', bgClass: 'bg-[#6BCB77]/5', textClass: 'text-[#6BCB77]', borderClass: 'border-[#6BCB77]', icon: '🐸' },
  yellow: { name: 'MÀU VÀNG', hex: '#FFD93D', bgClass: 'bg-[#FFD93D]/5', textClass: 'text-[#FFD93D]', borderClass: 'border-[#FFD93D]', icon: '☀️' },
};

const SHAPES: ShapeType[] = ['circle', 'square', 'triangle', 'star'];

const generateItems = (count: number): GameObject[] => {
  const items: GameObject[] = [];
  const colorKeys = Object.keys(COLORS) as ColorType[];
  
  for (let i = 0; i < count; i++) {
    const randomColor = colorKeys[Math.floor(Math.random() * colorKeys.length)];
    const randomShape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
    items.push({
      id: `item-${i}-${Date.now()}`,
      color: randomColor,
      shape: randomShape,
      isSorted: false,
    });
  }
  return items;
};

const DraggableShape = ({ item }: { item: GameObject }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: item.id,
    data: { color: item.color },
  });

  const style = transform ? {
    transform: CSS.Translate.toString(transform),
  } : undefined;

  const Icon = item.shape === 'circle' ? Circle :
               item.shape === 'square' ? Square :
               item.shape === 'triangle' ? Triangle : Star;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`relative flex items-center justify-center cursor-grab active:cursor-grabbing touch-none transition-transform ${isDragging ? 'z-50 scale-110 opacity-80' : 'z-10 hover:scale-110'}`}
    >
      <Icon 
        size={80} 
        color={COLORS[item.color].hex} 
        fill={COLORS[item.color].hex}
        className="drop-shadow-[0_4px_6px_rgba(0,0,0,0.1)]"
      />
    </div>
  );
};

const DropZone = ({ color, children }: { color: ColorType, children: React.ReactNode }) => {
  const { isOver, setNodeRef } = useDroppable({
    id: `zone-${color}`,
    data: { acceptsColor: color },
  });

  const colorConfig = COLORS[color];

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col items-center justify-end pb-5 rounded-[30px] border-[6px] border-dashed transition-all duration-300 min-h-[200px] md:min-h-[240px] relative
        ${isOver ? `scale-105 shadow-xl border-solid` : `shadow-sm`}
        ${colorConfig.borderClass}
        ${colorConfig.bgClass}
      `}
    >
      <div className={`absolute -top-5 bg-white px-5 py-1.5 rounded-[20px] shadow-[0_4px_10px_rgba(0,0,0,0.1)] font-extrabold border-2 ${colorConfig.borderClass} ${colorConfig.textClass}`}>
        {colorConfig.name}
      </div>
      <div className="text-6xl md:text-[80px] mb-2 opacity-50 select-none">{colorConfig.icon}</div>
      <div className="absolute inset-0 pt-10 pb-5 px-4 flex flex-wrap gap-2 justify-center items-center content-start overflow-y-auto">
        {children}
      </div>
    </div>
  );
};

export default function App() {
  const [items, setItems] = useState<GameObject[]>([]);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    setItems(generateItems(8));
  }, []);

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.data.current?.color === over.data.current?.acceptsColor) {
      setItems((prev) => 
        prev.map((item) => 
          item.id === active.id ? { ...item, isSorted: true } : item
        )
      );
      
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.8 },
        colors: [COLORS[active.data.current.color as ColorType].hex]
      });
    }
  };

  const handleReset = () => {
    setItems(generateItems(8));
  };

  const isGameComplete = items.length > 0 && items.every(item => item.isSorted);

  useEffect(() => {
    if (isGameComplete) {
      const duration = 3 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

      const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

      const interval: any = setInterval(function() {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
      }, 250);
    }
  }, [isGameComplete]);

  if (!isClient) return null;

  const unsortedItems = items.filter(item => !item.isSorted);
  const sortedCount = items.filter(i => i.isSorted).length;
  const progressPercent = items.length > 0 ? (sortedCount / items.length) * 100 : 0;

  return (
    <div className="min-h-screen bg-[#FFF9E6] font-sans text-[#2D3436] overflow-hidden flex flex-col select-none">
      <header className="h-[80px] md:h-[100px] bg-white shadow-[0_4px_0_rgba(0,0,0,0.05)] flex justify-between items-center px-4 md:px-10 shrink-0 z-10">
        <div className="text-[20px] md:text-[32px] font-extrabold text-[#FF6B6B] uppercase tracking-[1px]">
          KIDDO LEARN
        </div>
        <div className="flex items-center gap-2 md:gap-[15px]">
          <span className="font-bold text-[#777] hidden md:inline">Tiến trình: {sortedCount}/{items.length}</span>
          <div className="w-[120px] md:w-[300px] h-[20px] md:h-[24px] bg-[#EEE] rounded-[12px] relative overflow-hidden border-[3px] border-[#DDD]">
            <div 
              className="h-full bg-[#6BCB77] rounded-[8px] transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col p-4 md:p-10 max-w-7xl mx-auto w-full gap-8 md:gap-10 overflow-y-auto">
        <div className="text-[20px] md:text-[24px] font-semibold text-center text-[#555]">
          {isGameComplete ? 'Tuyệt vời! Bé giỏi quá! 🎉' : 'Hãy kéo các hình vào đúng ô màu sắc nhé! 🎨'}
        </div>
        
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          {/* Drop Zones */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-[30px]">
            {(Object.keys(COLORS) as ColorType[]).map((color) => (
              <DropZone key={color} color={color}>
                <AnimatePresence>
                  {items.filter(item => item.isSorted && item.color === color).map(item => {
                    const Icon = item.shape === 'circle' ? Circle :
                                 item.shape === 'square' ? Square :
                                 item.shape === 'triangle' ? Triangle : Star;
                    return (
                      <motion.div
                        key={item.id}
                        initial={{ scale: 0, opacity: 0, rotate: -45 }}
                        animate={{ scale: 1, opacity: 1, rotate: 0 }}
                        transition={{ type: "spring", stiffness: 260, damping: 20 }}
                        className="m-1"
                      >
                        <Icon size={48} color={COLORS[item.color].hex} fill={COLORS[item.color].hex} className="drop-shadow-sm" />
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </DropZone>
            ))}
          </div>

          {/* Draggable Items Area */}
          <div className="bg-white min-h-[180px] rounded-[30px] shadow-[0_10px_30px_rgba(0,0,0,0.05)] border-[4px] border-[#F0F0F0] p-6 md:px-10 flex flex-wrap items-center justify-center gap-6 md:gap-10 relative">
            <AnimatePresence>
              {isGameComplete && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute inset-0 flex flex-col items-center justify-center bg-white/90 backdrop-blur-sm z-20 rounded-[26px]"
                >
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring" }}
                    className="flex flex-col items-center"
                  >
                    <Trophy size={80} className="text-[#FFD93D] mb-4 drop-shadow-lg" />
                    <h2 className="text-3xl md:text-4xl font-black text-[#6BCB77] mb-2 text-center">Hoàn Thành!</h2>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {unsortedItems.map(item => (
              <DraggableShape key={item.id} item={item} />
            ))}
          </div>
        </DndContext>

        <div className="flex items-center justify-center gap-5 pb-5 shrink-0 mt-auto">
          <button 
            onClick={handleReset}
            className="px-8 md:px-10 py-[12px] md:py-[15px] rounded-[50px] text-[18px] md:text-[20px] font-bold border-none shadow-[0_6px_0_rgba(0,0,0,0.1)] transition-transform active:translate-y-1 active:shadow-none bg-[#DDD] text-[#666]"
          >
            LÀM LẠI
          </button>
          {isGameComplete && (
            <button 
              onClick={handleReset}
              className="px-8 md:px-10 py-[12px] md:py-[15px] rounded-[50px] text-[18px] md:text-[20px] font-bold border-none shadow-[0_6px_0_rgba(0,0,0,0.1)] transition-transform active:translate-y-1 active:shadow-none bg-[#6BCB77] text-white"
            >
              CHƠI TIẾP ✅
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
