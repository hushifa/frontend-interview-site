var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>电商详情页上，一件衣服有颜色和尺码两行规格。用户选了“红色”以后，红色没货的尺码要置灰，不能点。SKU 就是一种具体的规格组合，比如“红色 + S 码”，每个 SKU 有自己的库存。</p>
<p>难点在于判断每个按钮能不能点。直接的想法是每次点击后遍历所有 SKU 去比对，规格多了就很慢。更好的做法是预处理：把每个有库存的 SKU 的规格组合，连同它的所有子集，比如“红|”“|S”“红|S”，都放进一个 Set。</p>
<p>判断某个按钮时，假设选中它，其他行保持当前的选择，拼出一个键去 Set 里查。查得到说明至少有一个有货的 SKU 能满足，按钮可点；查不到就置灰。</p>
<p>要注意，子集数量是 2 的规格行数次方，行数一般只有两三行，所以没问题。另外前端置灰只是提示，下单时库存仍以服务端校验为准。</p>
</blockquote>
<h2>数据长什么样</h2>
<p>后端通常返回两部分数据：规格定义，比如颜色有红、蓝，尺码有 S、M、L；以及 SKU 列表，每一项是一种组合和它的库存。下面的例子里，红色只有 S 码有货，红色 M 码库存为 0，蓝色有 M 码和 L 码。</p>
<p>页面上的选择状态用一个数组表示，下标对应规格行，没选的位置是空字符串。比如 <code>[&#x27;红&#x27;, &#x27;&#x27;]</code> 表示颜色选了红色，尺码还没选。</p>
<h2>用子集表预先算好所有可能</h2>
<p>下面的代码先构建子集表，再对每个按钮判断可不可选，不可选的用括号包起来，方便打印对比。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> specs = [
  { <span class="hljs-attr">name</span>: <span class="hljs-string">&#x27;颜色&#x27;</span>, <span class="hljs-attr">values</span>: [<span class="hljs-string">&#x27;红&#x27;</span>, <span class="hljs-string">&#x27;蓝&#x27;</span>] },
  { <span class="hljs-attr">name</span>: <span class="hljs-string">&#x27;尺码&#x27;</span>, <span class="hljs-attr">values</span>: [<span class="hljs-string">&#x27;S&#x27;</span>, <span class="hljs-string">&#x27;M&#x27;</span>, <span class="hljs-string">&#x27;L&#x27;</span>] },
];
<span class="hljs-keyword">const</span> skus = [
  { <span class="hljs-attr">spec</span>: [<span class="hljs-string">&#x27;红&#x27;</span>, <span class="hljs-string">&#x27;S&#x27;</span>], <span class="hljs-attr">stock</span>: <span class="hljs-number">3</span> },
  { <span class="hljs-attr">spec</span>: [<span class="hljs-string">&#x27;红&#x27;</span>, <span class="hljs-string">&#x27;M&#x27;</span>], <span class="hljs-attr">stock</span>: <span class="hljs-number">0</span> },
  { <span class="hljs-attr">spec</span>: [<span class="hljs-string">&#x27;蓝&#x27;</span>, <span class="hljs-string">&#x27;M&#x27;</span>], <span class="hljs-attr">stock</span>: <span class="hljs-number">5</span> },
  { <span class="hljs-attr">spec</span>: [<span class="hljs-string">&#x27;蓝&#x27;</span>, <span class="hljs-string">&#x27;L&#x27;</span>], <span class="hljs-attr">stock</span>: <span class="hljs-number">2</span> },
];

<span class="hljs-comment">// 把有库存的 SKU 的所有子集都记下来，判断时只需查表。</span>
<span class="hljs-keyword">function</span> <span class="hljs-title function_">buildPathSet</span>(<span class="hljs-params">list</span>) {
  <span class="hljs-keyword">const</span> set = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Set</span>();
  <span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> sku <span class="hljs-keyword">of</span> list) {
    <span class="hljs-keyword">if</span> (sku.<span class="hljs-property">stock</span> &lt;= <span class="hljs-number">0</span>) <span class="hljs-keyword">continue</span>;
    <span class="hljs-keyword">const</span> n = sku.<span class="hljs-property">spec</span>.<span class="hljs-property">length</span>;
    <span class="hljs-keyword">for</span> (<span class="hljs-keyword">let</span> mask = <span class="hljs-number">1</span>; mask &lt; <span class="hljs-number">1</span> &lt;&lt; n; mask++) {
      <span class="hljs-keyword">const</span> key = sku.<span class="hljs-property">spec</span>.<span class="hljs-title function_">map</span>(<span class="hljs-function">(<span class="hljs-params">v, i</span>) =&gt;</span> (mask &amp; (<span class="hljs-number">1</span> &lt;&lt; i) ? v : <span class="hljs-string">&#x27;&#x27;</span>)).<span class="hljs-title function_">join</span>(<span class="hljs-string">&#x27;|&#x27;</span>);
      set.<span class="hljs-title function_">add</span>(key);
    }
  }
  <span class="hljs-keyword">return</span> set;
}

<span class="hljs-keyword">const</span> pathSet = <span class="hljs-title function_">buildPathSet</span>(skus);

<span class="hljs-keyword">function</span> <span class="hljs-title function_">isSelectable</span>(<span class="hljs-params">selected, row, value</span>) {
  <span class="hljs-comment">// 假设把这一行换成 value，其他行保持当前选择，看组合是否存在。</span>
  <span class="hljs-keyword">const</span> trial = selected.<span class="hljs-title function_">slice</span>();
  trial[row] = value;
  <span class="hljs-keyword">if</span> (trial.<span class="hljs-title function_">every</span>(<span class="hljs-function">(<span class="hljs-params">v</span>) =&gt;</span> v === <span class="hljs-string">&#x27;&#x27;</span>)) <span class="hljs-keyword">return</span> <span class="hljs-literal">true</span>;
  <span class="hljs-keyword">return</span> pathSet.<span class="hljs-title function_">has</span>(trial.<span class="hljs-title function_">join</span>(<span class="hljs-string">&#x27;|&#x27;</span>));
}

<span class="hljs-keyword">function</span> <span class="hljs-title function_">render</span>(<span class="hljs-params">selected</span>) {
  <span class="hljs-keyword">return</span> specs
    .<span class="hljs-title function_">map</span>(<span class="hljs-function">(<span class="hljs-params">spec, row</span>) =&gt;</span>
      spec.<span class="hljs-property">values</span>.<span class="hljs-title function_">map</span>(<span class="hljs-function">(<span class="hljs-params">v</span>) =&gt;</span> (<span class="hljs-title function_">isSelectable</span>(selected, row, v) ? v : <span class="hljs-string">&#x27;(&#x27;</span> + v + <span class="hljs-string">&#x27;)&#x27;</span>)).<span class="hljs-title function_">join</span>(<span class="hljs-string">&#x27; &#x27;</span>),
    )
    .<span class="hljs-title function_">join</span>(<span class="hljs-string">&#x27; / &#x27;</span>);
}

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">render</span>([<span class="hljs-string">&#x27;&#x27;</span>, <span class="hljs-string">&#x27;&#x27;</span>])); <span class="hljs-comment">// 红 蓝 / S M L</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">render</span>([<span class="hljs-string">&#x27;红&#x27;</span>, <span class="hljs-string">&#x27;&#x27;</span>])); <span class="hljs-comment">// 红 蓝 / S (M) (L)</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">render</span>([<span class="hljs-string">&#x27;&#x27;</span>, <span class="hljs-string">&#x27;M&#x27;</span>])); <span class="hljs-comment">// (红) 蓝 / S M L</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">render</span>([<span class="hljs-string">&#x27;蓝&#x27;</span>, <span class="hljs-string">&#x27;L&#x27;</span>])); <span class="hljs-comment">// (红) 蓝 / (S) M L</span>
</code></pre></div>
<p>第一行什么都没选，所有规格都能点，因为每个值至少出现在一个有货的 SKU 里。</p>
<p>第二行选了红色。尺码一行只剩 S 可点：红色 M 码库存是 0，构建表的时候被跳过了，红色 L 码根本不存在。颜色一行的蓝色仍然可点，因为判断蓝色时是把颜色这一行换成蓝色、尺码保持空，<code>蓝|</code> 在表里。</p>
<p>第三行只选了 M 码。这时红色被置灰，因为有货的 M 码只有蓝色。</p>
<p>第四行选了蓝色和 L 码。尺码一行的 M 仍可点，因为判断 M 时把尺码换成 M，得到 <code>蓝|M</code>，有货；S 被置灰，因为蓝色没有 S 码。颜色一行的红色被置灰，因为红色没有 L 码。</p>
<h2>为什么要把子集也放进表里</h2>
<p>用户经常只选了一部分规格。比如只选了红色，要判断尺码 S 能不能点，查的键是 <code>红|S</code>；要判断颜色蓝能不能点，查的键是 <code>蓝|</code>，尺码那一位是空的。如果表里只有完整的组合，部分选择就查不到，只能回去遍历 SKU。</p>
<p>所以构建表时，对每个有货的 SKU，枚举它的每一个子集。<code>mask</code> 是一个二进制数，第 <code>i</code> 位是 1 表示保留第 <code>i</code> 行的值，是 0 就留空，从 1 枚举到 <code>2^n - 1</code> 正好覆盖所有非空子集。这样不管用户选了哪几行，拼出来的键都能直接查表。</p>
<h2>判断的时候为什么是“替换”这一行</h2>
<p>判断一个按钮时，不是把它加到当前选择上，而是把它所在的那一行替换成它。因为同一行只能选一个值，用户点蓝色意味着把红色换掉，不是同时选红和蓝。所以已经选中红色时，蓝色按钮的判断是看 <code>蓝|</code> 而不是“红和蓝”，结果是可点的，用户点了就切换过去。</p>
<p>这也是为什么同一行里的其他值通常不会被自己这一行的选择置灰，只会被其他行的选择影响。</p>
<h2>复杂度怎样估算</h2>
<p>设有 <code>m</code> 个 SKU、<code>n</code> 行规格，构建表要处理 <code>m × 2^n</code> 个键，只做一次。之后每次渲染，每个按钮只做一次 Set 查找。规格行数通常是两三行，<code>2^n</code> 只有 4 到 8，所以预处理很便宜。</p>
<p>如果库存会实时变化，比如秒杀页面，只需要在拿到新的 SKU 列表后重新构建一次表。</p>
<h2>常见追问</h2>
<p><strong>选中的组合突然没货了怎么办？</strong></p>
<blockquote>
<p>比如用户已经选好红色 S 码，这时库存刷新变成 0。重新构建表以后，<code>红|S</code> 查不到了，应该提示“该规格已售罄”，并让用户重新选，而不是悄悄保留一个无效的选择。真正下单时还要以服务端的库存校验为准。</p>
</blockquote>
<p><strong>能不能用图的邻接矩阵来做？</strong></p>
<blockquote>
<p>也可以把每个规格值当成一个顶点，同一个有货 SKU 里的值两两连边。可是判断三行以上的组合时，两两相连并不代表这三个值同时出现在同一个 SKU 里，还要再做额外的检查。子集表直接记录的就是组合本身，不会有这个问题，实现也更简单。</p>
</blockquote>`};export{e as default};