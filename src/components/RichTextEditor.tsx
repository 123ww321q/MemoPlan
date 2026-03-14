import { useState, useRef, useCallback } from 'react';
import { useSettingsStore } from '../stores/settingsStore';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
}

// 文本样式类型
type TextStyle = {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  color?: string;
  backgroundColor?: string;
  fontSize?: string;
  fontFamily?: string;
  heading?: 'h1' | 'h2' | 'h3' | 'p';
  align?: 'left' | 'center' | 'right' | 'justify';
  list?: 'ul' | 'ol' | 'task';
};

// 颜色选项
const colorOptions = [
  { name: '黑色', value: '#000000' },
  { name: '深灰', value: '#374151' },
  { name: '红色', value: '#dc2626' },
  { name: '橙色', value: '#ea580c' },
  { name: '黄色', value: '#ca8a04' },
  { name: '绿色', value: '#16a34a' },
  { name: '蓝色', value: '#2563eb' },
  { name: '紫色', value: '#9333ea' },
  { name: '粉色', value: '#db2777' },
];

const bgColorOptions = [
  { name: '无', value: 'transparent' },
  { name: '浅黄', value: '#fef3c7' },
  { name: '浅绿', value: '#d1fae5' },
  { name: '浅蓝', value: '#dbeafe' },
  { name: '浅紫', value: '#f3e8ff' },
  { name: '浅粉', value: '#fce7f3' },
  { name: '浅灰', value: '#f3f4f6' },
];

const fontSizeOptions = [
  { name: '小', value: '12px' },
  { name: '正常', value: '14px' },
  { name: '中', value: '16px' },
  { name: '大', value: '18px' },
  { name: '特大', value: '20px' },
  { name: '标题', value: '24px' },
];

const fontFamilyOptions = [
  { name: '默认', value: 'inherit' },
  { name: '宋体', value: 'SimSun, serif' },
  { name: '黑体', value: 'SimHei, sans-serif' },
  { name: '微软雅黑', value: 'Microsoft YaHei, sans-serif' },
  { name: '楷体', value: 'KaiTi, serif' },
  { name: '等宽', value: 'monospace' },
];

export default function RichTextEditor({ content, onChange, placeholder }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const { settings } = useSettingsStore();
  const [activeStyles, setActiveStyles] = useState<TextStyle>({});
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showBgColorPicker, setShowBgColorPicker] = useState(false);
  const [showFontSizePicker, setShowFontSizePicker] = useState(false);
  const [showFontFamilyPicker, setShowFontFamilyPicker] = useState(false);

  // 执行编辑命令
  const execCommand = useCallback((command: string, value: string | undefined = undefined) => {
    document.execCommand(command, false, value);
    updateActiveStyles();
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  // 更新当前激活的样式
  const updateActiveStyles = useCallback(() => {
    const styles: TextStyle = {};
    styles.bold = document.queryCommandState('bold');
    styles.italic = document.queryCommandState('italic');
    styles.underline = document.queryCommandState('underline');
    styles.strikethrough = document.queryCommandState('strikeThrough');
    setActiveStyles(styles);
  }, []);

  // 处理内容变化
  const handleInput = useCallback(() => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  // 处理图片上传
  const handleImageUpload = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const img = document.createElement('img');
          img.src = event.target?.result as string;
          img.style.maxWidth = '100%';
          img.style.borderRadius = '8px';
          img.style.margin = '8px 0';
          
          const selection = window.getSelection();
          if (selection && selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            range.deleteContents();
            range.insertNode(img);
            range.collapse(false);
          } else if (editorRef.current) {
            editorRef.current.appendChild(img);
          }
          
          handleInput();
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  }, [handleInput]);

  // 工具栏按钮组件
  const ToolbarButton = ({ 
    icon, 
    active, 
    onClick, 
    title 
  }: { 
    icon: string; 
    active?: boolean; 
    onClick: () => void; 
    title: string;
  }) => (
    <button
      onClick={onClick}
      title={title}
      className={`p-1.5 rounded transition-colors ${
        active 
          ? 'bg-primary/20 text-primary' 
          : 'hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400'
      }`}
    >
      <span className="material-symbols-outlined text-lg">{icon}</span>
    </button>
  );

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900">
      {/* 工具栏 */}
      <div className="flex flex-wrap items-center gap-1 p-2 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
        {/* 历史记录 */}
        <div className="flex items-center gap-0.5">
          <ToolbarButton icon="undo" onClick={() => execCommand('undo')} title="撤销" />
          <ToolbarButton icon="redo" onClick={() => execCommand('redo')} title="重做" />
        </div>

        <div className="w-px h-5 bg-slate-300 dark:bg-slate-600 mx-1" />

        {/* 文本样式 */}
        <div className="flex items-center gap-0.5">
          <ToolbarButton 
            icon="format_bold" 
            active={activeStyles.bold} 
            onClick={() => execCommand('bold')} 
            title="加粗" 
          />
          <ToolbarButton 
            icon="format_italic" 
            active={activeStyles.italic} 
            onClick={() => execCommand('italic')} 
            title="斜体" 
          />
          <ToolbarButton 
            icon="format_underlined" 
            active={activeStyles.underline} 
            onClick={() => execCommand('underline')} 
            title="下划线" 
          />
          <ToolbarButton 
            icon="strikethrough_s" 
            active={activeStyles.strikethrough} 
            onClick={() => execCommand('strikeThrough')} 
            title="删除线" 
          />
        </div>

        <div className="w-px h-5 bg-slate-300 dark:bg-slate-600 mx-1" />

        {/* 字体 */}
        <div className="relative">
          <ToolbarButton 
            icon="font_download" 
            onClick={() => setShowFontFamilyPicker(!showFontFamilyPicker)} 
            title="字体" 
          />
          {showFontFamilyPicker && (
            <div className="absolute top-full left-0 mt-1 p-1 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 z-50 min-w-[120px]">
              {fontFamilyOptions.map((font) => (
                <button
                  key={font.value}
                  onClick={() => {
                    execCommand('fontName', font.value);
                    setShowFontFamilyPicker(false);
                  }}
                  className="w-full px-3 py-1.5 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
                  style={{ fontFamily: font.value }}
                >
                  {font.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 字号 */}
        <div className="relative">
          <ToolbarButton 
            icon="format_size" 
            onClick={() => setShowFontSizePicker(!showFontSizePicker)} 
            title="字号" 
          />
          {showFontSizePicker && (
            <div className="absolute top-full left-0 mt-1 p-1 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 z-50 min-w-[80px]">
              {fontSizeOptions.map((size) => (
                <button
                  key={size.value}
                  onClick={() => {
                    execCommand('fontSize', size.value.replace('px', ''));
                    setShowFontSizePicker(false);
                  }}
                  className="w-full px-3 py-1.5 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
                >
                  {size.name}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="w-px h-5 bg-slate-300 dark:bg-slate-600 mx-1" />

        {/* 颜色 */}
        <div className="relative">
          <ToolbarButton 
            icon="format_color_text" 
            onClick={() => setShowColorPicker(!showColorPicker)} 
            title="文字颜色" 
          />
          {showColorPicker && (
            <div className="absolute top-full left-0 mt-1 p-2 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 z-50 grid grid-cols-3 gap-1">
              {colorOptions.map((color) => (
                <button
                  key={color.value}
                  onClick={() => {
                    execCommand('foreColor', color.value);
                    setShowColorPicker(false);
                  }}
                  className="w-6 h-6 rounded-full border-2 border-slate-200 dark:border-slate-600 hover:scale-110 transition-transform"
                  style={{ backgroundColor: color.value }}
                  title={color.name}
                />
              ))}
            </div>
          )}
        </div>

        {/* 背景色 */}
        <div className="relative">
          <ToolbarButton 
            icon="format_color_fill" 
            onClick={() => setShowBgColorPicker(!showBgColorPicker)} 
            title="背景颜色" 
          />
          {showBgColorPicker && (
            <div className="absolute top-full left-0 mt-1 p-2 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 z-50 grid grid-cols-3 gap-1">
              {bgColorOptions.map((color) => (
                <button
                  key={color.value}
                  onClick={() => {
                    execCommand('hiliteColor', color.value);
                    setShowBgColorPicker(false);
                  }}
                  className="w-6 h-6 rounded border-2 border-slate-200 dark:border-slate-600 hover:scale-110 transition-transform"
                  style={{ backgroundColor: color.value }}
                  title={color.name}
                />
              ))}
            </div>
          )}
        </div>

        <div className="w-px h-5 bg-slate-300 dark:bg-slate-600 mx-1" />

        {/* 标题 */}
        <div className="flex items-center gap-0.5">
          <ToolbarButton icon="title" onClick={() => execCommand('formatBlock', 'H1')} title="标题 1" />
          <ToolbarButton icon="text_fields" onClick={() => execCommand('formatBlock', 'H2')} title="标题 2" />
        </div>

        <div className="w-px h-5 bg-slate-300 dark:bg-slate-600 mx-1" />

        {/* 对齐 */}
        <div className="flex items-center gap-0.5">
          <ToolbarButton icon="format_align_left" onClick={() => execCommand('justifyLeft')} title="左对齐" />
          <ToolbarButton icon="format_align_center" onClick={() => execCommand('justifyCenter')} title="居中" />
          <ToolbarButton icon="format_align_right" onClick={() => execCommand('justifyRight')} title="右对齐" />
        </div>

        <div className="w-px h-5 bg-slate-300 dark:bg-slate-600 mx-1" />

        {/* 列表 */}
        <div className="flex items-center gap-0.5">
          <ToolbarButton icon="format_list_bulleted" onClick={() => execCommand('insertUnorderedList')} title="无序列表" />
          <ToolbarButton icon="format_list_numbered" onClick={() => execCommand('insertOrderedList')} title="有序列表" />
        </div>

        <div className="w-px h-5 bg-slate-300 dark:bg-slate-600 mx-1" />

        {/* 插入 */}
        <div className="flex items-center gap-0.5">
          <ToolbarButton icon="image" onClick={handleImageUpload} title="插入图片" />
          <ToolbarButton icon="horizontal_rule" onClick={() => execCommand('insertHorizontalRule')} title="分割线" />
          <ToolbarButton icon="code" onClick={() => execCommand('formatBlock', 'PRE')} title="代码块" />
          <ToolbarButton icon="format_quote" onClick={() => execCommand('formatBlock', 'BLOCKQUOTE')} title="引用" />
        </div>

        <div className="w-px h-5 bg-slate-300 dark:bg-slate-600 mx-1" />

        {/* 清除格式 */}
        <ToolbarButton icon="format_clear" onClick={() => execCommand('removeFormat')} title="清除格式" />
      </div>

      {/* 编辑器区域 */}
      <div className="flex-1 overflow-auto p-4">
        <div
          ref={editorRef}
          contentEditable
          className="min-h-full outline-none prose dark:prose-invert max-w-none"
          style={{
            fontSize: `${settings.editor.fontSize}px`,
            lineHeight: '1.6',
          }}
          dangerouslySetInnerHTML={{ __html: content }}
          onInput={handleInput}
          onKeyUp={updateActiveStyles}
          onMouseUp={updateActiveStyles}
          data-placeholder={placeholder}
        />
      </div>
    </div>
  );
}
