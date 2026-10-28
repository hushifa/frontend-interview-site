var e={answerHtml:`<h2>简答</h2>
<ul>
<li><code>&lt;button&gt;</code> 会被读屏识别为“按钮”，能被 Tab 聚焦，按 Enter 或空格都会触发 <code>click</code>。</li>
<li><code>div</code> 加 <code>onclick</code> 只有鼠标能用；要补 <code>role=&quot;button&quot;</code>、<code>tabindex=&quot;0&quot;</code>、键盘事件和禁用逻辑，才接近原生按钮。</li>
<li>在表单里，<code>&lt;button&gt;</code> 默认 <code>type=&quot;submit&quot;</code>，不需要提交的按钮要写 <code>type=&quot;button&quot;</code>。</li>
<li>改变页面地址用 <code>&lt;a href&gt;</code>，执行动作用 <code>&lt;button&gt;</code>。链接支持新标签打开和复制地址，按钮不支持。</li>
<li>按钮要有可访问名称；只有图标时用 <code>aria-label</code> 或视觉隐藏的文字。</li>
</ul>
<h2>div 模拟需要补什么</h2>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-tag">&lt;<span class="hljs-name">div</span> <span class="hljs-attr">role</span>=<span class="hljs-string">&quot;button&quot;</span> <span class="hljs-attr">tabindex</span>=<span class="hljs-string">&quot;0&quot;</span> <span class="hljs-attr">aria-disabled</span>=<span class="hljs-string">&quot;false&quot;</span>&gt;</span>保存<span class="hljs-tag">&lt;/<span class="hljs-name">div</span>&gt;</span>
</code></pre></div>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js">el.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;keydown&#x27;</span>, <span class="hljs-function">(<span class="hljs-params">event</span>) =&gt;</span> {
  <span class="hljs-keyword">if</span> (event.<span class="hljs-property">key</span> === <span class="hljs-string">&#x27;Enter&#x27;</span>) el.<span class="hljs-title function_">click</span>();
  <span class="hljs-keyword">if</span> (event.<span class="hljs-property">key</span> === <span class="hljs-string">&#x27; &#x27;</span>) event.<span class="hljs-title function_">preventDefault</span>();
});
el.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;keyup&#x27;</span>, <span class="hljs-function">(<span class="hljs-params">event</span>) =&gt;</span> {
  <span class="hljs-keyword">if</span> (event.<span class="hljs-property">key</span> === <span class="hljs-string">&#x27; &#x27;</span>) el.<span class="hljs-title function_">click</span>();
});
</code></pre></div>
<p>原生按钮在空格键松开时激活，Enter 按下时激活，空格还要阻止页面滚动。还要处理禁用时不响应、焦点样式、表单提交。这些 <code>&lt;button&gt;</code> 全部自带。</p>
<h2>样式</h2>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-class">.icon-button</span> {
  <span class="hljs-attribute">all</span>: unset;
  <span class="hljs-attribute">display</span>: inline-grid;
  <span class="hljs-attribute">place-items</span>: center;
  <span class="hljs-attribute">cursor</span>: pointer;
}

<span class="hljs-selector-class">.icon-button</span><span class="hljs-selector-pseudo">:focus-visible</span> {
  <span class="hljs-attribute">outline</span>: <span class="hljs-number">2px</span> solid currentColor;
  <span class="hljs-attribute">outline-offset</span>: <span class="hljs-number">2px</span>;
}
</code></pre></div>
<p><code>all: unset</code> 会清除默认的焦点轮廓，一定要用 <code>:focus-visible</code> 补回来。</p>
<h2>状态</h2>
<ul>
<li>切换按钮用 <code>aria-pressed=&quot;true&quot;</code>，例如“静音”。</li>
<li>展开控件用 <code>aria-expanded</code>，并用 <code>aria-controls</code> 指向被控制的区域。</li>
<li><code>disabled</code> 的按钮不能聚焦，读屏用户可能找不到它；需要让用户知道为什么不可用时，可以用 <code>aria-disabled=&quot;true&quot;</code> 保留焦点，并在点击处理里拦截。</li>
</ul>
<h2>常见追问</h2>
<ul>
<li>整张卡片都要能点怎么办？卡片标题用一个真正的链接，再用伪元素把链接的点击区域扩展到整张卡片，卡片里的其他按钮提高层级，避免嵌套交互元素。</li>
</ul>`};export{e as default};