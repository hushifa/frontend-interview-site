var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>示例测试就是我们平时写的测试，给一个具体输入，检查一个具体输出，比如 <code>chunk([1, 2, 3], 2)</code> 应该得到 <code>[[1, 2], [3]]</code>。它直观好读，但只检查了写测试的人想到的情况。</p>
<p>属性测试换了个思路：不写具体的值，而是写一条对所有输入都应该成立的规律，比如“对任意数组和任意正整数 <code>size</code>，分组结果展平后等于原数组，每组长度不超过 <code>size</code>”。然后让工具生成几百组输入去试，想办法推翻它。</p>
<p>一旦失败，工具会把输入缩减成尽量小的反例，并给出一个 seed，用同一个 seed 就能复现。</p>
<p>要注意两点。一条规律往往约束不住，比如直接返回 <code>[items]</code> 也满足“展平后相等”，要多条规律一起用。另外工具只会生成生成器范围内的输入，范围之外的情况，比如非法参数，还得单独写示例测试。</p>
</blockquote>
<h2>先看一个例子</h2>
<p>下面是一个把数组按固定大小分组的函数：</p>
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
<p>用 fast-check 给它写属性测试。<code>fc.array(fc.integer())</code> 生成任意整数数组，<code>fc.integer({ min: 1, max: 20 })</code> 生成合法的分组大小：</p>
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
<p>为什么要写四条断言？因为每一条单独拿出来，都有错误的实现能满足它。第一条检查内容和顺序没变，可是“整个数组当成一组”也能过。第二条检查组数，第三条检查前面每组都是满的，第四条检查每组非空且不超过上限。四条合在一起，错误的实现就很难全部蒙混过去。</p>
<h2>常见的规律有哪些</h2>
<p>刚开始写属性测试时，最难的是想出规律。下面几种最常用。</p>
<p>往返：<code>decode(encode(x))</code> 应该等于 <code>x</code>，适合序列化、URL 编码这类成对的函数。</p>
<p>不变量：比如排序以后长度不变、元素还是那些元素、相邻元素有序。</p>
<p>和简单实现对比：优化过的算法，结果应该等于一个朴素实现的结果。</p>
<p>幂等：<code>normalize(normalize(x))</code> 应该等于 <code>normalize(x)</code>，也就是做两遍和做一遍一样。</p>
<h2>生成器怎样写</h2>
<p>生成器决定了工具会尝试哪些输入。能直接生成合法输入，就不要先乱生成再用 <code>filter</code> 丢掉大部分，那样效率低，缩减反例的效果也差。</p>
<p>跟字符串有关的业务，要把空字符串、emoji、组合字符都考虑进去，<code>fc.string({ unit: &#x27;grapheme&#x27; })</code> 可以生成由多个码点组成的字符。状态机和交互逻辑可以用 <code>fc.commands</code> 生成一串操作，检查不管按什么顺序操作，状态最后都还是合法的。</p>
<h2>属性测试的局限</h2>
<p>随机试有限次不等于证明。生成器没覆盖到的输入、只在极小概率下出现的组合，仍然可能藏着问题。所以属性测试找到的反例，应该固定写成一个示例测试，防止以后又出现。</p>
<h2>常见追问</h2>
<p><strong>在 Vitest 里怎么用？</strong></p>
<blockquote>
<p>可以直接在 <code>test</code> 里调用 <code>fc.assert</code>，也可以用 <code>@fast-check/vitest</code> 提供的 <code>test.prop</code> 写法。</p>
</blockquote>`};export{e as default};