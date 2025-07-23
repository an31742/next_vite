// 此文件定义了一个 React 错误边界组件 `ErrorBoundary`，用于捕获并处理子组件中发生的 JavaScript 错误。
// 错误边界是 React 组件，它可以捕获并记录发生在其子组件树任何位置的 JavaScript 错误，
// 渲染备用 UI 而不是崩溃的组件树，同时保持应用的其他部分正常运行。

// 标记为客户端组件，Next.js 中用于区分客户端和服务端组件
'use client';

// 导入 React 相关的类型和组件基类
import React, { Component, ErrorInfo, ReactNode } from 'react';
// 导入 Sentry 的 Next.js 集成库，用于错误监控和报告
import * as Sentry from '@sentry/nextjs';

// 定义 ErrorBoundary 组件的属性类型
// children: 子组件内容
// fallback: 可选的自定义错误回退 UI
interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

// 定义 ErrorBoundary 组件的状态类型
// hasError: 标记是否发生错误
// error: 存储发生的错误对象
interface State {
  hasError: boolean;
  error?: Error;
}

// 定义 ErrorBoundary 类组件，继承自 React.Component
class ErrorBoundary extends Component<Props, State> {
  // 初始化组件状态，默认没有错误发生
  public state: State = {
    hasError: false
  };

  // 静态方法，当子组件抛出错误后，此方法会被调用
  // 接收错误对象作为参数，返回新的状态对象
  // 用于更新组件状态，以便下一次渲染显示错误 UI
  public static getDerivedStateFromError(error: Error): State {
    // 更新状态，以便下一次渲染显示错误UI
    return { hasError: true, error };
  }

  // 当错误发生时，此生命周期方法会被调用
  // 接收错误对象和错误信息对象作为参数
  // 用于将错误信息发送到 Sentry 进行错误监控
  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // 将错误发送到Sentry
    Sentry.captureException(error, {
      extra: { errorInfo }
    });
  }

  // 组件渲染方法
  public render() {
    // 如果发生错误
    if (this.state.hasError) {
      // 自定义错误 fallback UI
      // 优先使用传入的 fallback 属性作为错误 UI
      // 如果没有传入，则使用默认的错误 UI
      return this.props.fallback || (
        <div style={{
          padding: '2rem',
          textAlign: 'center',
          backgroundColor: '#fff5f5',
          border: '1px solid #ffcccc',
          borderRadius: '8px'
        }}>
          <h2 style={{
            color: '#dc3545',
            marginBottom: '1rem'
          }}>发生错误</h2>
          <p>我们正在努力修复这个问题。请稍后再试。</p>
          <button
            onClick={() => this.setState({ hasError: false })} 
            style={{
              marginTop: '1rem',
              padding: '0.5rem 1rem',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            重试
          </button>
        </div>
      );
    }

    // 如果没有错误，正常渲染子组件
    return this.props.children;
  }
}

// 导出 ErrorBoundary 组件，供其他文件使用
export default ErrorBoundary;