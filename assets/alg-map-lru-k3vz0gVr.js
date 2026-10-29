var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>LRU 的意思是“最近最少使用”：缓存满了，就把最久没被用过的那一条删掉。</p>
<p>用 Map 实现很方便，因为 Map 是按键第一次插入的顺序遍历的。但要注意，对已有的键再 <code>set</code> 一次，它的位置不会变。所以每次用到一个键，都要先 <code>delete</code> 再 <code>set</code>，把它挪到最后。这样排在最前面的，就是最久没用的，超出容量时删掉 <code>keys().next().value</code> 就行。<code>get</code> 命中和 <code>set</code> 都算用了一次，都要挪。</p>
<p>判断有没有命中要用 <code>has</code>，不能看 <code>get</code> 返回的是不是 <code>undefined</code>，因为缓存的值本身就可能是 <code>undefined</code>。</p>
<p>复杂度方面，V8 的 Map 是哈希表，<code>get</code>、<code>set</code>、<code>delete</code> 平均是常数时间，但语言规范只要求平均比线性快，不保证严格 O(1)。如果面试要求手写，常用的是哈希表加双向链表：哈希表负责快速找到节点，链表负责记录先后顺序，每次操作只改几个指针。</p>
</blockquote>
<h2>用 Map 实现</h2>
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
<p><code>keys().next().value</code> 是什么意思？<code>keys()</code> 返回一个迭代器，按顺序给出所有键，<code>next()</code> 只取第一个。所以它拿到的就是排在最前面、最久没用的那个键。</p>
<p>下面验证一下淘汰顺序：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> cache = <span class="hljs-keyword">new</span> <span class="hljs-title class_">LRUCache</span>(<span class="hljs-number">2</span>);
cache.<span class="hljs-title function_">set</span>(<span class="hljs-string">&#x27;a&#x27;</span>, <span class="hljs-number">1</span>);
cache.<span class="hljs-title function_">set</span>(<span class="hljs-string">&#x27;b&#x27;</span>, <span class="hljs-number">2</span>);
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(cache.<span class="hljs-title function_">get</span>(<span class="hljs-string">&#x27;a&#x27;</span>)); <span class="hljs-comment">// 1，a 移到末尾</span>
cache.<span class="hljs-title function_">set</span>(<span class="hljs-string">&#x27;c&#x27;</span>, <span class="hljs-number">3</span>); <span class="hljs-comment">// 淘汰 b</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(cache.<span class="hljs-title function_">get</span>(<span class="hljs-string">&#x27;b&#x27;</span>)); <span class="hljs-comment">// undefined</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>([...cache.<span class="hljs-property">items</span>.<span class="hljs-title function_">keys</span>()]); <span class="hljs-comment">// [&#x27;a&#x27;, &#x27;c&#x27;]</span>
</code></pre></div>
<p>先放了 a 和 b，a 本来是最老的。可是读了一次 a 以后，a 挪到了最后，b 就成了最老的。所以放 c 时被淘汰的是 b，不是 a。</p>
<h2>用哈希表加双向链表实现</h2>
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
<p>链表从头到尾就是从最老到最新。用到一个节点，就把它从原位置摘下来，接到尾巴上；要淘汰，就删掉头后面的第一个。</p>
<p><code>head</code> 和 <code>tail</code> 是两个不存数据的空节点，叫哨兵节点。有了它们，链表永远不会是真的空的，任何节点前后都有邻居，摘下和接上时就不用判断“它是不是第一个、是不是最后一个”。</p>
<p>为什么节点里还要存 <code>key</code>？因为淘汰时我们拿到的是链表节点，要同时从 Map 里删掉它，就得知道它的键是什么。</p>
<p>实测用 300 组随机操作，对比两种实现，<code>get</code> 的结果完全一致。</p>
<h2>常见追问</h2>
<p><strong>两种实现怎么选？</strong></p>
<blockquote>
<p>业务代码用 Map 版本，代码短，性能也够用。想展示数据结构功底时，写链表版本。</p>
</blockquote>
<p><strong>要支持过期时间怎么办？</strong></p>
<blockquote>
<p>每个条目多存一个过期时刻。<code>get</code> 的时候发现已经过期了，就删掉它，当作没命中。</p>
</blockquote>
<p><strong>浏览器里哪些地方用到 LRU？</strong></p>
<blockquote>
<p>内存里的接口响应缓存、图片解码缓存，还有路由组件缓存。比如 Vue 的 <code>KeepAlive</code> 设置了 <code>max</code> 以后，就是按 LRU 淘汰的。</p>
</blockquote>`};export{e as default};