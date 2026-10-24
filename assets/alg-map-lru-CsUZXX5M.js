var e={answerHtml:`<p>LRU 在容量不足时淘汰最近最少使用的条目。Map 保留键的插入顺序，可以在命中或更新时先删除再插入，使最新使用的键位于末尾，最早的键作为淘汰候选。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">class</span> <span class="hljs-title class_">LRUCache</span> {
  <span class="hljs-title function_">constructor</span>(<span class="hljs-params">capacity</span>) {
    <span class="hljs-keyword">if</span> (!<span class="hljs-title class_">Number</span>.<span class="hljs-title function_">isInteger</span>(capacity) || capacity &lt; <span class="hljs-number">1</span>) {
      <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">RangeError</span>(<span class="hljs-string">&#x27;容量必须为正整数&#x27;</span>);
    }
    <span class="hljs-variable language_">this</span>.<span class="hljs-property">capacity</span> = capacity;
    <span class="hljs-variable language_">this</span>.<span class="hljs-property">items</span> = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Map</span>();
  }
  <span class="hljs-title function_">get</span>(<span class="hljs-params">key</span>) {
    <span class="hljs-keyword">if</span> (!<span class="hljs-variable language_">this</span>.<span class="hljs-property">items</span>.<span class="hljs-title function_">has</span>(key)) <span class="hljs-keyword">return</span> <span class="hljs-literal">undefined</span>;
    <span class="hljs-keyword">const</span> value = <span class="hljs-variable language_">this</span>.<span class="hljs-property">items</span>.<span class="hljs-title function_">get</span>(key);
    <span class="hljs-variable language_">this</span>.<span class="hljs-property">items</span>.<span class="hljs-title function_">delete</span>(key);
    <span class="hljs-variable language_">this</span>.<span class="hljs-property">items</span>.<span class="hljs-title function_">set</span>(key, value);
    <span class="hljs-keyword">return</span> value;
  }
  <span class="hljs-title function_">set</span>(<span class="hljs-params">key, value</span>) {
    <span class="hljs-variable language_">this</span>.<span class="hljs-property">items</span>.<span class="hljs-title function_">delete</span>(key);
    <span class="hljs-variable language_">this</span>.<span class="hljs-property">items</span>.<span class="hljs-title function_">set</span>(key, value);
    <span class="hljs-keyword">if</span> (<span class="hljs-variable language_">this</span>.<span class="hljs-property">items</span>.<span class="hljs-property">size</span> &gt; <span class="hljs-variable language_">this</span>.<span class="hljs-property">capacity</span>) {
      <span class="hljs-variable language_">this</span>.<span class="hljs-property">items</span>.<span class="hljs-title function_">delete</span>(<span class="hljs-variable language_">this</span>.<span class="hljs-property">items</span>.<span class="hljs-title function_">keys</span>().<span class="hljs-title function_">next</span>().<span class="hljs-property">value</span>);
    }
  }
}
</code></pre></div>
<p>这是教学实现，不包含过期时间、并发请求合并或内存字节上限。get 返回 undefined 无法区分“未命中”和“缓存的值就是 undefined”，业务需要时应增加 has 或显式结果结构。</p>
<p>手写题先明确输入约束、输出契约、重复值、空输入和异常行为，再选择数据结构。实现之后用边界样例验证，不要只运行一个正常输入；异步题还要验证顺序、取消和并发上限。</p>
<p>复杂度应同时说明时间、空间和额外资源。教学实现适合解释原理，生产代码还需要考虑可读性、监控、错误处理和已有标准库能力。</p>
<p>实际使用手写实现前，先确认数据量、调用频率和取消要求。小数据的清晰实现可能比复杂优化更合适；数据规模上来后，再根据测量结果决定是否使用标准库、缓存或专门的数据结构。</p>`};export{e as default};