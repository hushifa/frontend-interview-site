var e={answerHtml:`<p>useRef 保存跨渲染持久存在的可变引用，修改 current 不会触发重渲染。它适合 DOM 引用、计时器 ID 等不直接决定界面的值；用于展示的数据通常应保存在 state。</p>
<p>useEffect 用于提交后的外部同步；useLayoutEffect 在提交后的布局阶段同步执行，可在绘制前测量和调整 DOM，但会阻塞绘制。大多数副作用不需要布局 Effect，否则会放大主线程成本。</p>
<p>测量浮层位置时可使用布局 Effect，但要处理窗口尺寸变化和资源加载。服务端没有浏览器布局，相关逻辑应限定在客户端。不要在渲染中随意读写 DOM 或把 ref 当作绕开依赖检查的万能容器。</p>
<h2>补充参考</h2>
<ul>
<li><a href="https://react.dev/reference/react/useRef">useRef – React</a></li>
</ul>`};export{e as default};