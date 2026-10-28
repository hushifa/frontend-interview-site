var e={answerHtml:`<h2>简答</h2>
<ul>
<li>公共 API 不只是 props 类型，还包括默认值、事件触发时机、键盘操作、焦点行为、DOM 语义和 CSS 覆盖方式，改动任何一项都可能是破坏性变更。</li>
<li>有状态的组件同时支持受控（<code>value</code> + <code>onChange</code>）和非受控（<code>defaultValue</code>）模式，受控时以外部传入的值为准。</li>
<li>样式扩展通过 CSS 变量、<code>className</code>、<code>data-*</code> 状态属性等明确入口提供，不让使用方依赖内部 DOM 结构或哈希类名。</li>
<li>无障碍行为是组件的职责：Dialog 的焦点陷阱和恢复、Combobox 的键盘导航等，参考 WAI-ARIA APG 实现。</li>
<li>用语义化版本标识破坏性变更，先弃用并警告再删除，提供迁移指南。</li>
</ul>
<h2>用变体代替互相冲突的布尔值</h2>
<div class="not-prose code-block"><div class="code-language">TSX</div><pre><code class="hljs language-tsx"><span class="hljs-comment">// 不好：primary 和 danger 同时为 true 时是什么样？</span>
&lt;<span class="hljs-title class_">Button</span> primary danger small /&gt;

<span class="hljs-comment">// 好：每个维度只有一个取值</span>
<span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">Button</span> <span class="hljs-attr">variant</span>=<span class="hljs-string">&quot;danger&quot;</span> <span class="hljs-attr">size</span>=<span class="hljs-string">&quot;sm&quot;</span> /&gt;</span></span>
</code></pre></div>
<h2>受控与非受控</h2>
<div class="not-prose code-block"><div class="code-language">TSX</div><pre><code class="hljs language-tsx"><span class="hljs-keyword">function</span> useControllableState&lt;T&gt;(<span class="hljs-attr">value</span>: T | <span class="hljs-literal">undefined</span>, <span class="hljs-attr">defaultValue</span>: T, <span class="hljs-attr">onChange</span>?: <span class="hljs-function">(<span class="hljs-params"><span class="hljs-attr">v</span>: T</span>) =&gt;</span> <span class="hljs-built_in">void</span>) {
  <span class="hljs-keyword">const</span> [inner, setInner] = <span class="hljs-title function_">useState</span>(defaultValue);
  <span class="hljs-keyword">const</span> controlled = value !== <span class="hljs-literal">undefined</span>;
  <span class="hljs-keyword">const</span> current = controlled ? value : inner;
  <span class="hljs-keyword">const</span> <span class="hljs-title function_">set</span> = (<span class="hljs-params"><span class="hljs-attr">next</span>: T</span>) =&gt; {
    <span class="hljs-keyword">if</span> (!controlled) <span class="hljs-title function_">setInner</span>(next);
    onChange?.(next);
  };
  <span class="hljs-keyword">return</span> [current, set] <span class="hljs-keyword">as</span> <span class="hljs-keyword">const</span>;
}
</code></pre></div>
<p><code>Tabs</code>、<code>Select</code>、<code>Disclosure</code> 等组件都可以用这个模式，使用方既能简单使用，也能完全接管状态。</p>
<h2>稳定的样式入口</h2>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-class">.button</span> {
  <span class="hljs-attr">--button-bg</span>: <span class="hljs-number">#2563eb</span>;
  <span class="hljs-attr">--button-fg</span>: <span class="hljs-number">#fff</span>;
  <span class="hljs-attribute">color</span>: <span class="hljs-built_in">var</span>(--button-fg);
  <span class="hljs-attribute">background</span>: <span class="hljs-built_in">var</span>(--button-bg);
}

<span class="hljs-selector-class">.button</span><span class="hljs-selector-attr">[data-variant=<span class="hljs-string">&#x27;danger&#x27;</span>]</span> {
  <span class="hljs-attr">--button-bg</span>: <span class="hljs-number">#b42318</span>;
}

<span class="hljs-selector-class">.button</span><span class="hljs-selector-attr">[data-loading]</span> {
  <span class="hljs-attribute">cursor</span>: progress;
}
</code></pre></div>
<p>主题通过修改 CSS 变量实现。组件库的样式放进 <code>@layer</code>，业务样式不需要提高优先级就能覆盖。</p>
<h2>无障碍契约</h2>
<ul>
<li>优先使用原生元素：按钮用 <code>&lt;button&gt;</code>，链接用 <code>&lt;a&gt;</code>，开关可以用 <code>&lt;input type=&quot;checkbox&quot; role=&quot;switch&quot;&gt;</code>。</li>
<li>Dialog：打开时焦点移入，Tab 不离开对话框，Esc 关闭，关闭后焦点回到触发元素。</li>
<li>表单字段：label、帮助文字、错误信息通过 <code>id</code> 和 <code>aria-describedby</code> 关联。</li>
<li>状态不只用颜色表达。</li>
</ul>
<h2>测试与文档</h2>
<ul>
<li>文档写清何时使用、何时不用、键盘行为、受控用法和样式扩展方式。</li>
<li>Storybook 覆盖默认、禁用、加载、错误、长文本、窄屏、暗色、RTL 等状态。</li>
<li>组件测试按角色和名称查询元素、模拟用户操作；视觉回归测试检查样式变化；axe 检查结构问题。</li>
</ul>
<h2>发布</h2>
<ul>
<li>检查 <code>exports</code>、ESM 产物、类型声明、CSS 文件和 <code>sideEffects</code> 配置，确保按需导入有效。</li>
<li>React、Vue 等框架声明为 <code>peerDependencies</code>，避免打包两份运行时。</li>
<li>发布前用一个独立的示例项目，按真实包名安装并构建。</li>
</ul>
<h2>常见追问</h2>
<ul>
<li>组件库要不要包含业务逻辑？不要。权限判断、接口调用、业务校验留在应用中，组件库只提供交互和展示。</li>
<li>headless 组件库是什么？只提供状态和无障碍行为、不带样式的组件（如 Radix UI、Headless UI），样式完全由使用方决定。</li>
</ul>`};export{e as default};