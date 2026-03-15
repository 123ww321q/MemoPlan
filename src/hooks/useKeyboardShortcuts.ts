import { useEffect } from 'react';
import { useLayoutStore, PanelKey } from '../stores/layoutStore';

export const useKeyboardShortcuts = () => {
  const { toggleCollapse } = useLayoutStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 检查是否在输入框中（避免干扰用户输入）
      if (e.target instanceof HTMLElement && 
          (e.target.tagName === 'INPUT' || 
           e.target.tagName === 'TEXTAREA' || 
           e.target.contentEditable === 'true')) {
        return;
      }

      // Ctrl+数字键切换面板折叠
      if (e.ctrlKey && e.key >= '1' && e.key <= '5') {
        e.preventDefault();
        const panelKeys: PanelKey[] = ['navigation', 'noteList', 'editor', 'preview', 'taskPanel'];
        toggleCollapse(panelKeys[parseInt(e.key) - 1]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleCollapse]);
};