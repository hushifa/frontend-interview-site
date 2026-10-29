var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>业务方用组件库，依赖的不只是 props 的类型。默认值、事件什么时候触发、键盘怎么操作、焦点去哪、渲染出什么 DOM、CSS 怎么覆盖，这些都是公共 API，改了任何一项都可能让业务方的页面出问题。</p>
<p>所以设计时有几件事要定清楚。有状态的组件要同时支持受控和非受控：受控是外面传 <code>value</code> 和 <code>onChange</code>，以外面为准；非受控是只给 <code>defaultValue</code>，组件自己管。样式要给明确的入口，比如 CSS 变量、<code>className</code>、<code>data-*</code> 状态属性，别让业务方去依赖内部 DOM 结构或者哈希类名。</p>
<p>无障碍是组件自己的责任。Dialog 的焦点困在弹窗里、关闭后回到原处，Combobox 的键盘导航，这些照着 WAI-ARIA APG 实现，业务方不用再操心。</p>
<p>最后是升级。用语义化版本标出破坏性变更，删东西之前先弃用、给警告，再提供迁移指南，业务方升级时心里才有数。</p>
</blockquote>
<h2>用变体代替互相冲突的布尔值</h2>
<p>先看一个 props 设计上的常见问题：</p>
<div class="not-prose code-block"><div class="code-language">TSX</div><pre><code class="hljs language-tsx"><span class="hljs-comment">// 不好：primary 和 danger 同时为 true 时是什么样？</span>
&lt;<span class="hljs-title class_">Button</span> primary danger small /&gt;

<span class="hljs-comment">// 好：每个维度只有一个取值</span>
<span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">Button</span> <span class="hljs-attr">variant</span>=<span class="hljs-string">&quot;danger&quot;</span> <span class="hljs-attr">size</span>=<span class="hljs-string">&quot;sm&quot;</span> /&gt;</span></span>
</code></pre></div>
<p>用一堆布尔值，业务方很容易写出组件作者没想过的组合，结果谁也说不清该长什么样。改成 <code>variant</code>、<code>size</code> 这样的枚举，每个维度只能选一个值，冲突从写法上就排除了。</p>
<h2>受控和非受控怎样同时支持</h2>
<p>受控的意思是，值存在组件外面，组件只负责显示和通知；非受控的意思是，值存在组件里面，外面只给一个初始值。下面这个 Hook 把两种模式合在一起：</p>
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
<p>判断依据是 <code>value</code> 有没有传。传了就是受控，组件显示外面的值，改动只通过 <code>onChange</code> 告诉外面，自己不存。没传就是非受控，组件用内部 state，同时也调用 <code>onChange</code>，方便外面监听。</p>
<p><code>Tabs</code>、<code>Select</code>、<code>Disclosure</code> 这类组件都能用这个模式。简单场景业务方什么都不传就能用，复杂场景又可以完全接管状态。</p>
<h2>怎样给样式留稳定的入口</h2>
<p>如果业务方为了改颜色，写了 <code>.button &gt; span:first-child</code> 这样的选择器，组件内部结构一调整，他的样式就失效了。所以组件库要主动提供不依赖结构的入口：</p>
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
<p>主题通过改 CSS 变量实现，状态通过 <code>data-*</code> 属性暴露，业务方用的都是约定好的名字。另外，把组件库的样式放进 <code>@layer</code>，业务样式不需要提高选择器优先级就能覆盖它。</p>
<h2>无障碍为什么算契约</h2>
<p>键盘和读屏用户依赖的是组件的行为，这部分一旦改坏，测试可能都发现不了。所以要把它当成和 props 一样的承诺来维护：</p>
<ul>
<li>优先用原生元素：按钮用 <code>&lt;button&gt;</code>，链接用 <code>&lt;a&gt;</code>，开关可以用 <code>&lt;input type=&quot;checkbox&quot; role=&quot;switch&quot;&gt;</code>。</li>
<li>Dialog 打开时焦点移进去，按 Tab 不会跑出对话框，Esc 关闭，关闭后焦点回到打开它的那个元素。</li>
<li>表单字段的 label、帮助文字、错误信息通过 <code>id</code> 和 <code>aria-describedby</code> 关联起来。</li>
<li>状态不能只靠颜色表达。</li>
</ul>
<h2>文档和测试覆盖什么</h2>
<p>文档要写清楚什么时候用、什么时候不用、键盘行为是什么、受控怎么用、样式怎么扩展。Storybook 里把默认、禁用、加载、错误、长文本、窄屏、暗色、RTL 这些状态都摆出来。</p>
<p>测试分几层。组件测试按角色和名称查找元素、模拟用户操作，这样测的是用户能感知的行为，而不是内部实现。视觉回归测试检查样式有没有意外变化，axe 检查结构上的无障碍问题。</p>
<h2>发布前检查什么</h2>
<p>包能不能被正确使用，也是 API 的一部分：</p>
<ul>
<li>检查 <code>exports</code>、ESM 产物、类型声明、CSS 文件和 <code>sideEffects</code> 配置，保证按需导入真的有效。</li>
<li>React、Vue 这些框架声明为 <code>peerDependencies</code>，避免业务方打包进两份运行时。</li>
<li>发布前用一个独立的示例项目，按真实包名安装并构建一遍。</li>
</ul>
<h2>常见追问</h2>
<p><strong>组件库要不要包含业务逻辑？</strong></p>
<blockquote>
<p>不要。权限判断、接口调用、业务校验留在应用里，组件库只管交互和展示。否则组件库会跟某个业务绑死，别的团队没法用。</p>
</blockquote>
<p><strong>headless 组件库是什么？</strong></p>
<blockquote>
<p>就是只提供状态管理和无障碍行为、不带任何样式的组件，比如 Radix UI、Headless UI。样式完全由使用方决定，适合有自己设计规范的团队。</p>
</blockquote>`};export{e as default};