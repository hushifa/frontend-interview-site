var e={answerHtml:`<h2>简答</h2>
<ul>
<li>示例测试：<code>chunk([1, 2, 3], 2)</code> 应得到 <code>[[1, 2], [3]]</code>。直观，但只检查了想到的情况。</li>
<li>属性测试：对任意数组和任意正整数 <code>size</code>，结果展平后等于原数组、每组长度不超过 <code>size</code>。工具会尝试数百组输入。</li>
<li>一个属性往往不够：直接返回 <code>[items]</code> 也满足“展平后相等”，需要多个属性共同约束。</li>
<li>失败时工具会把输入缩减成更小的反例，并给出 seed，用同一 seed 可以复现。</li>
<li>生成器决定了测试覆盖的输入范围，生成器之外的输入（例如非法参数）仍需要单独的示例测试。</li>
</ul>
<h2>示例</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">chunk</span>(<span class="hljs-params">items, size</span>) {
  <span class="hljs-keyword">if</span> (!<span class="hljs-title class_">Number</span>.<span class="hljs-title function_">isInteger</span>(size) || size &lt;= <span class="hljs-number">0</span>) {
    <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">RangeError</span>(<span class="hljs-string">&#x27;分组大小必须是正整数&#x27;</span>);
  }
  <span class="hljs-keyword">const</span> result = [];
  <span class="hljs-keyword">for</span> (<span class="hljs-keyword">let</span> index = <span class="hljs-number">0</span>; index &lt; items.<span class="hljs-property">length</span>; index += size) {
    result.<span class="hljs-title function_">push</span>(items.<span class="hljs-title function_">slice</span>(index, index + size));
  }
  <span class="hljs-keyword">return</span> result;
}
</code></pre></div>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">import</span> fc <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;fast-check&#x27;</span>;
<span class="hljs-keyword">import</span> assert <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;node:assert/strict&#x27;</span>;

fc.<span class="hljs-title function_">assert</span>(
  fc.<span class="hljs-title function_">property</span>(
    fc.<span class="hljs-title function_">array</span>(fc.<span class="hljs-title function_">integer</span>(), { <span class="hljs-attr">maxLength</span>: <span class="hljs-number">100</span> }),
    fc.<span class="hljs-title function_">integer</span>({ <span class="hljs-attr">min</span>: <span class="hljs-number">1</span>, <span class="hljs-attr">max</span>: <span class="hljs-number">20</span> }),
    <span class="hljs-function">(<span class="hljs-params">items, size</span>) =&gt;</span> {
      <span class="hljs-keyword">const</span> groups = <span class="hljs-title function_">chunk</span>(items, size);
      assert.<span class="hljs-title function_">deepEqual</span>(groups.<span class="hljs-title function_">flat</span>(), items);
      assert.<span class="hljs-title function_">equal</span>(groups.<span class="hljs-property">length</span>, <span class="hljs-title class_">Math</span>.<span class="hljs-title function_">ceil</span>(items.<span class="hljs-property">length</span> / size));
      <span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> group <span class="hljs-keyword">of</span> groups.<span class="hljs-title function_">slice</span>(<span class="hljs-number">0</span>, -<span class="hljs-number">1</span>)) {
        assert.<span class="hljs-title function_">equal</span>(group.<span class="hljs-property">length</span>, size);
      }
      <span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> group <span class="hljs-keyword">of</span> groups) {
        assert.<span class="hljs-title function_">ok</span>(group.<span class="hljs-property">length</span> &gt; <span class="hljs-number">0</span> &amp;&amp; group.<span class="hljs-property">length</span> &lt;= size);
      }
    },
  ),
);
</code></pre></div>
<p>四条断言分别约束内容和顺序、组数、前面每组都满、每组非空且不超过上限。合在一起，错误的实现很难全部满足。</p>
<h2>常见的属性写法</h2>
<ul>
<li>往返：<code>decode(encode(x))</code> 等于 <code>x</code>，适合序列化、URL 编码。</li>
<li>不变量：排序后长度不变、元素相同、相邻元素有序。</li>
<li>和简单实现对比：优化后的算法结果等于朴素实现的结果。</li>
<li>幂等：<code>normalize(normalize(x))</code> 等于 <code>normalize(x)</code>。</li>
</ul>
<h2>生成器</h2>
<ul>
<li>直接生成合法输入，比生成后用 <code>filter</code> 丢弃大部分更高效，缩减效果也更好。</li>
<li>字符串业务要包括空字符串、emoji、组合字符，<code>fc.string({ unit: &#x27;grapheme&#x27; })</code> 可以生成多码点字符。</li>
<li>状态机和交互逻辑可以用 <code>fc.commands</code> 生成操作序列，检查任意操作顺序后状态仍然合法。</li>
</ul>
<h2>局限</h2>
<p>随机检查有限次数不是证明。生成器没有覆盖的输入、只在极小概率出现的组合，仍可能藏着问题。发现的反例应该固定成示例测试，防止回归。</p>
<h2>常见追问</h2>
<ul>
<li>在 Vitest 里怎么用？可以直接在 <code>test</code> 里调用 <code>fc.assert</code>，也可以使用 <code>@fast-check/vitest</code> 提供的 <code>test.prop</code> 写法。</li>
</ul>`};export{e as default};