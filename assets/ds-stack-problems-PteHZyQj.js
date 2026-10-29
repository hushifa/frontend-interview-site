var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>判断 <code>({[]})</code> 这样的括号串是否合法：读到左括号先记下来，读到右括号时，它必须和“最近一个还没配对的左括号”配成一对。“最近记下的先被处理”正是栈的特点，也就是后进先出。JS 里用数组的 <code>push</code> 入栈、<code>pop</code> 出栈就行。</p>
<p>有效括号的做法是：左括号入栈；右括号就弹出栈顶，看是不是对应的左括号，不是就直接返回 false，栈已经空了也返回 false；扫完以后栈必须是空的，否则说明有左括号没被闭合。每个字符进出栈一次，O(n)。</p>
<p>最小栈要求 <code>push</code>、<code>pop</code>、<code>top</code>、<code>getMin</code> 都是 O(1)。难点在 <code>getMin</code>：只存一个最小值变量不够，因为最小值被弹出后，没法知道次小的是谁。办法是再开一个辅助栈，主栈每压入一个数，辅助栈就压入“当前最小值”，两个栈同进同出，<code>getMin</code> 读辅助栈栈顶。</p>
<p>要注意空栈的情况：数组 <code>pop</code> 空数组返回 <code>undefined</code>，不会报错，所以括号题里不检查就会把 <code>undefined</code> 当成栈顶去比较。栈还常用来做“下一个更大元素”这类单调栈题，以及把递归改写成循环。</p>
</blockquote>
<h2>有效括号</h2>
<p>先看代码怎样处理右括号：用一个 Map 把右括号映射到它应当配对的左括号，然后和弹出的栈顶比较。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> pairs = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Map</span>([
  [<span class="hljs-string">&#x27;)&#x27;</span>, <span class="hljs-string">&#x27;(&#x27;</span>],
  [<span class="hljs-string">&#x27;]&#x27;</span>, <span class="hljs-string">&#x27;[&#x27;</span>],
  [<span class="hljs-string">&#x27;}&#x27;</span>, <span class="hljs-string">&#x27;{&#x27;</span>],
]);

<span class="hljs-keyword">function</span> <span class="hljs-title function_">isValid</span>(<span class="hljs-params">s</span>) {
  <span class="hljs-keyword">const</span> stack = [];
  <span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> char <span class="hljs-keyword">of</span> s) {
    <span class="hljs-keyword">if</span> (!pairs.<span class="hljs-title function_">has</span>(char)) {
      stack.<span class="hljs-title function_">push</span>(char); <span class="hljs-comment">// 左括号，等待以后配对</span>
    } <span class="hljs-keyword">else</span> <span class="hljs-keyword">if</span> (stack.<span class="hljs-title function_">pop</span>() !== pairs.<span class="hljs-title function_">get</span>(char)) {
      <span class="hljs-keyword">return</span> <span class="hljs-literal">false</span>; <span class="hljs-comment">// 栈顶不匹配，或者栈已经空了</span>
    }
  }
  <span class="hljs-keyword">return</span> stack.<span class="hljs-property">length</span> === <span class="hljs-number">0</span>; <span class="hljs-comment">// 还有没闭合的左括号就不合法</span>
}

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">isValid</span>(<span class="hljs-string">&#x27;()[]{}&#x27;</span>)); <span class="hljs-comment">// true</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">isValid</span>(<span class="hljs-string">&#x27;({[]})&#x27;</span>)); <span class="hljs-comment">// true</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">isValid</span>(<span class="hljs-string">&#x27;(]&#x27;</span>)); <span class="hljs-comment">// false</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">isValid</span>(<span class="hljs-string">&#x27;([)]&#x27;</span>)); <span class="hljs-comment">// false</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">isValid</span>(<span class="hljs-string">&#x27;((&#x27;</span>)); <span class="hljs-comment">// false</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">isValid</span>(<span class="hljs-string">&#x27;)&#x27;</span>)); <span class="hljs-comment">// false</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">isValid</span>(<span class="hljs-string">&#x27;&#x27;</span>)); <span class="hljs-comment">// true</span>
</code></pre></div>
<p><code>([)]</code> 为什么不合法？三种括号的个数都对得上，但读到 <code>)</code> 时，栈顶是 <code>[</code>，不是 <code>(</code>。括号必须按嵌套顺序闭合，这正是只数个数做不到、而栈能做到的地方。</p>
<p><code>)</code> 开头为什么能正确返回 false？栈是空的，<code>[].pop()</code> 返回 <code>undefined</code>，它不等于 <code>(</code>，于是走到 <code>return false</code>。这里刚好利用了空数组 <code>pop</code> 不报错的行为；换成别的语言，或者把栈顶取出来另做处理时，要先判断栈是否为空。</p>
<p>空字符串为什么是 true？一个括号都没有，没有任何不配对的情况，循环不执行，栈是空的。题目通常也这样约定。</p>
<h2>最小栈</h2>
<p>下面的实现里，<code>mins</code> 的每一项表示“主栈从底到这一层为止的最小值”。看 <code>push</code> 怎样算这一项。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">class</span> <span class="hljs-title class_">MinStack</span> {
  <span class="hljs-title function_">constructor</span>(<span class="hljs-params"></span>) {
    <span class="hljs-variable language_">this</span>.<span class="hljs-property">items</span> = [];
    <span class="hljs-variable language_">this</span>.<span class="hljs-property">mins</span> = [];
  }
  <span class="hljs-title function_">push</span>(<span class="hljs-params">value</span>) {
    <span class="hljs-variable language_">this</span>.<span class="hljs-property">items</span>.<span class="hljs-title function_">push</span>(value);
    <span class="hljs-keyword">const</span> currentMin = <span class="hljs-variable language_">this</span>.<span class="hljs-property">mins</span>.<span class="hljs-property">length</span> === <span class="hljs-number">0</span> ? value : <span class="hljs-title class_">Math</span>.<span class="hljs-title function_">min</span>(value, <span class="hljs-variable language_">this</span>.<span class="hljs-property">mins</span>.<span class="hljs-title function_">at</span>(-<span class="hljs-number">1</span>));
    <span class="hljs-variable language_">this</span>.<span class="hljs-property">mins</span>.<span class="hljs-title function_">push</span>(currentMin);
  }
  <span class="hljs-title function_">pop</span>(<span class="hljs-params"></span>) {
    <span class="hljs-variable language_">this</span>.<span class="hljs-property">mins</span>.<span class="hljs-title function_">pop</span>();
    <span class="hljs-keyword">return</span> <span class="hljs-variable language_">this</span>.<span class="hljs-property">items</span>.<span class="hljs-title function_">pop</span>();
  }
  <span class="hljs-title function_">top</span>(<span class="hljs-params"></span>) {
    <span class="hljs-keyword">return</span> <span class="hljs-variable language_">this</span>.<span class="hljs-property">items</span>.<span class="hljs-title function_">at</span>(-<span class="hljs-number">1</span>);
  }
  <span class="hljs-title function_">getMin</span>(<span class="hljs-params"></span>) {
    <span class="hljs-keyword">return</span> <span class="hljs-variable language_">this</span>.<span class="hljs-property">mins</span>.<span class="hljs-title function_">at</span>(-<span class="hljs-number">1</span>);
  }
}

<span class="hljs-keyword">const</span> stack = <span class="hljs-keyword">new</span> <span class="hljs-title class_">MinStack</span>();
stack.<span class="hljs-title function_">push</span>(<span class="hljs-number">3</span>);
stack.<span class="hljs-title function_">push</span>(<span class="hljs-number">1</span>);
stack.<span class="hljs-title function_">push</span>(<span class="hljs-number">1</span>);
stack.<span class="hljs-title function_">push</span>(<span class="hljs-number">2</span>);
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(stack.<span class="hljs-title function_">getMin</span>()); <span class="hljs-comment">// 1</span>
stack.<span class="hljs-title function_">pop</span>(); <span class="hljs-comment">// 弹出 2</span>
stack.<span class="hljs-title function_">pop</span>(); <span class="hljs-comment">// 弹出一个 1</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(stack.<span class="hljs-title function_">getMin</span>()); <span class="hljs-comment">// 1</span>
stack.<span class="hljs-title function_">pop</span>(); <span class="hljs-comment">// 弹出另一个 1</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(stack.<span class="hljs-title function_">getMin</span>()); <span class="hljs-comment">// 3</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(stack.<span class="hljs-title function_">top</span>()); <span class="hljs-comment">// 3</span>
stack.<span class="hljs-title function_">pop</span>();
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(stack.<span class="hljs-title function_">getMin</span>()); <span class="hljs-comment">// undefined</span>
</code></pre></div>
<p>为什么不能只用一个变量记最小值？压入 3、1 以后最小值是 1；把 1 弹出去，最小值应该变回 3，可变量里只有 1，要找回 3 只能把整个栈扫一遍，就不是 O(1) 了。辅助栈相当于把每一层的历史最小值都存下来，弹出时跟着退回上一层。</p>
<p>重复的最小值为什么没出问题？例子里压了两个 1，辅助栈里也有两层是 1。弹出第一个 1 后，辅助栈顶还是 1，与主栈里剩下的那个 1 对应。有些写法为了省空间，只在新值小于当前最小值时才往辅助栈压，这种写法必须用“小于等于”，否则第一个 1 弹出时辅助栈会把 1 也弹掉，最小值错变成 3。</p>
<p><code>at(-1)</code> 是什么？<code>Array.prototype.at</code> 接受负数下标，<code>-1</code> 表示最后一个元素，等价于 <code>arr[arr.length - 1]</code>；数组为空时返回 <code>undefined</code>，所以最后一行打印 <code>undefined</code>。</p>
<h2>什么样的题适合用栈</h2>
<p>题目里出现“最近的”“配对”“嵌套”这类关系时，往往适合用栈。比如解析 HTML 标签是否正确闭合、计算逆波兰表达式、浏览器的后退历史，都是后进来的先处理。</p>
<p>另一类是单调栈：栈里的元素保持单调递增或递减，用来求“每个元素右边第一个比它大的数”。新元素进来时，把栈里比它小的元素都弹出，这些被弹出的元素的答案就是这个新元素。每个元素最多进出一次，整体 O(n)。</p>
<h2>常见追问</h2>
<p><strong>JS 数组当栈用，性能有问题吗？</strong></p>
<blockquote>
<p><code>push</code> 和 <code>pop</code> 只在数组末尾操作，不需要移动其他元素，当栈用没问题。要小心的是当队列用：<code>shift</code> 从头部删除，其他元素都要往前挪，大量数据时会慢，可以用下标记录队头来代替。</p>
</blockquote>
<p><strong>怎样用两个栈实现队列？</strong></p>
<blockquote>
<p>一个栈负责入队，一个负责出队。出队时如果出队栈是空的，就把入队栈的元素全部倒过去，顺序刚好反过来，栈顶就是最早入队的元素。每个元素最多被倒一次，所以均摊下来每个操作是 O(1)。</p>
</blockquote>`};export{e as default};