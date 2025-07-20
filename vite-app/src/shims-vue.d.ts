declare module '*.vue' {
  import { Component } from 'vue';
  const component: Component;
  export default component;
}

// 完整的JSX类型声明以解决所有JSX元素问题
declare global {
  namespace JSX {
    interface Element extends VNode {}
    interface ElementClass {}
    interface ElementAttributesProperty { $props: any }
    interface IntrinsicElements {
      [elem: string]: any;
    }
  }
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'development' | 'production' | 'test';
      [key: string]: string | undefined;
    }
  }
}

// 扩展JWT Payload类型
declare module 'jwt-decode' {
  export interface JwtPayload {
    roles?: string[];
    [key: string]: any;
  }
}

import type { VNode } from 'vue';