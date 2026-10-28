var e={answerHtml:`<h2>简答</h2>
<ul>
<li>事件委托是在共同的祖先上注册一个监听器，事件从子元素冒泡上来时统一处理。</li>
<li><code>event.target</code> 是最初触发事件的元素，<code>event.currentTarget</code> 是当前正在执行监听器的元素。</li>
<li>用 <code>target.closest(selector)</code> 找到真正关心的元素，并确认它在委托容器内。</li>
<li>不冒泡的事件（如 <code>focus</code>、<code>mouseenter</code>）不能直接委托，可改用 <code>focusin</code>、<code>pointerover</code> 或捕获阶段。</li>
</ul>
<h2>为什么用委托</h2>
<ul>
<li>列表有成百上千项时，只注册一个监听器，内存和注册成本更低。</li>
<li>动态新增的子元素不需要再单独绑定。</li>
<li>移除子元素时不用逐个解绑。</li>
</ul>
<h2>示例</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> list = <span class="hljs-variable language_">document</span>.<span class="hljs-title function_">querySelector</span>(<span class="hljs-string">&#x27;#todo-list&#x27;</span>);

list.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;click&#x27;</span>, <span class="hljs-function">(<span class="hljs-params">event</span>) =&gt;</span> {
  <span class="hljs-keyword">const</span> button = event.<span class="hljs-property">target</span>.<span class="hljs-title function_">closest</span>(<span class="hljs-string">&#x27;button[data-action]&#x27;</span>);
  <span class="hljs-keyword">if</span> (!button || !list.<span class="hljs-title function_">contains</span>(button)) <span class="hljs-keyword">return</span>;

  <span class="hljs-keyword">const</span> item = button.<span class="hljs-title function_">closest</span>(<span class="hljs-string">&#x27;li&#x27;</span>);
  <span class="hljs-keyword">if</span> (button.<span class="hljs-property">dataset</span>.<span class="hljs-property">action</span> === <span class="hljs-string">&#x27;remove&#x27;</span>) item.<span class="hljs-title function_">remove</span>();
});
</code></pre></div>
<p>点击按钮里的图标时，<code>target</code> 是图标元素，所以要用 <code>closest()</code> 向上找按钮。<code>list.contains(button)</code> 防止匹配到容器外层的同名元素。</p>
<h2>target 和 currentTarget</h2>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-tag">&lt;<span class="hljs-name">ul</span> <span class="hljs-attr">id</span>=<span class="hljs-string">&quot;list&quot;</span>&gt;</span><span class="hljs-tag">&lt;<span class="hljs-name">li</span>&gt;</span><span class="hljs-tag">&lt;<span class="hljs-name">span</span>&gt;</span>文字<span class="hljs-tag">&lt;/<span class="hljs-name">span</span>&gt;</span><span class="hljs-tag">&lt;/<span class="hljs-name">li</span>&gt;</span><span class="hljs-tag">&lt;/<span class="hljs-name">ul</span>&gt;</span>
</code></pre></div>
<p>点击 <code>span</code>，监听器挂在 <code>ul</code> 上：</p>
<ul>
<li><code>event.target</code> 是 <code>span</code>。</li>
<li><code>event.currentTarget</code> 是 <code>ul</code>，与监听器里的 <code>this</code>（普通函数）相同。</li>
</ul>
<p><code>currentTarget</code> 只在事件分发期间有值，异步回调里读取会得到 <code>null</code>，需要的话先保存到变量里。</p>
<h2>注意事项</h2>
<ul>
<li>在中间层调用 <code>stopPropagation()</code> 会让委托监听器收不到事件。</li>
<li>委托到 <code>document</code> 上会让每次点击都经过判断逻辑，范围应尽量小。</li>
<li>键盘可操作性来自真实的 <code>button</code> 或 <code>a</code> 元素，委托只负责处理逻辑。</li>
</ul>`};export{e as default};