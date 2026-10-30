var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>LeetCode 394 的规则是 <code>k[encoded_string]</code> 表示方括号里的内容重复 k 次，可以嵌套。比如 <code>3[a]2[bc]</code> 解成 <code>aaabcbc</code>，<code>3[a2[c]]</code> 先把里面的 <code>a2[c]</code> 解成 <code>acc</code>，再重复 3 次得到 <code>accaccacc</code>。</p>
<p>难点是嵌套：读到内层括号时，外层的内容还没拼完，要先放到一边，等内层解完再接回去。这种“先进去的后处理”正好是栈的特点。</p>
<p>具体做法是一边遍历一边维护两个值：当前拼出来的字符串 <code>current</code> 和正在读的数字 <code>num</code>。遇到数字就 <code>num = num * 10 + 数字</code>，因为次数可能有多位，比如 <code>100</code>；遇到 <code>[</code> 就把 <code>current</code> 和 <code>num</code> 压栈，再把两者清空，开始拼括号里的内容；遇到 <code>]</code> 就弹出栈顶，结果是“弹出的前缀 + current 重复 k 次”；遇到字母直接拼到 <code>current</code> 后面。</p>
<p>题目保证输入合法，数字只用来表示重复次数，所以不用处理括号不匹配或 <code>3a</code> 这样的情况。时间复杂度和解码后的字符串长度成正比，栈的深度等于括号嵌套层数。</p>
</blockquote>
<h2>用栈解码</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">decodeString</span>(<span class="hljs-params">s</span>) {
  <span class="hljs-keyword">const</span> stack = [];
  <span class="hljs-keyword">let</span> current = <span class="hljs-string">&#x27;&#x27;</span>;
  <span class="hljs-keyword">let</span> num = <span class="hljs-number">0</span>;

  <span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> ch <span class="hljs-keyword">of</span> s) {
    <span class="hljs-keyword">if</span> (ch &gt;= <span class="hljs-string">&#x27;0&#x27;</span> &amp;&amp; ch &lt;= <span class="hljs-string">&#x27;9&#x27;</span>) {
      <span class="hljs-comment">// 次数可能是多位数，比如 12[a]</span>
      num = num * <span class="hljs-number">10</span> + <span class="hljs-title class_">Number</span>(ch);
    } <span class="hljs-keyword">else</span> <span class="hljs-keyword">if</span> (ch === <span class="hljs-string">&#x27;[&#x27;</span>) {
      stack.<span class="hljs-title function_">push</span>([current, num]);
      current = <span class="hljs-string">&#x27;&#x27;</span>;
      num = <span class="hljs-number">0</span>;
    } <span class="hljs-keyword">else</span> <span class="hljs-keyword">if</span> (ch === <span class="hljs-string">&#x27;]&#x27;</span>) {
      <span class="hljs-keyword">const</span> [prefix, times] = stack.<span class="hljs-title function_">pop</span>();
      current = prefix + current.<span class="hljs-title function_">repeat</span>(times);
    } <span class="hljs-keyword">else</span> {
      current += ch;
    }
  }
  <span class="hljs-keyword">return</span> current;
}

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">decodeString</span>(<span class="hljs-string">&#x27;3[a]2[bc]&#x27;</span>)); <span class="hljs-comment">// aaabcbc</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">decodeString</span>(<span class="hljs-string">&#x27;3[a2[c]]&#x27;</span>)); <span class="hljs-comment">// accaccacc</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">decodeString</span>(<span class="hljs-string">&#x27;2[abc]3[cd]ef&#x27;</span>)); <span class="hljs-comment">// abcabccdcdcdef</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">decodeString</span>(<span class="hljs-string">&#x27;12[x]&#x27;</span>).<span class="hljs-property">length</span>); <span class="hljs-comment">// 12</span>
</code></pre></div>
<p>以 <code>3[a2[c]]</code> 为例走一遍。读到 <code>3</code>，<code>num</code> 是 3；读到 <code>[</code>，把 <code>[&#x27;&#x27;, 3]</code> 压栈，<code>current</code> 清空；读到 <code>a</code>，<code>current</code> 是 <code>a</code>；读到 <code>2</code> 和 <code>[</code>，把 <code>[&#x27;a&#x27;, 2]</code> 压栈，<code>current</code> 又清空；读到 <code>c</code>，<code>current</code> 是 <code>c</code>。</p>
<p>接着第一个 <code>]</code> 弹出 <code>[&#x27;a&#x27;, 2]</code>，<code>current</code> 变成 <code>&#x27;a&#x27; + &#x27;cc&#x27;</code>，也就是 <code>acc</code>。第二个 <code>]</code> 弹出 <code>[&#x27;&#x27;, 3]</code>，<code>current</code> 变成 <code>&#x27;&#x27; + &#x27;acc&#x27;.repeat(3)</code>，得到 <code>accaccacc</code>。</p>
<p>为什么压栈时要把 <code>current</code> 一起存起来？因为 <code>[</code> 之前拼好的部分是外层的前缀，内层解完以后要接在它后面。不存的话，清空 <code>current</code> 时这部分就丢了。为什么 <code>num</code> 也要清零？因为括号里面可能还有自己的数字，不清零就会和外层的次数连成一个数。</p>
<h2>也可以用递归</h2>
<p>每遇到一个 <code>[</code> 就相当于进入一个子问题，所以也可以写成递归：函数负责解码到对应的 <code>]</code> 为止，返回解好的字符串和读到的位置。递归用的是调用栈，思路和显式栈一样。显式栈的好处是嵌套很深时不会受调用栈深度的限制，LeetCode 394 限制输入长度不超过 30，两种写法都没问题。栈的其他基础题见<a href="/questions/ds-stack-problems/">《有效括号、最小栈这类栈题怎样做？》</a>。</p>
<h2>常见追问</h2>
<p><strong>为什么数字要用 num * 10 + 数字 累加？</strong></p>
<blockquote>
<p>因为重复次数可能是多位数，LeetCode 394 的次数范围是 1 到 300。逐个字符读的时候，<code>12</code> 会先读到 <code>1</code> 再读到 <code>2</code>，乘 10 再加才能还原成 12。</p>
</blockquote>
<p><strong>能不能用正则反复替换最内层的括号？</strong></p>
<blockquote>
<p>可以。每次用正则匹配不含括号的 <code>数字[字母]</code>，替换成展开后的字符串，直到没有括号。这种写法简短，但每轮都要扫描整串并生成新字符串，嵌套层数多时比一次遍历慢。面试里一般先写栈的版本。</p>
</blockquote>`};export{e as default};