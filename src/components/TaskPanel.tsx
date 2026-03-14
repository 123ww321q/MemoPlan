import { useTranslation } from 'react-i18next';
import { useNoteStore } from '../stores/noteStore';
import { useTaskStore } from '../stores/taskStore';
import { Task } from '../types';
import { useEffect, useState } from 'react';
import { marked } from 'marked';

// 配置 marked 支持表格和任务列表
marked.setOptions({
  gfm: true,
  breaks: true,
});

// 自定义 renderer 支持任务列表
const renderer = new marked.Renderer();
const originalListItem = renderer.listitem;
renderer.listitem = (text: string, task: boolean, checked: boolean) => {
  if (task) {
    return `<li class="task-list-item flex items-start gap-2 py-1">
      <input type="checkbox" ${checked ? 'checked' : ''} disabled class="mt-0.5">
      <span class="${checked ? 'line-through text-slate-400' : ''}">${text}</span>
    </li>`;
  }
  return originalListItem.call(renderer, text, task, checked);
};
marked.use({ renderer });

export default function TaskPanel() {
  const { t } = useTranslation();
  const { currentNoteId, getCurrentNote } = useNoteStore();
  const { tasks, toggleTaskComplete, getTasksByNoteId, addTask, deleteTask } = useTaskStore();
  const [currentTasks, setCurrentTasks] = useState<Task[]>([]);
  const [newTaskInput, setNewTaskInput] = useState('');
  const [activeTab, setActiveTab] = useState<'tasks' | 'plan'>('tasks');
  const [planContent, setPlanContent] = useState('');
  
  const currentNote = getCurrentNote();

  // 当当前笔记变化时，加载对应的任务
  useEffect(() => {
    if (currentNoteId) {
      const noteTasks = getTasksByNoteId(currentNoteId);
      setCurrentTasks(noteTasks);
      // 从笔记内容中提取计划表
      if (currentNote?.content) {
        extractPlanFromContent(currentNote.content);
      }
    } else {
      setCurrentTasks([]);
      setPlanContent('');
    }
  }, [currentNoteId, tasks, getTasksByNoteId, currentNote]);

  // 从笔记内容中提取计划表（Markdown 表格和任务列表）
  const extractPlanFromContent = (content: string) => {
    // 提取所有任务列表项
    const taskListRegex = /^\s*-\s+\[[\sxX]\]\s+.+$/gm;
    const taskMatches = content.match(taskListRegex);
    
    // 提取表格
    const tableRegex = /\|[^\n]+\|[^\n]*\n\|[-:\s|]+\|\n(\|[^\n]+\|[^\n]*\n?)+/g;
    const tableMatches = content.match(tableRegex);
    
    let planHtml = '';
    
    if (taskMatches && taskMatches.length > 0) {
      planHtml += marked(taskMatches.join('\n'));
    }
    
    if (tableMatches && tableMatches.length > 0) {
      planHtml += marked(tableMatches.join('\n\n'));
    }
    
    setPlanContent(planHtml);
  };

  // 计算完成进度
  const completedCount = currentTasks.filter((t) => t.completed).length;
  const progress = currentTasks.length > 0
    ? Math.round((completedCount / currentTasks.length) * 100)
    : 0;

  // 添加新任务
  const handleAddTask = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && newTaskInput.trim() && currentNoteId) {
      addTask({
        noteId: currentNoteId,
        title: newTaskInput.trim(),
        completed: false,
        priority: 'medium',
        level: 1,
        order: currentTasks.length,
      });
      setNewTaskInput('');
    }
  };

  // 删除任务
  const handleDeleteTask = (taskId: string) => {
    deleteTask(taskId);
  };

  // 渲染计划表内容
  const renderPlanContent = () => {
    if (!planContent) {
      return (
        <div className="text-center text-slate-400 py-8">
          <span className="material-symbols-outlined text-4xl mb-2">table</span>
          <p className="text-xs">{t('tasks.noPlan')}</p>
          <p className="text-[10px] mt-1">{t('tasks.addPlanHint')}</p>
        </div>
      );
    }
    return (
      <div 
        className="prose dark:prose-invert prose-sm max-w-none task-plan-content"
        dangerouslySetInnerHTML={{ __html: planContent }}
      />
    );
  };

  return (
    <aside className="w-80 flex flex-col border-l border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm shrink-0">
      {/* 头部 */}
      <div className="h-12 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 shrink-0">
        <span className="text-sm font-bold flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-lg">task_alt</span>
          {t('tasks.title')}
        </span>
        <span className="text-xs text-slate-400">
          {currentTasks.length > 0 && `${completedCount}/${currentTasks.length}`}
        </span>
      </div>

      {/* 标签切换 */}
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('tasks')}
          className={`flex-1 py-2 text-xs font-medium transition-colors ${
            activeTab === 'tasks'
              ? 'text-primary border-b-2 border-primary bg-primary/5'
              : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          {t('tasks.taskList')}
        </button>
        <button
          onClick={() => setActiveTab('plan')}
          className={`flex-1 py-2 text-xs font-medium transition-colors ${
            activeTab === 'plan'
              ? 'text-primary border-b-2 border-primary bg-primary/5'
              : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          {t('tasks.planTable')}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {activeTab === 'tasks' ? (
          <>
            {/* 任务列表 */}
            {currentTasks.length > 0 ? (
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                  {t('tasks.extractedFromNote')}
                </p>
                <div className="space-y-2">
                  {currentTasks.map((task) => (
                    <div 
                      key={task.id} 
                      className="flex gap-2 group p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={task.completed}
                        onChange={() => toggleTaskComplete(task.id)}
                        className="mt-0.5 rounded border-slate-300 dark:border-slate-600 text-primary focus:ring-primary size-4 cursor-pointer"
                      />
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-medium truncate ${task.completed ? 'text-slate-400 line-through' : ''}`}>
                          {task.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span
                            className={`text-[9px] px-1.5 py-0.5 font-bold rounded ${
                              task.priority === 'high'
                                ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                                : task.priority === 'medium'
                                ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                            }`}
                          >
                            {t(`tasks.${task.priority}`)}
                          </span>
                          {task.dueDate && (
                            <span className="text-[9px] text-slate-400">
                              {new Date(task.dueDate).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded text-slate-400 hover:text-red-500 transition-all"
                      >
                        <span className="material-symbols-outlined text-sm">delete</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center text-slate-400 py-8">
                <span className="material-symbols-outlined text-4xl mb-2">checklist</span>
                <p className="text-xs">{t('tasks.noTasks')}</p>
                <p className="text-[10px] mt-1">{t('tasks.extractHint')}</p>
              </div>
            )}

            {/* 进度条 */}
            {currentTasks.length > 0 && (
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                  {t('tasks.progress')}
                </p>
                <div className="p-3 bg-primary/5 rounded-xl border border-primary/20">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold">{t('tasks.completionRate')}</span>
                    <span className="text-[10px] font-bold text-primary">{progress}%</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-primary h-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          /* 计划表视图 */
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
              {t('tasks.planPreview')}
            </p>
            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
              {renderPlanContent()}
            </div>
            <p className="text-[10px] text-slate-400 mt-2">
              {t('tasks.planAutoSync')}
            </p>
          </div>
        )}
      </div>

      {/* 快速添加任务 */}
      {activeTab === 'tasks' && (
        <div className="p-4 bg-slate-50/50 dark:bg-slate-900/30 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-slate-400 text-lg">add_task</span>
            <input
              className="flex-1 bg-transparent border-none text-xs focus:ring-0 placeholder:text-slate-400"
              placeholder={t('tasks.quickAdd')}
              type="text"
              value={newTaskInput}
              onChange={(e) => setNewTaskInput(e.target.value)}
              onKeyDown={handleAddTask}
            />
          </div>
        </div>
      )}
    </aside>
  );
}
