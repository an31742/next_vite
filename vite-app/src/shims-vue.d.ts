declare module '*.vue' {
  import { Component } from 'vue';
  const component: Component;
  export default component;
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elem: string]: any;
    }
  }
}