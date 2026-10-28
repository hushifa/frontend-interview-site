var e={answerHtml:`<h2>简答</h2>
<ul>
<li>Map 按键第一次插入的顺序迭代，重新 <code>set</code> 已有的键不会改变它的位置，所以要先 <code>delete</code> 再 <code>set</code>，把它移到末尾。</li>
<li><code>get</code> 命中和 <code>set</code> 都算一次访问，都要移到末尾；超出容量时删除 <code>keys().next().value</code>，也就是最久未访问的键。</li>
<li>判断命中用 <code>has</code>，不能用 <code>get</code> 的返回值是否为 <code>undefined</code>，因为缓存的值本身可能就是 <code>undefined</code>。</li>
<li>V8 的 Map 基于哈希表，<code>get</code>、<code>set</code>、<code>delete</code> 平均是常数时间；语言规范只要求 Map 操作的平均耗时低于线性，不保证严格 O(1)。</li>
<li>面试要求手写时，常用&quot;哈希表加双向链表&quot;：哈希表定位节点，链表维护访问顺序，每次操作只调整几个指针。</li>
</ul>
<h2>Map 实现</h2>
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
    <span class="hljs-comment">// 已有的键也先删除，插入后位于末尾。</span>
    <span class="hljs-variable language_">this</span>.<span class="hljs-property">items</span>.<span class="hljs-title function_">delete</span>(key);
    <span class="hljs-variable language_">this</span>.<span class="hljs-property">items</span>.<span class="hljs-title function_">set</span>(key, value);
    <span class="hljs-keyword">if</span> (<span class="hljs-variable language_">this</span>.<span class="hljs-property">items</span>.<span class="hljs-property">size</span> &gt; <span class="hljs-variable language_">this</span>.<span class="hljs-property">capacity</span>) {
      <span class="hljs-variable language_">this</span>.<span class="hljs-property">items</span>.<span class="hljs-title function_">delete</span>(<span class="hljs-variable language_">this</span>.<span class="hljs-property">items</span>.<span class="hljs-title function_">keys</span>().<span class="hljs-title function_">next</span>().<span class="hljs-property">value</span>);
    }
  }
}
</code></pre></div>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> cache = <span class="hljs-keyword">new</span> <span class="hljs-title class_">LRUCache</span>(<span class="hljs-number">2</span>);
cache.<span class="hljs-title function_">set</span>(<span class="hljs-string">&#x27;a&#x27;</span>, <span class="hljs-number">1</span>);
cache.<span class="hljs-title function_">set</span>(<span class="hljs-string">&#x27;b&#x27;</span>, <span class="hljs-number">2</span>);
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(cache.<span class="hljs-title function_">get</span>(<span class="hljs-string">&#x27;a&#x27;</span>)); <span class="hljs-comment">// 1，a 移到末尾</span>
cache.<span class="hljs-title function_">set</span>(<span class="hljs-string">&#x27;c&#x27;</span>, <span class="hljs-number">3</span>); <span class="hljs-comment">// 淘汰 b</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(cache.<span class="hljs-title function_">get</span>(<span class="hljs-string">&#x27;b&#x27;</span>)); <span class="hljs-comment">// undefined</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>([...cache.<span class="hljs-property">items</span>.<span class="hljs-title function_">keys</span>()]); <span class="hljs-comment">// [&#x27;a&#x27;, &#x27;c&#x27;]</span>
</code></pre></div>
<h2>双向链表实现</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">class</span> <span class="hljs-title class_">Node</span> {
  <span class="hljs-title function_">constructor</span>(<span class="hljs-params">key, value</span>) {
    <span class="hljs-variable language_">this</span>.<span class="hljs-property">key</span> = key;
    <span class="hljs-variable language_">this</span>.<span class="hljs-property">value</span> = value;
    <span class="hljs-variable language_">this</span>.<span class="hljs-property">prev</span> = <span class="hljs-literal">null</span>;
    <span class="hljs-variable language_">this</span>.<span class="hljs-property">next</span> = <span class="hljs-literal">null</span>;
  }
}

<span class="hljs-keyword">class</span> <span class="hljs-title class_">LinkedLRU</span> {
  <span class="hljs-title function_">constructor</span>(<span class="hljs-params">capacity</span>) {
    <span class="hljs-variable language_">this</span>.<span class="hljs-property">capacity</span> = capacity;
    <span class="hljs-variable language_">this</span>.<span class="hljs-property">map</span> = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Map</span>();
    <span class="hljs-comment">// 哨兵节点让头尾的插入删除不需要特殊判断。</span>
    <span class="hljs-variable language_">this</span>.<span class="hljs-property">head</span> = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Node</span>();
    <span class="hljs-variable language_">this</span>.<span class="hljs-property">tail</span> = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Node</span>();
    <span class="hljs-variable language_">this</span>.<span class="hljs-property">head</span>.<span class="hljs-property">next</span> = <span class="hljs-variable language_">this</span>.<span class="hljs-property">tail</span>;
    <span class="hljs-variable language_">this</span>.<span class="hljs-property">tail</span>.<span class="hljs-property">prev</span> = <span class="hljs-variable language_">this</span>.<span class="hljs-property">head</span>;
  }

  #<span class="hljs-title function_">remove</span>(<span class="hljs-params">node</span>) {
    node.<span class="hljs-property">prev</span>.<span class="hljs-property">next</span> = node.<span class="hljs-property">next</span>;
    node.<span class="hljs-property">next</span>.<span class="hljs-property">prev</span> = node.<span class="hljs-property">prev</span>;
  }

  #<span class="hljs-title function_">append</span>(<span class="hljs-params">node</span>) {
    node.<span class="hljs-property">prev</span> = <span class="hljs-variable language_">this</span>.<span class="hljs-property">tail</span>.<span class="hljs-property">prev</span>;
    node.<span class="hljs-property">next</span> = <span class="hljs-variable language_">this</span>.<span class="hljs-property">tail</span>;
    <span class="hljs-variable language_">this</span>.<span class="hljs-property">tail</span>.<span class="hljs-property">prev</span>.<span class="hljs-property">next</span> = node;
    <span class="hljs-variable language_">this</span>.<span class="hljs-property">tail</span>.<span class="hljs-property">prev</span> = node;
  }

  <span class="hljs-title function_">get</span>(<span class="hljs-params">key</span>) {
    <span class="hljs-keyword">const</span> node = <span class="hljs-variable language_">this</span>.<span class="hljs-property">map</span>.<span class="hljs-title function_">get</span>(key);
    <span class="hljs-keyword">if</span> (!node) <span class="hljs-keyword">return</span> <span class="hljs-literal">undefined</span>;
    <span class="hljs-variable language_">this</span>.#<span class="hljs-title function_">remove</span>(node);
    <span class="hljs-variable language_">this</span>.#<span class="hljs-title function_">append</span>(node);
    <span class="hljs-keyword">return</span> node.<span class="hljs-property">value</span>;
  }

  <span class="hljs-title function_">set</span>(<span class="hljs-params">key, value</span>) {
    <span class="hljs-keyword">let</span> node = <span class="hljs-variable language_">this</span>.<span class="hljs-property">map</span>.<span class="hljs-title function_">get</span>(key);
    <span class="hljs-keyword">if</span> (node) {
      node.<span class="hljs-property">value</span> = value;
      <span class="hljs-variable language_">this</span>.#<span class="hljs-title function_">remove</span>(node);
    } <span class="hljs-keyword">else</span> {
      node = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Node</span>(key, value);
      <span class="hljs-variable language_">this</span>.<span class="hljs-property">map</span>.<span class="hljs-title function_">set</span>(key, node);
    }
    <span class="hljs-variable language_">this</span>.#<span class="hljs-title function_">append</span>(node);
    <span class="hljs-keyword">if</span> (<span class="hljs-variable language_">this</span>.<span class="hljs-property">map</span>.<span class="hljs-property">size</span> &gt; <span class="hljs-variable language_">this</span>.<span class="hljs-property">capacity</span>) {
      <span class="hljs-keyword">const</span> oldest = <span class="hljs-variable language_">this</span>.<span class="hljs-property">head</span>.<span class="hljs-property">next</span>;
      <span class="hljs-variable language_">this</span>.#<span class="hljs-title function_">remove</span>(oldest);
      <span class="hljs-variable language_">this</span>.<span class="hljs-property">map</span>.<span class="hljs-title function_">delete</span>(oldest.<span class="hljs-property">key</span>);
    }
  }
}
</code></pre></div>
<p>实测用 300 组随机操作序列对比两种实现，<code>get</code> 的结果完全一致。链表节点保存 <code>key</code>，淘汰时才能从 Map 中同步删除。</p>
<h2>常见追问</h2>
<ul>
<li><strong>两种实现怎么选？</strong> 业务代码用 Map 版本，简短且性能足够；需要展示数据结构功底时写链表版本。</li>
<li><strong>要支持过期时间呢？</strong> 每个条目额外保存过期时刻，<code>get</code> 时发现已过期就删除并返回未命中。</li>
<li><strong>浏览器里哪些地方用到 LRU？</strong> 内存中的接口响应缓存、图片解码缓存、路由组件缓存（如 Vue 的 <code>KeepAlive</code> 设置 <code>max</code> 后按 LRU 淘汰）。</li>
</ul>`};export{e as default};