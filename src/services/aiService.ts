// AI 服务层 - 支持 DeepSeek API 和后续扩展
export interface AIConfig {
  provider: 'deepseek' | 'openai' | 'custom';
  apiKey: string;
  apiUrl?: string;
  model: string;
  temperature: number;
  maxTokens: number;
}

export interface AIRequest {
  content: string;
  action: 'summarize' | 'polish' | 'expand' | 'condense' | 'extract-tasks' | 'organize' | 'custom';
  context?: string;
  customPrompt?: string;
}

export interface AIResponse {
  success: boolean;
  content: string;
  error?: string;
}

// 默认配置
export const defaultAIConfig: AIConfig = {
  provider: 'deepseek',
  apiKey: '',
  apiUrl: 'https://api.deepseek.com/v1/chat/completions',
  model: 'deepseek-chat',
  temperature: 0.7,
  maxTokens: 2000,
};

// AI 提示词模板
const promptTemplates: Record<string, string> = {
  summarize: '请对以下内容进行简洁的摘要总结，保留核心要点：\n\n{{content}}',
  polish: '请对以下内容进行润色优化，提升表达流畅度和专业性，保持原意不变：\n\n{{content}}',
  expand: '请对以下内容进行扩写，增加细节和例子，使内容更丰富完整：\n\n{{content}}',
  condense: '请对以下内容进行精简，去除冗余信息，保留核心内容：\n\n{{content}}',
  'extract-tasks': '请从以下内容中提取所有待办事项，以列表形式返回：\n\n{{content}}',
  organize: '请对以下内容进行结构化整理，添加合适的标题层级和段落划分：\n\n{{content}}',
};

// AI 服务类
export class AIService {
  private config: AIConfig;

  constructor(config: Partial<AIConfig> = {}) {
    this.config = { ...defaultAIConfig, ...config };
  }

  // 更新配置
  updateConfig(config: Partial<AIConfig>) {
    this.config = { ...this.config, ...config };
  }

  // 获取当前配置
  getConfig(): AIConfig {
    return { ...this.config };
  }

  // 构建请求消息
  private buildMessages(request: AIRequest) {
    const systemPrompt = '你是一个专业的笔记助手，擅长内容整理、润色和结构化。请根据用户要求处理内容，保持格式清晰。';
    
    let userPrompt = '';
    if (request.action === 'custom' && request.customPrompt) {
      userPrompt = request.customPrompt.replace('{{content}}', request.content);
    } else {
      const template = promptTemplates[request.action] || promptTemplates.organize;
      userPrompt = template.replace('{{content}}', request.content);
    }

    if (request.context) {
      userPrompt = `上下文信息：\n${request.context}\n\n${userPrompt}`;
    }

    return [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ];
  }

  // 发送请求
  async process(request: AIRequest): Promise<AIResponse> {
    if (!this.config.apiKey) {
      return {
        success: false,
        content: '',
        error: '请先配置 API Key',
      };
    }

    try {
      const response = await fetch(this.config.apiUrl!, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          model: this.config.model,
          messages: this.buildMessages(request),
          temperature: this.config.temperature,
          max_tokens: this.config.maxTokens,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`API 请求失败: ${error}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '';

      return {
        success: true,
        content: content.trim(),
      };
    } catch (error) {
      return {
        success: false,
        content: '',
        error: error instanceof Error ? error.message : '未知错误',
      };
    }
  }

  // 流式处理（用于实时显示）
  async *processStream(request: AIRequest): AsyncGenerator<string, void, unknown> {
    if (!this.config.apiKey) {
      throw new Error('请先配置 API Key');
    }

    const response = await fetch(this.config.apiUrl!, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({
        model: this.config.model,
        messages: this.buildMessages(request),
        temperature: this.config.temperature,
        max_tokens: this.config.maxTokens,
        stream: true,
      }),
    });

    if (!response.ok) {
      throw new Error('API 请求失败');
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('无法读取响应');

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') return;

          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) yield content;
          } catch {
            // 忽略解析错误
          }
        }
      }
    }
  }
}

// 创建单例
let aiServiceInstance: AIService | null = null;

export function getAIService(): AIService {
  if (!aiServiceInstance) {
    // 尝试从 localStorage 加载配置
    const savedConfig = localStorage.getItem('ai-config');
    const config = savedConfig ? JSON.parse(savedConfig) : {};
    aiServiceInstance = new AIService(config);
  }
  return aiServiceInstance;
}

export function resetAIService(config?: Partial<AIConfig>) {
  aiServiceInstance = new AIService(config);
  if (config) {
    localStorage.setItem('ai-config', JSON.stringify(aiServiceInstance.getConfig()));
  }
}

export default AIService;
