/**
 * Telegram Notification Service
 * Sends notifications to a Telegram group via Bot API
 */

const TELEGRAM_BOT_TOKEN = import.meta.env.VITE_TELEGRAM_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = import.meta.env.VITE_TELEGRAM_CHAT_ID || process.env.TELEGRAM_CHAT_ID;

interface TelegramMessage {
  text: string;
  parse_mode?: 'Markdown' | 'HTML';
}

/**
 * Send a message to Telegram group
 */
export const sendTelegramMessage = async (message: string, parseMode: 'Markdown' | 'HTML' = 'Markdown'): Promise<boolean> => {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.warn('Telegram credentials not configured');
    return false;
  }

  try {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    const payload: TelegramMessage = {
      text: message,
      parse_mode: parseMode
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ...payload,
        chat_id: TELEGRAM_CHAT_ID
      })
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Telegram API error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Failed to send Telegram message:', error);
    return false;
  }
};

/**
 * Format task notification
 */
export const formatTaskNotification = (event: string, task: any, user?: string): string => {
  const emojiMap: Record<string, string> = {
    created: '🆕',
    updated: '📝',
    done: '✅',
    assigned: '👤',
    mentioned: '💬'
  };

  const emoji = emojiMap[event] || '📢';
  const taskLink = `[${task.title}](#task/${task.id})`;
  
  let message = `${emoji} *${event.toUpperCase()}*\n\n`;
  message += `Task: ${taskLink}\n`;
  message += `ID: \`${task.id}\`\n`;
  
  if (task.priority) {
    message += `Priority: *${task.priority}*\n`;
  }
  
  if (user) {
    message += `User: ${user}\n`;
  }
  
  if (task.deadline) {
    message += `Deadline: ${new Date(task.deadline).toLocaleDateString()}\n`;
  }

  return message;
};

/**
 * Format mention notification
 */
export const formatMentionNotification = (username: string, taskId: string, taskTitle: string, commentText: string): string => {
  return `💬 *MENTION*\n\n` +
    `${username}, you were mentioned in a comment on task [${taskTitle}](#task/${taskId})\n\n` +
    `Comment: ${commentText.substring(0, 200)}${commentText.length > 200 ? '...' : ''}`;
};


