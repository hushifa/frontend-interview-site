var e={answerHtml:`<p>前序遍历先访问当前节点，再按顺序遍历它的子树。递归写法直观，但很深的树可能超出调用栈；显式栈可以把待访问节点放到堆上维护。</p>
<p>下面的教学实现约定节点有 value 和可选 children 数组，输入是无环树，不在遍历时修改结构。空根返回空数组；子节点反向入栈，弹出时才会保持从左到右顺序。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">preorder</span>(<span class="hljs-params">root</span>) {
  <span class="hljs-keyword">if</span> (root == <span class="hljs-literal">null</span>) <span class="hljs-keyword">return</span> [];
  <span class="hljs-keyword">const</span> stack = [root];
  <span class="hljs-keyword">const</span> values = [];
  <span class="hljs-keyword">while</span> (stack.<span class="hljs-property">length</span> &gt; <span class="hljs-number">0</span>) {
    <span class="hljs-keyword">const</span> node = stack.<span class="hljs-title function_">pop</span>();
    values.<span class="hljs-title function_">push</span>(node.<span class="hljs-property">value</span>);
    <span class="hljs-keyword">const</span> children = node.<span class="hljs-property">children</span> ?? [];
    <span class="hljs-keyword">for</span> (<span class="hljs-keyword">let</span> index = children.<span class="hljs-property">length</span> - <span class="hljs-number">1</span>; index &gt;= <span class="hljs-number">0</span>; index--) {
      stack.<span class="hljs-title function_">push</span>(children[index]);
    }
  }
  <span class="hljs-keyword">return</span> values;
}
</code></pre></div>
<p>对 n 个节点，这种遍历访问每个节点一次，时间为 O(n)。本实现保存结果需要 O(n) 空间，待访问栈在宽树下也可能达到 O(n)，不能笼统说所有非递归 DFS 都只有 O(树高) 空间。</p>
<p>它不是通用图遍历：有环或共享子节点时，需要先决定去重规则，再加入访问记录。参考文档解释栈使用的数组 API；遍历代码为本项目编写，并用顺序、空树和深树用例验证。</p>
<p>手写题先明确输入约束、输出契约、重复值、空输入和异常行为，再选择数据结构。实现之后用边界样例验证，不要只运行一个正常输入；异步题还要验证顺序、取消和并发上限。</p>
<p>复杂度应同时说明时间、空间和额外资源。教学实现适合解释原理，生产代码还需要考虑可读性、监控、错误处理和已有标准库能力。</p>
<p>实际使用手写实现前，先确认数据量、调用频率和取消要求。小数据的清晰实现可能比复杂优化更合适；数据规模上来后，再根据测量结果决定是否使用标准库、缓存或专门的数据结构。</p>`};export{e as default};