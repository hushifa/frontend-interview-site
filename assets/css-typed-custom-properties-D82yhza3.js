var e={answerHtml:`<p>CSS 自定义属性常被当成“可以保存任何值的变量”：</p>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-pseudo">:root</span> {
  <span class="hljs-attr">--progress</span>: <span class="hljs-number">0%</span>;
}

<span class="hljs-selector-class">.bar</span> {
  <span class="hljs-attribute">width</span>: <span class="hljs-built_in">var</span>(--progress);
  <span class="hljs-attribute">transition</span>: --progress <span class="hljs-number">300ms</span> ease;
}
</code></pre></div>
<p>如果脚本把 <code>--progress</code> 从 <code>0%</code> 改成 <code>100%</code>，很多人期待它像普通长度一样平滑变化。但没有注册的自定义属性通常按一串 token 保存，浏览器不知道它是百分比、颜色还是其他语法，无法可靠地对两个值做类型化插值。结果可能是直接跳到终点，或者 transition 根本没有产生期望的动画。</p>
<p><code>@property</code> 为自定义属性声明语法、是否继承和初始值，让浏览器能在计算值阶段按指定类型处理它。它不是 JavaScript 变量声明，也不是给所有 CSS 值增加运行时类型检查的万能机制。</p>
<h2>三个描述决定属性的语义</h2>
<p>一个注册属性至少需要 <code>syntax</code>、<code>inherits</code> 和 <code>initial-value</code>：</p>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-keyword">@property</span> --progress {
  syntax: <span class="hljs-string">&#x27;&lt;percentage&gt;&#x27;</span>;
  inherits: false;
  initial-value: <span class="hljs-number">0%</span>;
}

<span class="hljs-selector-class">.bar</span> {
  <span class="hljs-attribute">width</span>: <span class="hljs-built_in">var</span>(--progress);
  <span class="hljs-attribute">transition</span>: --progress <span class="hljs-number">300ms</span> ease;
}

<span class="hljs-selector-class">.bar</span><span class="hljs-selector-attr">[data-progress=<span class="hljs-string">&#x27;done&#x27;</span>]</span> {
  <span class="hljs-attr">--progress</span>: <span class="hljs-number">100%</span>;
}
</code></pre></div>
<ul>
<li><code>syntax</code> 说明允许的值类型。<code>&lt;percentage&gt;</code> 只接受百分比；<code>&lt;length&gt;</code>、<code>&lt;color&gt;</code>、<code>&lt;number&gt;</code> 等类型有不同的计算和插值规则。</li>
<li><code>inherits: false</code> 表示子元素不会自动继承父元素的自定义属性；<code>true</code> 则与普通自定义属性一样参与继承。</li>
<li><code>initial-value</code> 是属性没有有效指定值时使用的初始值。某些语法要求提供可 computationally independent（可计算独立）的初始值，不能随意使用依赖上下文的表达式。</li>
</ul>
<p>注册后，<code>--progress</code> 的动画有了明确的百分比空间。若把值设成 <code>50px</code>，它不符合语法，声明会成为无效值并回退到适用的初始或继承结果；这和普通未注册属性把任意字符串保存下来不同。</p>
<h2><code>inherits</code> 改变的不只是写法</h2>
<p>普通自定义属性默认继承：</p>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-class">.card</span> {
  <span class="hljs-attr">--accent</span>: tomato;
}

<span class="hljs-selector-class">.card</span> <span class="hljs-selector-tag">button</span> {
  <span class="hljs-attribute">color</span>: <span class="hljs-built_in">var</span>(--accent);
}
</code></pre></div>
<p>如果将 <code>--accent</code> 注册为 <code>inherits: false</code>，<code>button</code> 不会自动得到 <code>.card</code> 的值，而会使用注册时的 <code>initial-value</code>，除非在按钮自身或更合适的组件边界重新设置。这对组件内部的进度、角度和局部动画状态很有用，可以避免父级主题变量意外污染内部状态；但主题色、字体和密度 token 通常需要继承，不能为了“类型安全”全部设为 false。</p>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-keyword">@property</span> --card-scale {
  syntax: <span class="hljs-string">&#x27;&lt;number&gt;&#x27;</span>;
  inherits: false;
  initial-value: <span class="hljs-number">1</span>;
}

<span class="hljs-keyword">@property</span> --theme-accent {
  syntax: <span class="hljs-string">&#x27;&lt;color&gt;&#x27;</span>;
  inherits: true;
  initial-value: <span class="hljs-number">#2563eb</span>;
}
</code></pre></div>
<p>属性注册是全局 CSS 环境中的名字约定。不同组件库如果注册了同一个 <code>--progress</code>，它们共享同一个语义和注册规则，可能产生冲突。因此应给组件私有属性使用稳定前缀，并在设计系统中记录哪些 token 是公共主题变量、哪些是组件内部状态。</p>
<h2>语法匹配不等于业务值校验</h2>
<p><code>syntax: &#x27;&lt;length&gt;&#x27;</code> 能排除明显不是长度的 CSS 值，但不能验证“这个宽度是否适合当前卡片”或“这个颜色是否满足对比度”。<code>var()</code> 的 fallback 也要理解清楚：</p>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-keyword">@property</span> --gap {
  syntax: <span class="hljs-string">&#x27;&lt;length&gt;&#x27;</span>;
  inherits: false;
  initial-value: <span class="hljs-number">0px</span>;
}

<span class="hljs-selector-class">.grid</span> {
  <span class="hljs-attribute">gap</span>: <span class="hljs-built_in">var</span>(--gap, <span class="hljs-number">1rem</span>);
}
</code></pre></div>
<p>当 <code>--gap</code> 没有值或值无效时，<code>var()</code> 的备用值可能被采用；但如果属性已经有一个语法有效、却不符合业务约束的值，CSS 不会替你做范围检查。需要限制 <code>0</code> 到 <code>2rem</code>、禁止负值或根据用户权限决定上限时，仍要在组件 API、TypeScript 或运行时逻辑中验证。</p>
<p>此外，注册自定义属性不会让 <code>var(--x)</code> 在所有属性中都自动安全。最终使用位置仍要满足目标属性的语法，变量展开后的无效值可能使整条声明失效。复杂 fallback 和多层变量组合应在真实主题、浏览器开发者工具和组件测试中检查。</p>
<h2>颜色和长度的动画要考虑插值空间</h2>
<p>注册后，颜色可以参与 CSS 动画，但动画具体使用的颜色空间和浏览器实现仍应结合 CSS Color 规范和目标浏览器验证。不要仅因为声明写了 <code>&lt;color&gt;</code> 就认为过渡符合品牌设计要求；设计系统可能需要明确使用 <code>color-mix()</code> 或其他颜色空间控制效果。</p>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-keyword">@property</span> --card-color {
  syntax: <span class="hljs-string">&#x27;&lt;color&gt;&#x27;</span>;
  inherits: false;
  initial-value: transparent;
}

<span class="hljs-selector-class">.card</span> {
  <span class="hljs-attribute">background</span>: <span class="hljs-built_in">var</span>(--card-color);
  <span class="hljs-attribute">transition</span>: --card-color <span class="hljs-number">200ms</span> ease;
}

<span class="hljs-selector-class">.card</span><span class="hljs-selector-attr">[data-active=<span class="hljs-string">&#x27;true&#x27;</span>]</span> {
  <span class="hljs-attr">--card-color</span>: <span class="hljs-built_in">rgb</span>(<span class="hljs-number">219</span> <span class="hljs-number">234</span> <span class="hljs-number">254</span>);
}
</code></pre></div>
<p>动画只改变视觉值，不会自动改变内容状态、可访问名称或点击行为。比如用颜色表示错误时，仍需配合文字、图标、<code>aria-invalid</code> 或其他语义；用自定义属性控制 <code>display</code> 也不能绕过焦点管理和 DOM 生命周期。</p>
<h2>与 JavaScript 注册 API 的关系</h2>
<p><code>CSS.registerProperty()</code> 可以在脚本中完成类似注册：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">if</span> (<span class="hljs-string">&#x27;registerProperty&#x27;</span> <span class="hljs-keyword">in</span> <span class="hljs-variable constant_">CSS</span>) {
  <span class="hljs-variable constant_">CSS</span>.<span class="hljs-title function_">registerProperty</span>({
    <span class="hljs-attr">name</span>: <span class="hljs-string">&#x27;--progress&#x27;</span>,
    <span class="hljs-attr">syntax</span>: <span class="hljs-string">&#x27;&lt;percentage&gt;&#x27;</span>,
    <span class="hljs-attr">inherits</span>: <span class="hljs-literal">false</span>,
    <span class="hljs-attr">initialValue</span>: <span class="hljs-string">&#x27;0%&#x27;</span>,
  });
}
</code></pre></div>
<p>同一个属性不能先在 CSS 中注册、又在 JavaScript 中重复注册；重复注册通常会抛出错误。组件库如果选择脚本注册，需要保证只执行一次，并在 SSR、热更新和多个副本加载时避免重复调用。更适合静态设计系统的公共属性通常写在 CSS 中，便于构建工具、审查工具和源码阅读者发现；只有注册值依赖运行时模块或确实需要脚本控制时才考虑 API。</p>
<p>脚本注册也不是“检测到不支持就可以忽略所有逻辑”。不支持 <code>CSS.registerProperty</code> 的浏览器仍应使用普通自定义属性的最终值，让组件可用；只把平滑插值作为增强能力，并在 CSS 或脚本中提供静态回退。</p>
<h2>兼容性、主题和性能边界</h2>
<p><code>@property</code> 和注册 API 属于较新的 CSS Houdini 能力，目标浏览器的支持情况需要查 MDN 兼容性数据并实际测试。未注册属性在不支持的环境中仍可作为普通自定义属性使用，但依赖类型化动画、无效值回退或非继承行为的效果可能不同。组件不能把这些增强特性当成唯一的布局或业务逻辑来源。</p>
<p>注册大量属性本身通常不是性能瓶颈，真正需要关注的是它们控制了什么：如果每帧改变会触发布局的 <code>&lt;length&gt;</code>，可能比只改变 transform 或 opacity 成本更高；如果属性值被多个大型子树继承，主题切换会扩大样式重新计算范围。应通过 Performance 面板测量实际样式、布局和绘制成本，而不是因为使用了 Houdini 就默认更快。</p>
<p>面试中完整的回答应包含三个层次：普通自定义属性是可继承的 token，不保证类型化插值；<code>@property</code> 通过 syntax、inherits、initial-value 建立明确语义；即使完成注册，组件仍要处理回退、命名冲突、兼容性、无障碍表达和动画属性的性能。它适合把可复用的 CSS 状态变成可计算、可动画的值，但不能替代组件状态模型和业务校验。</p>`};export{e as default};