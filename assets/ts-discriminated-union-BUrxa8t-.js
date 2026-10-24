var e={answerHtml:`<p>多个独立布尔值容易组合出“正在加载但又成功又失败”的无效状态。可辨识联合用一个字面量字段区分分支，使每个分支只包含自身需要的数据。</p>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">type</span> <span class="hljs-title class_">State</span>&lt;T&gt; =
  | { <span class="hljs-attr">status</span>: <span class="hljs-string">&quot;loading&quot;</span> }
  | { <span class="hljs-attr">status</span>: <span class="hljs-string">&quot;success&quot;</span>; <span class="hljs-attr">data</span>: T }
  | { <span class="hljs-attr">status</span>: <span class="hljs-string">&quot;error&quot;</span>; <span class="hljs-attr">error</span>: <span class="hljs-title class_">Error</span> };

<span class="hljs-keyword">function</span> <span class="hljs-title function_">read</span>(<span class="hljs-params"><span class="hljs-attr">state</span>: <span class="hljs-title class_">State</span>&lt;<span class="hljs-built_in">string</span>&gt;</span>) {
  <span class="hljs-keyword">if</span> (state.<span class="hljs-property">status</span> === <span class="hljs-string">&quot;success&quot;</span>) {
    <span class="hljs-keyword">return</span> state.<span class="hljs-property">data</span>;
  }
}
</code></pre></div>
<p>在 <code>switch</code> 中处理所有分支，并让默认分支的变量赋给 <code>never</code>，可在新增状态却漏写处理时得到类型错误。</p>`};export{e as default};