import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSettingsStore, themeColors } from '../stores/settingsStore';
import { useNoteStore } from '../stores/noteStore';
import { ThemeColor } from '../types';

type SettingsTab = 'general' | 'appearance' | 'editor' | 'import' | 'export' | 'about';

interface SettingsPageProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsPage({ isOpen, onClose }: SettingsPageProps) {
  const { i18n } = useTranslation();
  const { settings, updateGeneralSettings, updateAppearanceSettings, updateEditorSettings, updateExportSettings, updateImportSettings, setThemeColor, setTheme, resetSettings } = useSettingsStore();
  const { emptyTrash, deletedNotes } = useNoteStore();
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  if (!isOpen) return null;

  const handleLanguageChange = (lang: string) => {
    i18n.changeLanguage(lang);
    updateGeneralSettings({});
  };

  const handleThemeColorChange = (color: ThemeColor) => {
    setThemeColor(color);
  };

  const handleBackgroundImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        updateAppearanceSettings({ backgroundImage: event.target?.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleClearBackground = () => {
    updateAppearanceSettings({ backgroundImage: undefined });
  };

  const handleReset = () => {
    resetSettings();
    setShowResetConfirm(false);
  };

  const tabs: { id: SettingsTab; label: string; icon: string }[] = [
    { id: 'general', label: '常规设置', icon: 'settings' },
    { id: 'appearance', label: '外观', icon: 'palette' },
    { id: 'editor', label: '编辑器', icon: 'edit' },
    { id: 'import', label: '导入', icon: 'download' },
    { id: 'export', label: '导出', icon: 'upload' },
    { id: 'about', label: '关于', icon: 'info' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-[900px] h-[600px] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl flex overflow-hidden">
        {/* 左侧导航 */}
        <div className="w-56 bg-slate-50 dark:bg-slate-800/50 border-r border-slate-200 dark:border-slate-700 flex flex-col">
          <div className="p-4 border-b border-slate-200 dark:border-slate-700">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <span className="material-symbols-outlined">settings</span>
              设置
            </h2>
          </div>
          <nav className="flex-1 p-2 space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-left ${
                  activeTab === tab.id
                    ? 'bg-primary text-white'
                    : 'hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                <span className="material-symbols-outlined text-lg">{tab.icon}</span>
                <span className="text-sm font-medium">{tab.label}</span>
              </button>
            ))}
          </nav>
          <div className="p-4 border-t border-slate-200 dark:border-slate-700">
            <button
              onClick={onClose}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 rounded-lg transition-colors text-sm font-medium"
            >
              <span className="material-symbols-outlined text-lg">close</span>
              关闭
            </button>
          </div>
        </div>

        {/* 右侧内容 */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 overflow-y-auto p-6">
            {/* 常规设置 */}
            {activeTab === 'general' && (
              <div className="space-y-6">
                <h3 className="text-xl font-bold">常规设置</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                    <div>
                      <p className="font-medium">语言</p>
                      <p className="text-sm text-slate-500">选择界面显示语言</p>
                    </div>
                    <select
                      value={i18n.language}
                      onChange={(e) => handleLanguageChange(e.target.value)}
                      className="px-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm"
                    >
                      <option value="zh-CN">简体中文</option>
                      <option value="zh-TW">繁體中文</option>
                      <option value="en">English</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                    <div>
                      <p className="font-medium">删除确认</p>
                      <p className="text-sm text-slate-500">删除笔记前显示确认对话框</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.general.confirmDelete}
                        onChange={(e) => updateGeneralSettings({ confirmDelete: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                    <div>
                      <p className="font-medium">自动保存</p>
                      <p className="text-sm text-slate-500">自动保存编辑中的内容</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.general.autoSave}
                        onChange={(e) => updateGeneralSettings({ autoSave: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>

                  {settings.general.autoSave && (
                    <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                      <div>
                        <p className="font-medium">自动保存间隔</p>
                        <p className="text-sm text-slate-500">自动保存的时间间隔（秒）</p>
                      </div>
                      <input
                        type="number"
                        min={1}
                        max={60}
                        value={settings.general.autoSaveInterval}
                        onChange={(e) => updateGeneralSettings({ autoSaveInterval: parseInt(e.target.value) || 3 })}
                        className="w-20 px-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-center"
                      />
                    </div>
                  )}

                  <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-red-600 dark:text-red-400">回收站</p>
                        <p className="text-sm text-slate-500">已删除笔记: {deletedNotes.length} 个</p>
                      </div>
                      {deletedNotes.length > 0 && (
                        <button
                          onClick={() => {
                            if (confirm('确定要清空回收站吗？此操作不可撤销。')) {
                              emptyTrash();
                            }
                          }}
                          className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors"
                        >
                          清空回收站
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 外观设置 */}
            {activeTab === 'appearance' && (
              <div className="space-y-6">
                <h3 className="text-xl font-bold">外观设置</h3>
                
                <div className="space-y-4">
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                    <p className="font-medium mb-3 text-slate-900 dark:text-white">主题模式</p>
                    <div className="flex gap-3">
                      {(['light', 'dark', 'auto'] as const).map((theme) => (
                        <button
                          key={theme}
                          onClick={() => setTheme(theme)}
                          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
                            settings.appearance.theme === theme
                              ? 'border-primary bg-primary/5'
                              : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                          }`}
                        >
                          <span className="material-symbols-outlined text-slate-700 dark:text-slate-300">
                            {theme === 'light' ? 'light_mode' : theme === 'dark' ? 'dark_mode' : 'brightness_auto'}
                          </span>
                          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            {theme === 'light' ? '浅色' : theme === 'dark' ? '深色' : '自动'}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                    <p className="font-medium mb-3 text-slate-900 dark:text-white">主题配色</p>
                    <div className="grid grid-cols-4 gap-3">
                      {(Object.keys(themeColors) as ThemeColor[]).map((color) => (
                        <button
                          key={color}
                          onClick={() => handleThemeColorChange(color)}
                          className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                            settings.appearance.themeColor === color
                              ? 'border-primary'
                              : 'border-transparent hover:border-slate-300'
                          }`}
                        >
                          <div
                            className="w-10 h-10 rounded-full shadow-md"
                            style={{ backgroundColor: themeColors[color].primary }}
                          />
                          <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{themeColors[color].name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                    <p className="font-medium mb-3">背景图片</p>
                    <div className="space-y-3">
                      {settings.appearance.backgroundImage && (
                        <div className="relative w-full h-32 rounded-lg overflow-hidden">
                          <img
                            src={settings.appearance.backgroundImage}
                            alt="背景预览"
                            className="w-full h-full object-cover"
                          />
                          <button
                            onClick={handleClearBackground}
                            className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                          >
                            <span className="material-symbols-outlined text-sm">delete</span>
                          </button>
                        </div>
                      )}
                      <div className="flex gap-3">
                        <label className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-primary text-white rounded-lg cursor-pointer hover:bg-primary/90 transition-colors">
                          <span className="material-symbols-outlined">upload</span>
                          <span className="text-sm font-medium">上传背景图片</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleBackgroundImageUpload}
                            className="hidden"
                          />
                        </label>
                      </div>
                      
                      {settings.appearance.backgroundImage && (
                        <>
                          <div className="flex items-center justify-between">
                            <span className="text-sm">背景模式</span>
                            <select
                              value={settings.appearance.backgroundMode}
                              onChange={(e) => updateAppearanceSettings({ backgroundMode: e.target.value as any })}
                              className="px-3 py-1.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm"
                            >
                              <option value="fill">填充</option>
                              <option value="fit">适应</option>
                              <option value="center">居中</option>
                              <option value="tile">平铺</option>
                            </select>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm">背景模糊</span>
                            <input
                              type="range"
                              min={0}
                              max={50}
                              value={settings.appearance.backgroundBlur}
                              onChange={(e) => updateAppearanceSettings({ backgroundBlur: parseInt(e.target.value) })}
                              className="w-32"
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm">背景不透明度</span>
                            <input
                              type="range"
                              min={10}
                              max={100}
                              value={settings.appearance.backgroundOpacity}
                              onChange={(e) => updateAppearanceSettings({ backgroundOpacity: parseInt(e.target.value) })}
                              className="w-32"
                            />
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                    <p className="font-medium mb-3">布局设置</p>
                    <div className="space-y-3">
                      {[
                        { key: 'sidebarVisible', label: '显示左侧导航' },
                        { key: 'noteListVisible', label: '显示笔记列表' },
                        { key: 'taskPanelVisible', label: '显示任务面板' },
                      ].map(({ key, label }) => (
                        <div key={key} className="flex items-center justify-between">
                          <span className="text-sm">{label}</span>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={settings.appearance[key as keyof typeof settings.appearance] as boolean}
                              onChange={(e) => updateAppearanceSettings({ [key]: e.target.checked })}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 编辑器设置 */}
            {activeTab === 'editor' && (
              <div className="space-y-6">
                <h3 className="text-xl font-bold">编辑器设置</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                    <div>
                      <p className="font-medium">字体大小</p>
                      <p className="text-sm text-slate-500">编辑器中的文字大小</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => updateEditorSettings({ fontSize: Math.max(10, settings.editor.fontSize - 1) })}
                        className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg"
                      >
                        <span className="material-symbols-outlined">remove</span>
                      </button>
                      <span className="w-12 text-center font-medium">{settings.editor.fontSize}px</span>
                      <button
                        onClick={() => updateEditorSettings({ fontSize: Math.min(32, settings.editor.fontSize + 1) })}
                        className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg"
                      >
                        <span className="material-symbols-outlined">add</span>
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                    <div>
                      <p className="font-medium">字体</p>
                      <p className="text-sm text-slate-500">编辑器使用的字体</p>
                    </div>
                    <select
                      value={settings.editor.fontFamily}
                      onChange={(e) => updateEditorSettings({ fontFamily: e.target.value })}
                      className="px-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm"
                    >
                      <option value="system-ui, -apple-system, sans-serif">系统默认</option>
                      <option value="'Microsoft YaHei', sans-serif">微软雅黑</option>
                      <option value="'PingFang SC', sans-serif">苹方</option>
                      <option value="'Noto Sans SC', sans-serif">思源黑体</option>
                      <option value="'Fira Code', monospace">Fira Code</option>
                      <option value="'JetBrains Mono', monospace">JetBrains Mono</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                    <div>
                      <p className="font-medium">预览模式</p>
                      <p className="text-sm text-slate-500">编辑器的显示方式</p>
                    </div>
                    <select
                      value={settings.editor.previewMode}
                      onChange={(e) => updateEditorSettings({ previewMode: e.target.value as any })}
                      className="px-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm"
                    >
                      <option value="side">分屏预览</option>
                      <option value="edit">仅编辑</option>
                      <option value="preview">仅预览</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                    <div>
                      <p className="font-medium">自动换行</p>
                      <p className="text-sm text-slate-500">长文本自动换行显示</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.editor.wordWrap}
                        onChange={(e) => updateEditorSettings({ wordWrap: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                    <div>
                      <p className="font-medium">显示行号</p>
                      <p className="text-sm text-slate-500">在编辑器左侧显示行号</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.editor.showLineNumbers}
                        onChange={(e) => updateEditorSettings({ showLineNumbers: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* 导入设置 */}
            {activeTab === 'import' && (
              <div className="space-y-6">
                <h3 className="text-xl font-bold">导入设置</h3>
                
                <div className="space-y-4">
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                    <p className="font-medium mb-3">支持的文件格式</p>
                    <div className="space-y-2">
                      {['.md (Markdown)', '.txt (纯文本)', '.json (JSON)', '.html (HTML)'].map((format) => (
                        <div key={format} className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-primary">check_circle</span>
                          <span className="text-sm">{format}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                    <div>
                      <p className="font-medium">保留原始日期</p>
                      <p className="text-sm text-slate-500">导入时保留文件的原始创建和修改日期</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.import.preserveDates}
                        onChange={(e) => updateImportSettings({ preserveDates: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>

                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                    <p className="text-sm text-blue-600 dark:text-blue-400">
                      <span className="material-symbols-outlined text-sm align-text-bottom">info</span>
                      {' '}导入功能可在主界面通过左侧导航栏或快捷键使用
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 导出设置 */}
            {activeTab === 'export' && (
              <div className="space-y-6">
                <h3 className="text-xl font-bold">导出设置</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                    <div>
                      <p className="font-medium">默认导出格式</p>
                      <p className="text-sm text-slate-500">选择默认的导出文件格式</p>
                    </div>
                    <select
                      value={settings.export.defaultFormat}
                      onChange={(e) => updateExportSettings({ defaultFormat: e.target.value as any })}
                      className="px-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm"
                    >
                      <option value="md">Markdown (.md)</option>
                      <option value="txt">纯文本 (.txt)</option>
                      <option value="html">HTML (.html)</option>
                      <option value="json">JSON (.json)</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                    <div>
                      <p className="font-medium">包含元数据</p>
                      <p className="text-sm text-slate-500">导出时包含创建时间、修改时间等信息</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.export.includeMetadata}
                        onChange={(e) => updateExportSettings({ includeMetadata: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                    <div>
                      <p className="font-medium">包含标签</p>
                      <p className="text-sm text-slate-500">导出时包含笔记的标签信息</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.export.includeTags}
                        onChange={(e) => updateExportSettings({ includeTags: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>

                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                    <p className="text-sm text-blue-600 dark:text-blue-400">
                      <span className="material-symbols-outlined text-sm align-text-bottom">info</span>
                      {' '}导出功能可在笔记编辑器中使用
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 关于 */}
            {activeTab === 'about' && (
              <div className="space-y-6">
                <h3 className="text-xl font-bold">关于</h3>
                
                <div className="space-y-4">
                  <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-center">
                    <div className="w-20 h-20 bg-primary rounded-2xl mx-auto mb-4 flex items-center justify-center">
                      <span className="material-symbols-outlined text-4xl text-white">grid_view</span>
                    </div>
                    <h4 className="text-xl font-bold mb-1">MemoPlan</h4>
                    <p className="text-slate-500 text-sm">桌面便签 + Markdown 笔记 + 学习待办规划工具</p>
                    <p className="text-slate-400 text-xs mt-2">版本 1.0.0</p>
                  </div>

                  <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                    <p className="font-medium mb-2">技术栈</p>
                    <div className="flex flex-wrap gap-2">
                      {['React', 'TypeScript', 'Tailwind CSS', 'Tauri', 'Zustand'].map((tech) => (
                        <span key={tech} className="px-2 py-1 bg-slate-200 dark:bg-slate-700 rounded text-xs">
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl">
                    <button
                      onClick={() => setShowResetConfirm(true)}
                      className="w-full py-2 text-yellow-600 dark:text-yellow-400 text-sm font-medium hover:underline"
                    >
                      重置所有设置
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 重置确认对话框 */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 max-w-sm w-full mx-4 shadow-2xl">
            <h4 className="text-lg font-bold mb-2">确认重置？</h4>
            <p className="text-slate-500 text-sm mb-4">此操作将重置所有设置到默认值，无法撤销。</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 py-2 bg-slate-200 dark:bg-slate-700 rounded-lg text-sm font-medium hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleReset}
                className="flex-1 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors"
              >
                确认重置
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
