/**
 * 沙箱通信安全通道实现
 * 基于Channel Messaging API的双向通信机制
 */
export class SandboxMessenger {
  constructor(sandboxId, targetOrigin = '*') {
    this.sandboxId = sandboxId;
    this.targetOrigin = targetOrigin;
    this.channel = new MessageChannel();
    this.port1 = this.channel.port1;
    this.port2 = this.channel.port2;
    this.messageHandlers = new Map();
    this.initialize();
  }

  // 初始化端口监听
  initialize() {
    this.port1.onmessage = (event) => this.handleMessage(event);
    this.port1.start();
    console.log(`沙箱通信通道初始化: ${this.sandboxId}`);
  }

  // 消息处理分发
  handleMessage(event) {
    // 安全验证: 验证来源
    if (this.targetOrigin !== '*' && event.origin !== this.targetOrigin) {
      console.error(`拒绝接收来自未授权源的消息: ${event.origin}`);
      return;
    }

    const { type, data, id } = event.data;
    const handler = this.messageHandlers.get(type);

    if (handler) {
      try {
        const result = handler(data);
        // 如果是请求类型消息，返回响应
        if (id) {
          this.send('response', { id, result }, event.origin);
        }
      } catch (error) {
        console.error(`消息处理错误 [${type}]:`, error);
      }
    } else {
      console.warn(`未注册的消息类型: ${type}`);
    }
  }

  // 发送消息
  send(type, data, targetOrigin = this.targetOrigin) {
    if (!targetOrigin) {
      throw new Error('目标源(targetOrigin)未指定，不允许发送消息');
    }

    const message = { type, data };
    // 如果是发送到iframe，使用contentWindow.postMessage
    if (this.iframe) {
      this.iframe.contentWindow.postMessage(
        message,
        targetOrigin,
        [this.port2]
      );
    } else {
      // 直接通过端口发送
      this.port1.postMessage(message);
    }
  }

  // 注册消息处理器
  on(type, handler) {
    if (typeof handler !== 'function') {
      throw new Error('消息处理器必须是函数');
    }
    this.messageHandlers.set(type, handler);
    return this;
  }

  // 移除消息处理器
  off(type) {
    this.messageHandlers.delete(type);
    return this;
  }

  // 连接到iframe
  connectToIframe(iframe) {
    this.iframe = iframe;
    return this.port2;
  }

  connectIframe(iframe) {
    if (!this.port) {
      console.error('通信端口未初始化');
      return;
    }
    // 添加通道状态调试日志
    console.log('尝试连接iframe:', iframe.src);
    iframe.contentWindow.postMessage('init-channel', this.targetOrigin, [this.port]);
  }

  // 销毁通道
  destroy() {
    this.port1.close();
    this.port2.close();
    this.messageHandlers.clear();
    this.iframe = null;
    console.log(`沙箱通信通道已销毁: ${this.sandboxId}`);
  }
}

/**
 * 在子应用中初始化通信端口
 */
export function initSandboxClient() {
  if (window.parent === window) {
    console.warn('非沙箱环境，不初始化通信客户端');
    return null;
  }

  return new Promise((resolve) => {
    window.addEventListener('message', (event) => {
      if (event.data?.type === 'sandbox-connect') {
        const port = event.ports[0];
        port.onmessage = (e) => {
          // 分发消息到子应用内部事件系统
          const customEvent = new CustomEvent(`sandbox-message-${e.data.type}`, {
            detail: e.data.data
          });
          window.dispatchEvent(customEvent);
        };
        port.start();

        // 提供发送消息的API
        const messenger = {
          send: (type, data) => port.postMessage({ type, data })
        };

        // 挂载到window供子应用使用
        window.sandboxMessenger = messenger;
        console.log('子应用通信客户端初始化完成');
        resolve(messenger);
      }
    }, { once: true });
  });
}