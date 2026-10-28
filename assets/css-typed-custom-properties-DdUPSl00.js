var e={answerHtml:`<h2>简答</h2>
<ul>
<li>未注册的自定义属性按一串 token 保存，浏览器不知道它是百分比还是颜色，所以 <code>transition: --x</code> 会直接跳到终点。</li>
<li><code>@property</code> 声明 <code>syntax</code>、<code>inherits</code>、<code>initial-value</code>，让浏览器按类型计算和插值，属性才能平滑动画。</li>
<li>不符合 <code>syntax</code> 的值在计算时无效，回退到继承值或初始值；但语法校验不等于业务范围校验。</li>
<li>注册是全局名字约定，组件私有属性要加前缀；不支持时要退回普通自定义属性，动画只当增强。</li>
</ul>
<h2>三个描述决定属性的语义</h2>
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
<li><code>syntax</code>：允许的值类型，如 <code>&lt;length&gt;</code>、<code>&lt;color&gt;</code>、<code>&lt;number&gt;</code>，各自有不同的插值规则；</li>
<li><code>inherits</code>：<code>false</code> 时子元素不继承，拿到的是 <code>initial-value</code>；</li>
<li><code>initial-value</code>：除 <code>syntax: &#x27;*&#x27;</code> 外必须提供，且必须是与上下文无关的计算值（例如 <code>0px</code> 可以，<code>1em</code> 不行）。</li>
</ul>
<p>注册后把 <code>--progress</code> 设成 <code>50px</code> 不符合语法，会回退到初始或继承结果；未注册的属性则会原样保存这个字符串。</p>
<h2>inherits 怎样选</h2>
<p>组件内部的进度、角度、缩放等局部状态适合 <code>inherits: false</code>，避免父级同名变量污染；主题色、字体、密度等 token 需要往下传，应保持 <code>true</code>。不同库注册同一个名字会共享同一条注册规则，所以私有属性要用稳定前缀。</p>
<h2>语法匹配不等于业务校验</h2>
<p><code>&lt;length&gt;</code> 能排除明显不是长度的值，但不会检查“不能为负”“不超过 2rem”这类业务约束，这些仍要在组件 API 或运行时校验。变量展开后不满足目标属性语法时，整条声明在计算时失效，复杂的多层 fallback 要在开发者工具里确认结果。</p>
<h2>颜色动画与可访问性</h2>
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
<p>颜色插值空间要按目标浏览器验证。动画只改视觉，用颜色表示错误时仍要配合文字、图标或 <code>aria-invalid</code>。</p>
<h2>JavaScript 注册</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">if</span> (<span class="hljs-string">&#x27;registerProperty&#x27;</span> <span class="hljs-keyword">in</span> <span class="hljs-variable constant_">CSS</span>) {
  <span class="hljs-variable constant_">CSS</span>.<span class="hljs-title function_">registerProperty</span>({
    <span class="hljs-attr">name</span>: <span class="hljs-string">&#x27;--progress&#x27;</span>,
    <span class="hljs-attr">syntax</span>: <span class="hljs-string">&#x27;&lt;percentage&gt;&#x27;</span>,
    <span class="hljs-attr">inherits</span>: <span class="hljs-literal">false</span>,
    <span class="hljs-attr">initialValue</span>: <span class="hljs-string">&#x27;0%&#x27;</span>,
  });
}
</code></pre></div>
<p>同名属性重复调用 <code>CSS.registerProperty()</code> 会抛出 <code>InvalidModificationError</code>，组件库要保证只执行一次，并考虑热更新和多副本加载。静态的公共属性更适合写在 CSS 里，便于阅读和审查。</p>
<h2>兼容与性能</h2>
<p>支持范围以 MDN 兼容表为准；不支持时属性仍按普通自定义属性生效，只是没有类型化动画和非继承行为。注册本身很少是瓶颈，关键是它控制什么：每帧改变 <code>&lt;length&gt;</code> 会触发布局，比只改 transform 或 opacity 成本高，应在 Performance 面板实测。</p>`};export{e as default};