var e={answerHtml:`<h2>简答</h2>
<ul>
<li>示例测试验证具体输入输出，属性测试描述一类输入都应满足的规律。</li>
<li>工具生成多组数据尝试推翻属性。</li>
<li>价值取决于生成器的输入范围和断言表达的业务性质。</li>
<li>两者互补：示例说明接口契约，属性覆盖更广的输入。</li>
</ul>
<p>示例测试给出具体输入和预期输出，例如“空数组分组后仍是空数组”。属性测试则描述一类输入都应满足的规律，让工具生成多组数据尝试推翻它。</p>
<p>它不是随便生成随机值看看会不会报错。真正重要的是生成器定义了什么输入范围，以及断言是否表达了可靠的业务性质。</p>
<h2>用数组分组说明两种测试的分工</h2>
<p>假设函数按正整数 size 把数组切成多组，最后一组可以更短：</p>
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
<p>示例测试可以明确验证 <code>[1, 2, 3]</code> 按 2 分组得到 <code>[[1, 2], [3]]</code>，以及 size 为 0 时抛错。这些例子可读性高，直接说明接口契约。</p>
<p>属性测试可以检查更广的数组和分组大小：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">import</span> fc <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;fast-check&#x27;</span>;
<span class="hljs-keyword">import</span> assert <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;node:assert/strict&#x27;</span>;

fc.<span class="hljs-title function_">assert</span>(
  fc.<span class="hljs-title function_">property</span>(
    fc.<span class="hljs-title function_">array</span>(fc.<span class="hljs-title function_">integer</span>(), { <span class="hljs-attr">maxLength</span>: <span class="hljs-number">100</span> }),
    fc.<span class="hljs-title function_">integer</span>({ <span class="hljs-attr">min</span>: <span class="hljs-number">1</span>, <span class="hljs-attr">max</span>: <span class="hljs-number">20</span> }),
    <span class="hljs-function">(<span class="hljs-params">items, size</span>) =&gt;</span> {
      <span class="hljs-keyword">const</span> before = [...items];
      <span class="hljs-keyword">const</span> groups = <span class="hljs-title function_">chunk</span>(items, size);
      assert.<span class="hljs-title function_">deepEqual</span>(groups.<span class="hljs-title function_">flat</span>(), before);
      assert.<span class="hljs-title function_">deepEqual</span>(items, before);
      assert.<span class="hljs-title function_">equal</span>(groups.<span class="hljs-property">length</span>, <span class="hljs-title class_">Math</span>.<span class="hljs-title function_">ceil</span>(items.<span class="hljs-property">length</span> / size));
      <span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> group <span class="hljs-keyword">of</span> groups) {
        assert.<span class="hljs-title function_">ok</span>(group.<span class="hljs-property">length</span> &gt; <span class="hljs-number">0</span> &amp;&amp; group.<span class="hljs-property">length</span> &lt;= size);
      }
      <span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> group <span class="hljs-keyword">of</span> groups.<span class="hljs-title function_">slice</span>(<span class="hljs-number">0</span>, -<span class="hljs-number">1</span>)) {
        assert.<span class="hljs-title function_">equal</span>(group.<span class="hljs-property">length</span>, size);
      }
    },
  ),
  { <span class="hljs-attr">numRuns</span>: <span class="hljs-number">200</span> },
);
</code></pre></div>
<p>将两个代码块放在同一 Node ESM 文件并安装 fast-check 后运行。断言检查元素顺序和内容没有丢失、输入没有被修改、组数正确、组大小符合约定。</p>
<p>只检查 <code>groups.flat()</code> 等于原数组是不够的：直接返回 <code>[items]</code> 也能满足它，却没有按 size 分组。多个独立性质共同约束结果，才能减少“错误实现也满足测试”的空间。</p>
<h2>生成器决定你实际探索了哪里</h2>
<p>示例只生成普通整数数组与 1 到 20 的 size，不能据此宣称支持稀疏数组、任意嵌套对象或巨大数据量。无效 size 也不在生成域中，需要另外的示例或属性测试验证拒绝行为。</p>
<p>对字符串业务，应按真实契约覆盖空字符串、Unicode、组合字符和长度边界；对日期业务，要明确时区和合法日期；对状态机，可以生成操作序列，而不仅是单次参数。</p>
<p>过多 filter 会丢弃大量样本，降低效率并削弱反例缩减。更好的生成器往往直接构造合法输入，再用单独用例处理不合法输入。</p>
<h2>失败后，缩减让反例更容易理解</h2>
<p>当某组数据违反性质，fast-check 会尝试把输入缩减成更简单、仍能触发失败的反例。复杂的 80 项数组可能被缩到几个元素，让越界、重复或空值问题更明显。</p>
<p>缩减结果不保证是数学意义上的全局最小反例，它受生成器和缩减策略影响。应保留失败报告中的 seed、path 和工具版本，以便在相同配置下复现；修改生成器后，相同 seed 不一定仍对应同一输入序列。</p>
<p>修复后可以把这个反例补成清晰的回归示例，属性测试则继续探索其他组合。两者不是二选一。</p>
<h2>有限随机检查不是形式化证明</h2>
<p>200 次通过只说明这次运行没有找到反例，不证明无限输入空间全部正确。错误的性质、遗漏的生成范围以及替身与真实环境差异，都可能留下漏洞。</p>
<p>异步操作应使用对应的异步属性机制并等待断言完成；共享状态要在每次生成用例之间正确重置，否则失败可能来自前一次污染。网络和 UI 也不能仅靠一个纯函数属性替代真实集成测试。</p>
<p>最适合属性测试的目标通常有清晰规律：编码往返、排序保持元素、分组不丢数据、缓存不超过容量等。先把规律写对，再让生成和缩减帮助寻找人手未想到的组合。</p>`};export{e as default};