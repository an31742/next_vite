// 导入 Sentry 的 Next.js 客户端 SDK
import * as Sentry from '@sentry/nextjs';
import { Replay } from '@sentry/replay';

// 初始化 Sentry，配置错误监控和性能追踪功能
Sentry.init({
  // 指定 Sentry 的数据发送地址（DSN），用于将错误和性能数据发送到对应的 Sentry 项目
  dsn: "https://your-sentry-dsn.sentry.io/123",
  // 设置追踪采样率，取值范围从 0.0 到 1.0，1.0 表示记录所有的事务
  tracesSampleRate: 1.0,
  // 开启或关闭调试模式，false 表示关闭，开启后会输出额外的调试信息
  debug: false,
  // 当发生错误时，会话重放的采样率，1.0 表示每次发生错误时都记录会话重放
  replaysOnErrorSampleRate: 1.0,
  // 会话重放的常规采样率，0.1 表示 10% 的会话会被记录重放
  replaysSessionSampleRate: 0.1,
  // 配置 Sentry 的集成功能
  integrations: [
    // 添加会话重放集成
    new Replay({
      // 是否屏蔽所有文本内容，false 表示不屏蔽
      maskAllText: false,
      // 是否阻止所有媒体资源（如图片、视频等）的重放，false 表示不阻止
      blockAllMedia: false,
    }),
  ],
});