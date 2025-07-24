import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ErrorBoundary from './ErrorBoundary'; // 原路径为'./error-boundary'
import * as Sentry from '@sentry/nextjs';

// 测试工具组件
const GoodComponent = () => <div>正常组件</div>;

const ErrorProneComponent = ({ shouldThrow = false }) => {
  if (shouldThrow) {
    throw new Error('测试错误触发');
  }
  return <div>安全渲染</div>;
};

const ButtonTriggeredError = () => {
  const [error, setError] = React.useState(false);
  if (error) throw new Error('按钮触发错误');
  return (
    <button onClick={() => setError(true)} data-testid="error-button">
      触发错误
    </button>
  );
};

// 添加Sentry模拟
jest.mock('@sentry/nextjs', () => ({
  captureException: jest.fn()
}));

describe('ErrorBoundary', () => {
  // 重置错误边界状态
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('本质是：正常渲染无错误组件', () => {
    render(
      <ErrorBoundary>
        <GoodComponent />
      </ErrorBoundary>
    );
    expect(screen.getByText('正常组件')).toBeInTheDocument();
  });

  it('当子组件渲染时抛出错误，应显示回退UI', () => {
    render(
      <ErrorBoundary fallback={<div data-testid="fallback">错误回退</div>}>
        <ErrorProneComponent shouldThrow={true} />
      </ErrorBoundary>
    );
    expect(screen.getByTestId('fallback')).toBeInTheDocument();
    expect(screen.queryByText('安全渲染')).not.toBeInTheDocument();
  });

  it('当事件触发错误时，应捕获并显示回退UI', () => {
    render(
      <ErrorBoundary fallback={<div data-testid="event-fallback">事件错误回退</div>}>
        <ButtonTriggeredError />
      </ErrorBoundary>
    );

    // 验证初始状态
    expect(screen.getByTestId('error-button')).toBeInTheDocument();

    // 触发错误
    fireEvent.click(screen.getByTestId('error-button'));

    // 验证错误状态
    expect(screen.getByTestId('event-fallback')).toBeInTheDocument();
  });

  it('错误发生时应调用Sentry.captureException', () => {
    // 清除之前的调用
    (Sentry.captureException as jest.Mock).mockClear();
    
    render(
      <ErrorBoundary>
        <ErrorProneComponent shouldThrow={true} />
      </ErrorBoundary>
    );
    
    // 验证Sentry调用
    expect(Sentry.captureException).toHaveBeenCalledTimes(1);
    expect(Sentry.captureException).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        extra: expect.any(Object)
      })
    );
  });

  it('提供重置功能时，应能恢复正常渲染', () => {
    // 定义带状态的测试组件（将useState移至组件内部）
    const ErrorTester = () => {
      const [shouldThrow, setShouldThrow] = React.useState(false);
      
      return (
        <div>
          <button
            onClick={() => setShouldThrow(true)}
            data-testid="trigger-error"
          >
            触发错误
          </button>
          // 将直接throw表达式改为函数调用形式
          {shouldThrow && <div>{(() => { throw new Error('测试错误') })()}</div>}
          <div data-testid="normal-content">安全渲染</div>
        </div>
      );
    };
  
    // 渲染组件
    const { getByTestId, queryByText } = render(
      <ErrorBoundary>
        <ErrorTester />
      </ErrorBoundary>
    );
  
    // 初始状态验证
    expect(getByTestId('normal-content')).toBeInTheDocument();
    expect(queryByText('发生错误')).not.toBeInTheDocument();
  
    // 触发错误
    fireEvent.click(getByTestId('trigger-error'));
    expect(queryByText('发生错误')).toBeInTheDocument();
  
    // 执行重置
    fireEvent.click(getByTestId('retry-button'));
    expect(queryByText('发生错误')).not.toBeInTheDocument();
    expect(getByTestId('normal-content')).toBeInTheDocument();
  });
});