var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p><code>&lt;button&gt;</code> 免费带了一整套行为：读屏软件会读出“按钮”，按 Tab 能聚焦到它，按 Enter 或空格都会触发 <code>click</code>，还有禁用状态。</p>
<p>一个 <code>div</code> 加 <code>onclick</code> 只有鼠标能用。要补上 <code>role=&quot;button&quot;</code>、<code>tabindex=&quot;0&quot;</code>、键盘事件和禁用逻辑，才勉强接近原生按钮，而且很容易漏。</p>
<p>选元素的规则很简单：改变页面地址用 <code>&lt;a href&gt;</code>，执行一个动作用 <code>&lt;button&gt;</code>。链接支持在新标签页打开、复制地址，按钮不支持。</p>
<p>用 <code>&lt;button&gt;</code> 也有两点要注意。在表单里它默认是 <code>type=&quot;submit&quot;</code>，不需要提交的按钮要写 <code>type=&quot;button&quot;</code>。只有图标的按钮要有可访问名称，用 <code>aria-label</code> 或者视觉上隐藏的文字。</p>
</blockquote>
<h2>用 div 模拟，要补多少东西</h2>
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
<p><code>role=&quot;button&quot;</code> 让读屏认出它是按钮，<code>tabindex=&quot;0&quot;</code> 让它能被 Tab 聚焦。可是键盘行为还得手写。</p>
<p>为什么 Enter 和空格要分开处理？因为原生按钮就是这样：Enter 在按下时触发，空格在松开时触发。而且空格默认会让页面往下滚，按下时要阻止。</p>
<p>这还没完，禁用时不响应、焦点样式、表单提交，都要自己处理。这些 <code>&lt;button&gt;</code> 全部自带。</p>
<h2>想要自定义样式怎么办</h2>
<p>不想要按钮的默认外观，不用换成 <code>div</code>，把样式清掉就行：</p>
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
<p>要注意 <code>all: unset</code> 会把默认的焦点轮廓也清掉。键盘用户就看不到焦点在哪里了，所以一定要用 <code>:focus-visible</code> 补回来。</p>
<h2>按钮的状态怎么告诉读屏</h2>
<p>切换型的按钮，比如“静音”，用 <code>aria-pressed=&quot;true&quot;</code> 表示当前是按下的。</p>
<p>展开收起的控件用 <code>aria-expanded</code>，再用 <code>aria-controls</code> 指向被控制的区域。</p>
<p>禁用要多想一步。<code>disabled</code> 的按钮不能聚焦，读屏用户用 Tab 可能根本找不到它，也就不知道为什么不能提交。需要让用户知道原因时，可以改用 <code>aria-disabled=&quot;true&quot;</code>，按钮保留焦点，在点击处理里把操作拦下来。</p>
<h2>常见追问</h2>
<p><strong>整张卡片都要能点，怎么做？</strong></p>
<blockquote>
<p>不要把整张卡片包成一个链接，也不要嵌套交互元素。卡片标题用一个真正的链接，再用伪元素把这个链接的点击区域扩大到整张卡片。卡片里的其他按钮提高层级，让它们盖在伪元素上面，还能单独点击。</p>
</blockquote>`};export{e as default};