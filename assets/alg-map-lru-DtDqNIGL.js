var e={answerHtml:`<h2>简答</h2>
<ul>
<li>Map 保留插入顺序，最前面的键就是最久未使用的。</li>
<li>get 命中时先删除再重新插入，把键移到最新的位置。</li>
<li>set 超出容量时，删除 keys().next() 得到的最旧键。</li>
<li>get 和 set 都是 O(1)。用 has 判断是否命中，这样值为 0 或 false 也能正确处理。</li>
</ul>
<p>LRU 是 Least Recently Used，意思是“最近最少使用”。更直白地说，当缓存满了，要放进一个新值时，把<strong>距离上次访问最久</strong>的那项移走。</p>
<p>它不统计访问总次数。一个条目昨天被访问了一万次，之后再也没用过，仍可能比刚访问过一次的新条目更早被淘汰。它也不同于先进先出：一次读取就可能改变淘汰顺序。</p>
<h2>用有序 Map 表示访问顺序</h2>
<p>JavaScript 的 <code>Map</code> 保留键的插入顺序，但不会自动跟踪读取顺序。直接 <code>get(key)</code> 不会移动键；直接给已经存在的键调用 <code>set(key, value)</code>，也不会把它移到末尾。</p>
<p>因此约定：Map 最前面的键最久没被使用，最后面的键最近被使用。每次读取命中或更新，都先删除该键，再重新插入。这个小动作就把“插入顺序”变成了我们维护的“使用顺序”。</p>
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
    <span class="hljs-comment">// 更新已有键时也要刷新顺序，且不能误删另一个条目。</span>
    <span class="hljs-variable language_">this</span>.<span class="hljs-property">items</span>.<span class="hljs-title function_">delete</span>(key);
    <span class="hljs-variable language_">this</span>.<span class="hljs-property">items</span>.<span class="hljs-title function_">set</span>(key, value);
    <span class="hljs-keyword">if</span> (<span class="hljs-variable language_">this</span>.<span class="hljs-property">items</span>.<span class="hljs-property">size</span> &gt; <span class="hljs-variable language_">this</span>.<span class="hljs-property">capacity</span>) {
      <span class="hljs-keyword">const</span> oldestKey = <span class="hljs-variable language_">this</span>.<span class="hljs-property">items</span>.<span class="hljs-title function_">keys</span>().<span class="hljs-title function_">next</span>().<span class="hljs-property">value</span>;
      <span class="hljs-variable language_">this</span>.<span class="hljs-property">items</span>.<span class="hljs-title function_">delete</span>(oldestKey);
    }
  }
}
</code></pre></div>
<p>这份教学实现约定 <code>capacity</code> 创建后不再变更，外部也不直接操作 <code>items</code>。每次 <code>set</code> 最多增加一项，所以超出容量时淘汰一项即可。如果允许运行中调小容量，就应额外提供受控方法并连续淘汰，不能只改公开字段。</p>
<h2>跟着四次操作看淘汰对象</h2>
<p>容量为 2，按“旧 → 新”的方向记录顺序：</p>
<table><thead><tr><th>操作</th><th>顺序</th><th>解释</th></tr></thead><tbody><tr><td><code>set(&#x27;a&#x27;, 1)</code></td><td>a</td><td>第一个条目</td></tr><tr><td><code>set(&#x27;b&#x27;, 2)</code></td><td>a、b</td><td>b 最近写入</td></tr><tr><td><code>get(&#x27;a&#x27;)</code></td><td>b、a</td><td>读取 a，使 a 成为最新使用</td></tr><tr><td><code>set(&#x27;c&#x27;, 3)</code></td><td>a、c</td><td>超出容量，淘汰最旧的 b</td></tr></tbody></table>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> cache = <span class="hljs-keyword">new</span> <span class="hljs-title class_">LRUCache</span>(<span class="hljs-number">2</span>);
cache.<span class="hljs-title function_">set</span>(<span class="hljs-string">&#x27;a&#x27;</span>, <span class="hljs-number">1</span>);
cache.<span class="hljs-title function_">set</span>(<span class="hljs-string">&#x27;b&#x27;</span>, <span class="hljs-number">2</span>);
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(cache.<span class="hljs-title function_">get</span>(<span class="hljs-string">&#x27;a&#x27;</span>)); <span class="hljs-comment">// 1</span>
cache.<span class="hljs-title function_">set</span>(<span class="hljs-string">&#x27;c&#x27;</span>, <span class="hljs-number">3</span>);
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(cache.<span class="hljs-title function_">get</span>(<span class="hljs-string">&#x27;b&#x27;</span>)); <span class="hljs-comment">// undefined</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>([...cache.<span class="hljs-property">items</span>.<span class="hljs-title function_">keys</span>()]); <span class="hljs-comment">// [&#x27;a&#x27;, &#x27;c&#x27;]</span>
</code></pre></div>
<p>如果把 <code>get</code> 中的删除、重插入去掉，第四步淘汰的就会是 a，缓存退化成接近按写入顺序淘汰的行为。如果更新已有键前就先删除“最旧项”，则可能在没有增加条目数时错误地淘汰其他数据，因此上面的实现统一在插入后检查容量。</p>
<h2>为什么用 <code>has</code> 判断命中</h2>
<p>缓存中可能存的是 <code>0</code>、<code>false</code>、空字符串甚至 <code>undefined</code>。用 <code>if (!this.items.get(key))</code> 会把合法的假值当成未命中。先用 <code>has</code> 判断，才能决定是否需要刷新访问顺序。</p>
<p>不过这个接口在对外返回时，仍用 <code>undefined</code> 表示未命中，所以调用方无法仅凭返回值区分“没找到”与“找到了，值就是 undefined”。如果业务需要区分，可以禁止缓存 <code>undefined</code>，或者改为返回 <code>{ found: true, value }</code> 与 <code>{ found: false }</code>；这属于接口设计，需要连同调用方一起确定。</p>
<p>Map 的对象键按对象身份区分。两次分别创建的 <code>{ id: 1 }</code> 不是同一个键，拿其中一个写入、另一个读取不会命中。缓存请求结果时，通常应选择稳定的字符串键，并把会影响结果的查询参数、用户身份等纳入键的设计。</p>
<h2>复杂度与实际缓存的边界</h2>
<p>每次操作只做固定次数的 Map 查询、删除和插入，不扫描全部条目。在常见哈希表式实现及平均常数时间操作的假设下，通常把这类方案的访问成本分析为平均 O(1)。但 ECMAScript 对 Map 的要求是平均访问时间相对于元素数量呈次线性，并没有保证所有引擎、所有操作都严格或最坏 O(1)。不能把常见实现的性能模型写成语言规范的硬承诺。</p>
<p>缓存本身最多保存 <code>capacity</code> 个条目，但这不是内存字节数上限。两张大图片可能比一千个短字符串更占空间；Map 还会强引用键和值，直到删除或整个缓存不再被引用。</p>
<p>LRU 只回答容量不足时淘汰谁，不回答数据何时失效。业务缓存通常还要单独考虑 TTL、用户退出时清理、正在进行的相同请求能否共用一个 Promise，以及失败结果是否应该缓存。若题目要求经典的哈希表加双向链表实现，则用哈希表定位节点、链表移动到头尾；这里的 Map 写法是利用 JavaScript 已有的有序集合接口完成相同的淘汰策略。</p>`};export{e as default};