var e={answerHtml:`<p>事件委托把监听器绑定在共同祖先上，通过冒泡处理后代触发的事件。<code>event.target</code> 是事件目标，<code>event.currentTarget</code> 是正在执行该监听器的元素。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js">list.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&quot;click&quot;</span>, <span class="hljs-function"><span class="hljs-params">event</span> =&gt;</span> {
  <span class="hljs-keyword">if</span> (!(event.<span class="hljs-property">target</span> <span class="hljs-keyword">instanceof</span> <span class="hljs-title class_">Element</span>)) <span class="hljs-keyword">return</span>;
  <span class="hljs-keyword">const</span> button = event.<span class="hljs-property">target</span>.<span class="hljs-title function_">closest</span>(<span class="hljs-string">&quot;button[data-id]&quot;</span>);
  <span class="hljs-keyword">if</span> (button &amp;&amp; list.<span class="hljs-title function_">contains</span>(button)) {
    <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(button.<span class="hljs-property">dataset</span>.<span class="hljs-property">id</span>);
  }
});
</code></pre></div>
<p>使用 closest 可兼容点击按钮内部图标的情况。并非所有事件都会冒泡；Shadow DOM 的重定向、传播被阻止等情况也需要单独考虑。</p>`};export{e as default};