import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNoteStore } from '../stores/noteStore';
import { linkService, NoteGraphNode, NoteGraphEdge } from '../services/linkService';

interface NoteGraphProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectNote: (noteId: string) => void;
}

export default function NoteGraph({ isOpen, onClose, onSelectNote }: NoteGraphProps) {
  const { t } = useTranslation();
  const { notes } = useNoteStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [graphData, setGraphData] = useState<{ nodes: NoteGraphNode[]; edges: NoteGraphEdge[] }>({ nodes: [], edges: [] });
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // 节点位置状态
  const [nodePositions, setNodePositions] = useState<Map<string, { x: number; y: number }>>(new Map());

  useEffect(() => {
    if (isOpen) {
      const data = linkService.buildGraphData(notes);
      setGraphData(data);
      
      // 初始化节点位置（圆形布局）
      const positions = new Map<string, { x: number; y: number }>();
      const centerX = 400;
      const centerY = 300;
      const radius = Math.min(200, data.nodes.length * 30);
      
      data.nodes.forEach((node, index) => {
        const angle = (index / data.nodes.length) * 2 * Math.PI;
        positions.set(node.id, {
          x: centerX + radius * Math.cos(angle),
          y: centerY + radius * Math.sin(angle),
        });
      });
      
      setNodePositions(positions);
    }
  }, [isOpen, notes]);

  // 绘制图谱
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !isOpen) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 绘制边
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1;
    graphData.edges.forEach(edge => {
      const sourcePos = nodePositions.get(edge.source);
      const targetPos = nodePositions.get(edge.target);
      if (sourcePos && targetPos) {
        ctx.beginPath();
        ctx.moveTo(
          (sourcePos.x + offset.x) * scale,
          (sourcePos.y + offset.y) * scale
        );
        ctx.lineTo(
          (targetPos.x + offset.x) * scale,
          (targetPos.y + offset.y) * scale
        );
        ctx.stroke();
      }
    });

    // 绘制节点
    graphData.nodes.forEach(node => {
      const pos = nodePositions.get(node.id);
      if (!pos) return;

      const x = (pos.x + offset.x) * scale;
      const y = (pos.y + offset.y) * scale;
      const radius = node.isPinned ? 25 : 20;

      // 节点圆形
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, 2 * Math.PI);
      
      // 根据状态设置颜色
      if (node.id === selectedNode) {
        ctx.fillStyle = '#ec5b13';
        ctx.strokeStyle = '#c2410c';
        ctx.lineWidth = 3;
      } else if (node.id === hoveredNode) {
        ctx.fillStyle = '#fed7aa';
        ctx.strokeStyle = '#ec5b13';
        ctx.lineWidth = 2;
      } else {
        ctx.fillStyle = node.color ? getColorHex(node.color) : '#e2e8f0';
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 1;
      }
      
      ctx.fill();
      ctx.stroke();

      // 收藏标记
      if (node.isFavorite) {
        ctx.beginPath();
        ctx.arc(x + radius * 0.7, y - radius * 0.7, 6, 0, 2 * Math.PI);
        ctx.fillStyle = '#fbbf24';
        ctx.fill();
      }

      // 节点标题
      ctx.fillStyle = node.id === selectedNode ? '#ffffff' : '#1e293b';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // 截断标题
      let title = node.title;
      if (title.length > 8) {
        title = title.substring(0, 8) + '...';
      }
      ctx.fillText(title, x, y + radius + 15);
    });
  }, [graphData, nodePositions, hoveredNode, selectedNode, scale, offset, isOpen]);

  const getColorHex = (colorName: string): string => {
    const colorMap: Record<string, string> = {
      red: '#fca5a5',
      orange: '#fdba74',
      yellow: '#fde047',
      green: '#86efac',
      blue: '#93c5fd',
      purple: '#d8b4fe',
      pink: '#f9a8d4',
    };
    return colorMap[colorName] || '#e2e8f0';
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left) / scale - offset.x;
    const mouseY = (e.clientY - rect.top) / scale - offset.y;

    if (isDragging) {
      setOffset({
        x: offset.x + (e.clientX - dragStart.x) / scale,
        y: offset.y + (e.clientY - dragStart.y) / scale,
      });
      setDragStart({ x: e.clientX, y: e.clientY });
      return;
    }

    // 检查悬停的节点
    let found = false;
    graphData.nodes.forEach(node => {
      const pos = nodePositions.get(node.id);
      if (pos) {
        const dx = mouseX - pos.x;
        const dy = mouseY - pos.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < 25) {
          setHoveredNode(node.id);
          found = true;
        }
      }
    });
    
    if (!found) {
      setHoveredNode(null);
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleClick = (_e: React.MouseEvent<HTMLCanvasElement>) => {
    if (hoveredNode) {
      setSelectedNode(hoveredNode);
      onSelectNote(hoveredNode);
    }
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const newScale = Math.max(0.5, Math.min(2, scale - e.deltaY * 0.001));
    setScale(newScale);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-[900px] h-[700px] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* 头部 */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
              <span className="material-symbols-outlined text-purple-500">hub</span>
            </div>
            <div>
              <h2 className="text-lg font-bold">{t('graph.title')}</h2>
              <p className="text-sm text-slate-500">
                {t('graph.noteCount', { count: graphData.nodes.length })}, {t('graph.edgeCount', { count: graphData.edges.length })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setScale(Math.min(2, scale + 0.1))}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              title={t('graph.zoomIn')}
            >
              <span className="material-symbols-outlined">zoom_in</span>
            </button>
            <button
              onClick={() => setScale(Math.max(0.5, scale - 0.1))}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              title={t('graph.zoomOut')}
            >
              <span className="material-symbols-outlined">zoom_out</span>
            </button>
            <button
              onClick={() => { setScale(1); setOffset({ x: 0, y: 0 }); }}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              title={t('graph.resetView')}
            >
              <span className="material-symbols-outlined">center_focus_strong</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        </div>

        {/* 画布 */}
        <div className="flex-1 relative bg-slate-50 dark:bg-slate-800/50">
          <canvas
            ref={canvasRef}
            width={900}
            height={600}
            onMouseMove={handleMouseMove}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onClick={handleClick}
            onWheel={handleWheel}
            className="cursor-move"
            style={{ width: '100%', height: '100%' }}
          />
          
          {/* 图例 */}
          <div className="absolute bottom-4 left-4 bg-white dark:bg-slate-800 rounded-xl p-3 shadow-lg text-xs space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-slate-300"></div>
              <span>{t('graph.normalNote')}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-primary"></div>
              <span>{t('graph.selectedNote')}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-slate-300"></div>
              <span>{t('graph.pinnedNote')}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
              <span>{t('graph.favoriteNote')}</span>
            </div>
          </div>

          {/* 提示 */}
          <div className="absolute bottom-4 right-4 text-xs text-slate-400">
            {t('graph.hint')}
          </div>
        </div>
      </div>
    </div>
  );
}
