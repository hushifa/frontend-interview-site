var e={answerHtml:`<p>React Native 使用 React 的组件、props、状态和 Hooks 思路，但渲染目标不是浏览器 DOM。React DOM 把组件描述落实为网页元素，React Native 则通过自己的渲染体系对接平台视图与原生能力。</p>
<p>因此，会写 React 可以复用很多组件思维，但不能把一个包含 div、CSS 文件和 document 查询的网页原样改成手机应用。</p>
<h3>组件模型相似，基础组件不同</h3>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-keyword">import</span> { useState } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;react&#x27;</span>;
<span class="hljs-keyword">import</span> { <span class="hljs-title class_">Pressable</span>, <span class="hljs-title class_">StyleSheet</span>, <span class="hljs-title class_">Text</span>, <span class="hljs-title class_">View</span> } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;react-native&#x27;</span>;

<span class="hljs-keyword">export</span> <span class="hljs-keyword">default</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">Counter</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">const</span> [count, setCount] = <span class="hljs-title function_">useState</span>(<span class="hljs-number">0</span>);
  <span class="hljs-keyword">return</span> (
    <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">View</span> <span class="hljs-attr">style</span>=<span class="hljs-string">{styles.container}</span>&gt;</span>
      <span class="hljs-tag">&lt;<span class="hljs-name">Text</span>&gt;</span>已点击 {count} 次<span class="hljs-tag">&lt;/<span class="hljs-name">Text</span>&gt;</span>
      <span class="hljs-tag">&lt;<span class="hljs-name">Pressable</span>
        <span class="hljs-attr">accessibilityRole</span>=<span class="hljs-string">&quot;button&quot;</span>
        <span class="hljs-attr">accessibilityLabel</span>=<span class="hljs-string">&quot;增加计数&quot;</span>
        <span class="hljs-attr">onPress</span>=<span class="hljs-string">{()</span> =&gt;</span> setCount((value) =&gt; value + 1)}
        style={styles.button}
      &gt;
        <span class="hljs-tag">&lt;<span class="hljs-name">Text</span>&gt;</span>增加<span class="hljs-tag">&lt;/<span class="hljs-name">Text</span>&gt;</span>
      <span class="hljs-tag">&lt;/<span class="hljs-name">Pressable</span>&gt;</span>
    <span class="hljs-tag">&lt;/<span class="hljs-name">View</span>&gt;</span></span>
  );
}

<span class="hljs-keyword">const</span> styles = <span class="hljs-title class_">StyleSheet</span>.<span class="hljs-title function_">create</span>({
  <span class="hljs-attr">container</span>: { <span class="hljs-attr">padding</span>: <span class="hljs-number">16</span>, <span class="hljs-attr">gap</span>: <span class="hljs-number">12</span> },
  <span class="hljs-attr">button</span>: { <span class="hljs-attr">padding</span>: <span class="hljs-number">12</span>, <span class="hljs-attr">backgroundColor</span>: <span class="hljs-string">&#x27;#dbeafe&#x27;</span> },
});
</code></pre></div>
<p>状态更新仍然触发 React 的组件更新，函数式 setState 仍适合依赖旧值的更新。但容器是 View，文字放在 Text 中，按压通过 Pressable 的 onPress 处理，不是浏览器 button 的 onClick。</p>
<p>此代码应在 React Native 工程中运行；只有 JSX 能被解析，并不代表浏览器能够渲染这些原生组件。</p>
<h3>样式看起来像 CSS，但不是完整浏览器 CSS</h3>
<p>React Native 通常使用 JavaScript 对象描述样式，属性名采用 camelCase，布局主要依靠 Yoga 等机制。很多尺寸数值表示平台无关的逻辑单位，不能直接当成物理像素。</p>
<p>Flexbox 概念相近，但默认值和支持范围有差别，例如常见默认主轴方向为 column。样式级联、选择器、文本继承和具体属性也不能按网页 CSS 全盘照搬。</p>
<p>需要根据窗口变化调整布局时，应使用 React Native 对应的尺寸能力，例如 useWindowDimensions，而不是读取 window.innerWidth。平台安全区域、键盘避让和字体缩放还需要额外处理。</p>
<h3>JavaScript 环境不等于浏览器环境</h3>
<p>React Native 提供一些熟悉的能力，例如 Promise 和网络请求，但不提供普通浏览器页面那套 document、DOM 元素和 localStorage。Web 库若内部依赖这些对象，即使能安装也不代表能运行。</p>
<p>共享代码更适合放在纯数据层：类型、校验、业务规则、接口契约和不绑定 DOM 的状态逻辑。存储、导航、文件、权限和平台交互应通过适配层处理，并检查每个依赖的原生平台支持。</p>
<p>React Native Web 可以为部分组件提供 Web 目标，但这是额外的跨平台实现路径，不表示原生应用内部本来就在运行 DOM。</p>
<h3>原生体验还涉及平台生命周期</h3>
<p>移动应用会进入后台、被系统回收、因权限拒绝无法访问相机，也可能通过深链接直接打开某个页面。导航栈、系统返回键、键盘和手势需要按平台设计，不是换一套标签就自然正确。</p>
<p>网络请求和订阅仍要处理取消与过期结果，应用恢复后也不能假设内存状态永远存在。推送、媒体和文件等能力常涉及原生配置与平台权限，单纯的 JavaScript 单元测试覆盖不到这些配置错误。</p>
<h3>性能与架构要按当前版本讨论</h3>
<p>新架构涉及 Fabric、TurboModules 和 JSI 等机制，不能继续把所有 React Native 调用概括为“通过旧式异步 JSON bridge 传输”。具体行为与项目版本、架构和依赖适配有关。</p>
<p>不经过旧桥也不等于计算免费。大段 JavaScript 工作仍可能影响事件处理和状态更新，原生布局、图片解码、消息传递与列表渲染也各有成本。需要结合 JavaScript 与原生侧工具定位，而不是只数 React render 次数。</p>
<p>大型列表通常评估 FlatList 等合适组件，动画和手势也要选择符合平台执行路径的方案。真实机上的低端设备、帧率和内存表现，比只在开发模拟器里观察更有参考价值。</p>
<p>选型应看目标平台、原生依赖、团队能力、升级维护和交互要求。高复用率值得追求，但稳定的适配边界与符合平台的体验，比把所有代码强行写成一份更重要。</p>`};export{e as default};