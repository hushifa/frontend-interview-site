var e={answerHtml:`<p>命令面板包含 open、option、optimize 等词条。用户输入 op 时，逐个扫描所有词条也能找到匹配，但每次都重新比较相同前缀。Trie 把公共前缀合并到同一条路径：根到 o，再到 p，之后才分成不同分支。</p>
<p>它适合需要大量重复前缀查询的静态或较稳定词库。只有几十条命令时，数组 filter 往往更简单；需要拼写纠错、拼音、分词或相关性排名时，普通 Trie 本身不够。</p>
<h2>路径存在不代表词条存在</h2>
<p>插入 apple 后，a、ap、app 都成为可走到的路径，但只有 apple 是已收录词。节点需要独立的终点标记，不能用“是否有子节点”判断一个词是否存在：app 和 apple 可以同时存在。</p>
<p>下面实现只提供插入、精确查询和前缀存在查询，不包含建议列表的排序与分页。规范化策略固定为 NFC，不自动忽略大小写。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">normalizeWord</span>(<span class="hljs-params">value</span>) {
  <span class="hljs-keyword">if</span> (<span class="hljs-keyword">typeof</span> value !== <span class="hljs-string">&#x27;string&#x27;</span>) <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">TypeError</span>(<span class="hljs-string">&#x27;词条必须是字符串&#x27;</span>);
  <span class="hljs-keyword">return</span> value.<span class="hljs-title function_">normalize</span>(<span class="hljs-string">&#x27;NFC&#x27;</span>);
}

<span class="hljs-keyword">class</span> <span class="hljs-title class_">Trie</span> {
  #root = { <span class="hljs-attr">terminal</span>: <span class="hljs-literal">false</span>, <span class="hljs-attr">children</span>: <span class="hljs-keyword">new</span> <span class="hljs-title class_">Map</span>() };

  <span class="hljs-title function_">insert</span>(<span class="hljs-params">value</span>) {
    <span class="hljs-keyword">const</span> word = <span class="hljs-title function_">normalizeWord</span>(value);
    <span class="hljs-keyword">if</span> (word.<span class="hljs-property">length</span> === <span class="hljs-number">0</span>) <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">RangeError</span>(<span class="hljs-string">&#x27;不收录空词条&#x27;</span>);
    <span class="hljs-keyword">let</span> node = <span class="hljs-variable language_">this</span>.#root;
    <span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> character <span class="hljs-keyword">of</span> word) {
      <span class="hljs-keyword">if</span> (!node.<span class="hljs-property">children</span>.<span class="hljs-title function_">has</span>(character)) {
        node.<span class="hljs-property">children</span>.<span class="hljs-title function_">set</span>(character, { <span class="hljs-attr">terminal</span>: <span class="hljs-literal">false</span>, <span class="hljs-attr">children</span>: <span class="hljs-keyword">new</span> <span class="hljs-title class_">Map</span>() });
      }
      node = node.<span class="hljs-property">children</span>.<span class="hljs-title function_">get</span>(character);
    }
    <span class="hljs-keyword">const</span> added = !node.<span class="hljs-property">terminal</span>;
    node.<span class="hljs-property">terminal</span> = <span class="hljs-literal">true</span>;
    <span class="hljs-keyword">return</span> added;
  }

  #<span class="hljs-title function_">find</span>(<span class="hljs-params">value</span>) {
    <span class="hljs-keyword">let</span> node = <span class="hljs-variable language_">this</span>.#root;
    <span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> character <span class="hljs-keyword">of</span> <span class="hljs-title function_">normalizeWord</span>(value)) {
      node = node.<span class="hljs-property">children</span>.<span class="hljs-title function_">get</span>(character);
      <span class="hljs-keyword">if</span> (!node) <span class="hljs-keyword">return</span> <span class="hljs-literal">undefined</span>;
    }
    <span class="hljs-keyword">return</span> node;
  }

  <span class="hljs-title function_">has</span>(<span class="hljs-params">value</span>) {
    <span class="hljs-keyword">return</span> <span class="hljs-variable language_">this</span>.#<span class="hljs-title function_">find</span>(value)?.<span class="hljs-property">terminal</span> === <span class="hljs-literal">true</span>;
  }

  <span class="hljs-title function_">hasPrefix</span>(<span class="hljs-params">value</span>) {
    <span class="hljs-keyword">return</span> <span class="hljs-variable language_">this</span>.#<span class="hljs-title function_">find</span>(value) !== <span class="hljs-literal">undefined</span>;
  }
}

<span class="hljs-keyword">const</span> words = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Trie</span>();
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(words.<span class="hljs-title function_">insert</span>(<span class="hljs-string">&#x27;apple&#x27;</span>)); <span class="hljs-comment">// true</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(words.<span class="hljs-title function_">insert</span>(<span class="hljs-string">&#x27;apple&#x27;</span>)); <span class="hljs-comment">// false，重复插入不新增词条</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(words.<span class="hljs-title function_">has</span>(<span class="hljs-string">&#x27;app&#x27;</span>)); <span class="hljs-comment">// false</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(words.<span class="hljs-title function_">hasPrefix</span>(<span class="hljs-string">&#x27;app&#x27;</span>)); <span class="hljs-comment">// true</span>
words.<span class="hljs-title function_">insert</span>(<span class="hljs-string">&#x27;app&#x27;</span>);
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(words.<span class="hljs-title function_">has</span>(<span class="hljs-string">&#x27;app&#x27;</span>)); <span class="hljs-comment">// true</span>
</code></pre></div>
<p>本例空前缀返回 true，表示根路径存在，即使词库为空也成立；空词条不允许插入，所以 has(&#x27;&#x27;) 返回 false。这是接口约定，不等于已经有建议可展示。</p>
<p>Map 避免把 <strong>proto</strong> 等字符串当成普通对象属性使用。每个节点的 Map 都独立创建，不能把所有节点指向同一个 children，否则插入不同分支会互相污染。</p>
<h2>Unicode 的字符单位要明确</h2>
<p>for…of 按 Unicode 码点遍历字符串，相比按下标逐个取 UTF-16 码元，不会把一个非 BMP 字符的代理对拆成两个节点。但用户看到的一个字符可能由多个码点组成，例如组合音标或 emoji 序列，所以不能说这个实现按“视觉字符”建立节点。</p>
<p>NFC 可以把某些规范等价序列归一化，例如 é 与 e 加组合重音。这不会把简繁体、拼音和同义词自动合并，也不会处理所有视觉相似字符。插入与查询必须使用同一策略；若改成大小写不敏感，应明确目标语言和大小写规则，不能假设简单 toLowerCase 适用于所有搜索需求。</p>
<h2>查询快不代表完整搜索成本低</h2>
<p>在常见 Map 查找近似常数时间的实现假设下，沿路径查询与规范化后词长 m 相关，通常记为 O(m)。构建需要遍历所有词条，总节点数最坏与总码点数同阶；大量短词和分支会带来很多对象与 Map 的内存开销。JavaScript 规范并没有要求 Map 必须使用某一种哈希表实现。</p>
<p>hasPrefix 只回答路径是否存在。列出前缀下所有建议还要遍历子树并输出结果，成本取决于匹配数量，不是永远 O(m)。实际组件需要限制建议数量、定义排序、避免深递归栈溢出，并保留展示名与搜索索引键的对应关系。</p>
<p>如果要删除词条，应先取消终点标记，再按需要回收没有子节点且不再是终点的路径；直接删除某个前缀节点会误删其他共享该前缀的词。高频增删、排序权重和同步更新会增加实现复杂度，应先确认需求值得维护这套索引。</p>
<h2>前端选型与安全边界</h2>
<p>词库很大时，下载与建树可能比查找更贵。可以使用 Worker 构建索引或服务端搜索，但要考虑传输、内存和版本切换。新索引构建完成后再整体替换，避免用户查询到半建成的数据。</p>
<p>外部词条限制数量和长度，展示建议时使用文本节点，不把词条当 HTML。Trie 找到一个用户名称也不代表调用方有权获取对应用户数据，权限过滤仍要在数据提供方执行。</p>
<p>如果主要需求是有序数组上的前缀范围定位，排序加二分可能比对象树更省内存；如果需求是模糊匹配与相关性排名，评估专门的搜索库或服务。应根据词库规模、更新频率、查询语义和包体成本决定，而不是因为 Trie 的查询复杂度好看就默认使用。</p>
<p>本题为教学实现，参考资料用于核对 Map 与字符串规范化 API。</p>
<h2>补充参考</h2>
<ul>
<li><a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/normalize">MDN · String.normalize</a></li>
<li><a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/Symbol.iterator">MDN · String iterator</a></li>
</ul>`};export{e as default};