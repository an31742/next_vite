// 从 '@sentry/nextjs' 模块导入所有内容到 Sentry 对象，以便后续使用 Sentry 相关功能
import * as Sentry from '@sentry/nextjs';

// 初始化 Sentry SDK，配置相关参数以启用错误监控和追踪功能
Sentry.init({
  // 设置 Sentry 的数据来源名称 (DSN)，这是一个唯一的标识符，用于将项目的错误数据发送到对应的 Sentry 项目
  dsn: "https://your-sentry-dsn.sentry.io/123",
  // 设置追踪采样率，取值范围从 0.0 到 1.0。这里设置为 1.0 表示捕获所有的事务追踪
  tracesSampleRate: 1.0,
  // 调试模式开关，设置为 false 表示关闭调试模式，不会输出 Sentry SDK 的调试信息
  debug: false,
  // 启用RSC错误捕获
  autoInstrumentServerFunctions: true,
  // 捕获未处理的Promise拒绝
  unhandledRejectionHandling: 'auto',
});