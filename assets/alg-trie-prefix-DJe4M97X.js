var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>Trie 也叫前缀树。它的每条边是一个字符，从根走到某个节点，经过的字符连起来就是一个前缀。节点上有个 <code>terminal</code> 标记，用来区分“这里是一个完整的词”和“只是路过”。</p>
<p>它的好处是，判断一个前缀存不存在，只要走 m 步，m 是前缀的长度，跟总共有多少词无关。要列出所有建议，就再把这个前缀下面的子树遍历一遍。同一个词重复插入不会多出节点，只要看 <code>terminal</code> 是不是已经是 <code>true</code>。</p>
<p>Unicode 有两个坑。第一，看起来一样的 <code>café</code>，可能有两种编码，所以插入和查询前都要用 <code>normalize(&#x27;NFC&#x27;)</code> 统一一下。第二，emoji 在 UTF-16 里占两个码元，要用 <code>for...of</code> 按码点遍历，不然会被拆成两半。</p>
<p>也不是什么时候都要用 Trie。词条只有几百个时，<code>filter</code> 加 <code>startsWith</code> 就够快了。需要容错、拼写纠正或者匹配中间的子串时，Trie 做不了，要用模糊搜索库或倒排索引。</p>
</blockquote>
<h2>实现</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">class</span> <span class="hljs-title class_">Trie</span> {
  #root = { <span class="hljs-attr">terminal</span>: <span class="hljs-literal">false</span>, <span class="hljs-attr">children</span>: <span class="hljs-keyword">new</span> <span class="hljs-title class_">Map</span>() };

  #<span class="hljs-title function_">normalize</span>(<span class="hljs-params">word</span>) {
    <span class="hljs-keyword">return</span> word.<span class="hljs-title function_">normalize</span>(<span class="hljs-string">&#x27;NFC&#x27;</span>).<span class="hljs-title function_">toLocaleLowerCase</span>(<span class="hljs-string">&#x27;en&#x27;</span>);
  }

  <span class="hljs-title function_">insert</span>(<span class="hljs-params">word</span>) {
    <span class="hljs-keyword">const</span> key = <span class="hljs-variable language_">this</span>.#<span class="hljs-title function_">normalize</span>(word);
    <span class="hljs-keyword">if</span> (key === <span class="hljs-string">&#x27;&#x27;</span>) <span class="hljs-keyword">return</span> <span class="hljs-literal">false</span>;
    <span class="hljs-keyword">let</span> node = <span class="hljs-variable language_">this</span>.#root;
    <span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> char <span class="hljs-keyword">of</span> key) {
      <span class="hljs-keyword">if</span> (!node.<span class="hljs-property">children</span>.<span class="hljs-title function_">has</span>(char)) {
        node.<span class="hljs-property">children</span>.<span class="hljs-title function_">set</span>(char, { <span class="hljs-attr">terminal</span>: <span class="hljs-literal">false</span>, <span class="hljs-attr">children</span>: <span class="hljs-keyword">new</span> <span class="hljs-title class_">Map</span>() });
      }
      node = node.<span class="hljs-property">children</span>.<span class="hljs-title function_">get</span>(char);
    }
    <span class="hljs-keyword">if</span> (node.<span class="hljs-property">terminal</span>) <span class="hljs-keyword">return</span> <span class="hljs-literal">false</span>;
    node.<span class="hljs-property">terminal</span> = <span class="hljs-literal">true</span>;
    <span class="hljs-comment">// 保存原始写法，用于展示。</span>
    node.<span class="hljs-property">word</span> = word;
    <span class="hljs-keyword">return</span> <span class="hljs-literal">true</span>;
  }

  #<span class="hljs-title function_">find</span>(<span class="hljs-params">prefix</span>) {
    <span class="hljs-keyword">let</span> node = <span class="hljs-variable language_">this</span>.#root;
    <span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> char <span class="hljs-keyword">of</span> <span class="hljs-variable language_">this</span>.#<span class="hljs-title function_">normalize</span>(prefix)) {
      node = node.<span class="hljs-property">children</span>.<span class="hljs-title function_">get</span>(char);
      <span class="hljs-keyword">if</span> (!node) <span class="hljs-keyword">return</span> <span class="hljs-literal">undefined</span>;
    }
    <span class="hljs-keyword">return</span> node;
  }

  <span class="hljs-title function_">has</span>(<span class="hljs-params">word</span>) {
    <span class="hljs-keyword">return</span> <span class="hljs-variable language_">this</span>.#<span class="hljs-title function_">find</span>(word)?.<span class="hljs-property">terminal</span> === <span class="hljs-literal">true</span>;
  }

  <span class="hljs-title function_">suggest</span>(<span class="hljs-params">prefix, limit = <span class="hljs-number">5</span></span>) {
    <span class="hljs-keyword">const</span> start = <span class="hljs-variable language_">this</span>.#<span class="hljs-title function_">find</span>(prefix);
    <span class="hljs-keyword">if</span> (!start) <span class="hljs-keyword">return</span> [];
    <span class="hljs-keyword">const</span> result = [];
    <span class="hljs-keyword">const</span> stack = [start];
    <span class="hljs-keyword">while</span> (stack.<span class="hljs-property">length</span> &gt; <span class="hljs-number">0</span> &amp;&amp; result.<span class="hljs-property">length</span> &lt; limit) {
      <span class="hljs-keyword">const</span> node = stack.<span class="hljs-title function_">pop</span>();
      <span class="hljs-keyword">if</span> (node.<span class="hljs-property">terminal</span>) result.<span class="hljs-title function_">push</span>(node.<span class="hljs-property">word</span>);
      <span class="hljs-comment">// 反向入栈，让字符较小的子节点先被访问，结果按字典序输出。</span>
      <span class="hljs-keyword">const</span> children = [...node.<span class="hljs-property">children</span>].<span class="hljs-title function_">sort</span>(<span class="hljs-function">(<span class="hljs-params">[a], [b]</span>) =&gt;</span> (a &lt; b ? <span class="hljs-number">1</span> : -<span class="hljs-number">1</span>));
      <span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> [, child] <span class="hljs-keyword">of</span> children) stack.<span class="hljs-title function_">push</span>(child);
    }
    <span class="hljs-keyword">return</span> result;
  }
}

<span class="hljs-keyword">const</span> commands = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Trie</span>();
<span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> word <span class="hljs-keyword">of</span> [<span class="hljs-string">&#x27;Open File&#x27;</span>, <span class="hljs-string">&#x27;Open Folder&#x27;</span>, <span class="hljs-string">&#x27;Open Recent&#x27;</span>, <span class="hljs-string">&#x27;Save&#x27;</span>, <span class="hljs-string">&#x27;Open File&#x27;</span>]) {
  commands.<span class="hljs-title function_">insert</span>(word);
}
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(commands.<span class="hljs-title function_">suggest</span>(<span class="hljs-string">&#x27;open f&#x27;</span>)); <span class="hljs-comment">// [&#x27;Open File&#x27;, &#x27;Open Folder&#x27;]</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(commands.<span class="hljs-title function_">has</span>(<span class="hljs-string">&#x27;open&#x27;</span>)); <span class="hljs-comment">// false，只是前缀</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(commands.<span class="hljs-title function_">suggest</span>(<span class="hljs-string">&#x27;x&#x27;</span>)); <span class="hljs-comment">// []</span>
</code></pre></div>
<p>用户输入的是小写的 <code>open f</code>，也匹配到了 <code>Open File</code>。这是因为插入和查询都经过 <code>#normalize</code>，统一转成了小写。可是建议里显示的还是原来的大小写，因为词尾节点上另外存了一份原始写法 <code>node.word</code>。</p>
<p><code>has(&#x27;open&#x27;)</code> 是 <code>false</code>。<code>open</code> 这条路径是存在的，但它只是 <code>Open File</code> 的前缀，节点上的 <code>terminal</code> 不是 <code>true</code>。</p>
<p><code>Open File</code> 插了两次，第二次返回 <code>false</code>，不会出现重复的建议。<code>limit</code> 的作用是找够了就停，前缀很短、词条又很多时，也不用把整棵子树走完。</p>
<h2>Unicode 的两个问题</h2>
<table><thead><tr><th>问题</th><th>例子</th><th>处理</th></tr></thead><tbody><tr><td>同一个字形有多种编码</td><td><code>é</code> 可以是一个码点，也可以是 <code>e</code> 加组合重音符</td><td>插入和查询都做 NFC 归一化</td></tr><tr><td>一个字符占两个 UTF-16 码元</td><td><code>&#x27;👍🏽&#x27;.length</code> 是 4，<code>[...&#x27;👍🏽&#x27;].length</code> 是 2</td><td>用 <code>for...of</code> 按码点遍历</td></tr></tbody></table>
<p>第一行是什么意思？<code>é</code> 有两种存法，一种是一个现成的 <code>é</code> 字符，另一种是普通的 <code>e</code> 后面跟一个“加重音”的符号。屏幕上看着一模一样，但在 Trie 里走的是不同的路径，用户怎么输都可能匹配不上。NFC 归一化会把它们统一成同一种。</p>
<p>第二行里，<code>👍🏽</code> 是一个带肤色的点赞，它本身由两个码点组成：点赞和肤色修饰。按码点遍历时，它会变成两条边，但不会被拆成半个字符，对前缀匹配没有影响。如果要按用户眼里的“一个字”来计数，用 <code>Intl.Segmenter</code>。</p>
<p>大小写转换为什么固定写 <code>en</code>？因为在土耳其语环境下，<code>I</code> 转小写会变成没有点的 <code>ı</code>，同一个命令在不同用户的电脑上就匹配不上了。</p>
<h2>什么时候不用 Trie</h2>
<p>词条很少时不用。几百条数据，直接 <code>startsWith</code> 一个个比，耗时可以忽略，代码也简单得多。</p>
<p>需要按热度或最近使用排序时，光靠 Trie 不行。它只能按字典序遍历，要么在节点上额外存权重，要么先取出候选再排序。</p>
<p>需要模糊匹配时也不行。用户输入 <code>opn fl</code>，也希望匹配到 <code>Open File</code>，这需要子序列匹配或者编辑距离，VS Code 的命令面板就是这样做的。</p>
<h2>常见追问</h2>
<p><strong>空间复杂度是多少？</strong></p>
<blockquote>
<p>最坏情况是所有词条的字符数加起来。词之间共享的前缀越多越省空间。中文这种字符集很大、前缀很少重合的场景，节点数会接近总字符数。</p>
</blockquote>
<p><strong>怎么删除一个词？</strong></p>
<blockquote>
<p>先把它词尾节点的 <code>terminal</code> 改成 <code>false</code>，再从下往上，把既没有子节点、也不是别的词结尾的节点删掉。</p>
</blockquote>`};export{e as default};