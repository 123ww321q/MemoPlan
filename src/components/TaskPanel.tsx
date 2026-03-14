import { useState } from 'react';
import { useTaskStore } from '../stores/taskStore';
import { useNoteStore } from '../stores/noteStore';

export default function TaskPanel() {
  const { tasks, addTask, toggleTaskComplete, deleteTask, convertMarkdownToTasks } = useTaskStore();
  const { currentNoteId } = useNoteStore();
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [activeTab, setActiveTab] = useState<'tasks' | 'schedule'>('tasks');

  const handleAddTask = () => {
    if (newTaskTitle.trim()) {
      addTask({
        title: newTaskTitle,
        noteId: currentNoteId || '',
        completed: false,
        priority: 'medium',
        level: 1,
        order: tasks.length,
      });
      setNewTaskTitle('');
    }
  };

  const handleGenerateTasks = () => {
    // 从笔记内容生成任务
    if (currentNoteId) {
      // 这里需要从 noteStore 获取当前笔记内容
      // 简化处理，实际应该传入内容
      convertMarkdownToTasks('', currentNoteId);
    }
  };

  const pendingTasks = tasks.filter(t => !t.completed);
  const completedTasks = tasks.filter(t => t.completed);

  return (
    <div className="flex flex-col h-full bg-[var(--panel-bg)]">
      {/* 标签页切换 */}
      <div className="flex border-b border-[var(--panel-border)]">
        <button
          onClick={() => setActiveTab('tasks')}
          className={`flex-1 py-3 text-sm font-medium transition-colors relative ${
            activeTab === 'tasks'
              ? 'text-primary'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          任务列表
          {activeTab === 'tasks' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('schedule')}
          className={`flex-1 py-3 text-sm font-medium transition-colors relative ${
            activeTab === 'schedule'
              ? 'text-primary'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          计划表
          {activeTab === 'schedule' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
          )}
        </button>
      </div>

      {/* 内容区域 */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'tasks' ? (
          <div className="p-4 space-y-4">
            {/* 生成任务按钮 */}
            {currentNoteId && pendingTasks.length === 0 && (
              <button
                onClick={handleGenerateTasks}
                className="w-full py-3 px-4 bg-primary/5 hover:bg-primary/10 text-primary rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined">auto_awesome</span>
                一键生成待办
              </button>
            )}

            {/* 待办任务 */}
            {pendingTasks.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                  待办 ({pendingTasks.length})
                </h4>
                {pendingTasks.map((task) => (
                  <div
                    key={task.id}
                    className="group flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <button
                      onClick={() => toggleTaskComplete(task.id)}
                      className="mt-0.5 w-5 h-5 rounded border-2 border-primary/30 hover:border-primary flex items-center justify-center transition-colors"
                    >
                      <span className="material-symbols-outlined text-primary text-sm opacity-0 group-hover:opacity-100">
                        check
                      </span>
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-[var(--text-primary)]">{task.title}</p>
                      {task.noteId && (
                        <p className="text-xs text-[var(--text-secondary)] mt-1">来自笔记</p>
                      )}
                    </div>
                    <button
                      onClick={() => deleteTask(task.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-all"
                    >
                      <span className="material-symbols-outlined text-red-500 text-sm">delete</span>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* 已完成任务 */}
            {completedTasks.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                  已完成 ({completedTasks.length})
                </h4>
                {completedTasks.map((task) => (
                  <div
                    key={task.id}
                    className="group flex items-start gap-3 p-3 bg-slate-50/50 dark:bg-slate-800/30 rounded-xl"
                  >
                    <button
                      onClick={() => toggleTaskComplete(task.id)}
                      className="mt-0.5 w-5 h-5 rounded bg-primary flex items-center justify-center"
                    >
                      <span className="material-symbols-outlined text-white text-sm">check</span>
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-[var(--text-secondary)] line-through">{task.title}</p>
                    </div>
                    <button
                      onClick={() => deleteTask(task.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-all"
                    >
                      <span className="material-symbols-outlined text-red-500 text-sm">delete</span>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* 空状态 */}
            {tasks.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-[var(--text-secondary)]">
                <span className="material-symbols-outlined text-4xl mb-2 text-primary/30">checklist</span>
                <p className="text-sm">暂无任务</p>
                <p className="text-xs mt-1">点击"一键生成待办"提取任务</p>
              </div>
            )}
          </div>
        ) : (
          /* 计划表 */
          <div className="p-4">
            <div className="space-y-4">
              {/* 今日计划 */}
              <div className="p-4 bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl">
                <h4 className="text-sm font-medium text-[var(--text-primary)] mb-3">今日计划</h4>
                <div className="space-y-2">
                  {pendingTasks.slice(0, 3).map((task, index) => (
                    <div key={task.id} className="flex items-center gap-2 text-sm">
                      <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center">
                        {index + 1}
                      </span>
                      <span className="text-[var(--text-primary)]">{task.title}</span>
                    </div>
                  ))}
                  {pendingTasks.length === 0 && (
                    <p className="text-sm text-[var(--text-secondary)]">今日暂无计划</p>
                  )}
                </div>
              </div>

              {/* 进度统计 */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-center">
                  <div className="text-2xl font-bold text-primary">{pendingTasks.length}</div>
                  <div className="text-xs text-[var(--text-secondary)]">待办任务</div>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-center">
                  <div className="text-2xl font-bold text-green-500">{completedTasks.length}</div>
                  <div className="text-xs text-[var(--text-secondary)]">已完成</div>
                </div>
              </div>

              {/* 完成率 */}
              {tasks.length > 0 && (
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-[var(--text-primary)]">完成进度</span>
                    <span className="text-sm font-medium text-primary">
                      {Math.round((completedTasks.length / tasks.length) * 100)}%
                    </span>
                  </div>
                  <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${(completedTasks.length / tasks.length) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 快速添加任务 */}
      {activeTab === 'tasks' && (
        <div className="p-3 border-t border-[var(--panel-border)]">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[var(--text-secondary)]">add_task</span>
            <input
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddTask()}
              placeholder="快速添加任务..."
              className="flex-1 bg-transparent text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] outline-none"
            />
          </div>
        </div>
      )}
    </div>
  );
}
