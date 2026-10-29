var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>一个用户可能同时有“读、写、删除、管理”几种权限，与其存四个布尔值，不如用一个数字的四个二进制位表示：第 0 位是读，第 1 位是写，依此类推。<code>READ | WRITE</code> 组合出 <code>0b011</code>，<code>perms &amp; WRITE</code> 不为 0 就说明有写权限。这就是位掩码。DOM 的 <code>Node.compareDocumentPosition()</code> 返回值也是位掩码，MDN 要求用 <code>&amp;</code> 检查其中的位。</p>
<p>前提是要知道 JS 位运算的规则：Number 平时是 64 位浮点数，但 <code>|</code>、<code>&amp;</code>、<code>^</code>、<code>~</code>、<code>&lt;&lt;</code>、<code>&gt;&gt;</code> 会先把操作数转成 32 位有符号整数，小数部分直接丢掉，超出 32 位的高位也丢掉，结果是一个 32 位有符号整数。所以位掩码最多只能放 32 个标志，而且用到第 31 位时结果会变成负数。</p>
<p>最常见的陷阱是用 <code>x | 0</code> 或 <code>~~x</code> 取整。对小数字它确实等于向零取整，可超出 -2147483648 到 2147483647 的数会被截断：<code>3e9 | 0</code> 得到 <code>-1294967296</code>。时间戳、文件字节数这类大数很容易越界，取整应该用 <code>Math.trunc</code>，MDN 也是这样建议的。</p>
<p><code>&gt;&gt;&gt;</code> 是无符号右移，左边补 0，结果被当成无符号 32 位整数，所以总是非负，<code>-1 &gt;&gt;&gt; 0</code> 是 <code>4294967295</code>。它常用来把一个数转成无符号 32 位整数，比如哈希函数里避免出现负数。注意 <code>&gt;&gt;&gt;</code> 不支持 BigInt，其他位运算符两边都是 BigInt 时可以按任意位宽计算。</p>
</blockquote>
<h2>用位掩码表示权限</h2>
<p>看三种操作分别用哪个运算符：组合用 <code>|</code>，检查用 <code>&amp;</code>，移除用 <code>&amp; ~</code>。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> <span class="hljs-variable constant_">READ</span> = <span class="hljs-number">1</span> &lt;&lt; <span class="hljs-number">0</span>; <span class="hljs-comment">// 0b0001</span>
<span class="hljs-keyword">const</span> <span class="hljs-variable constant_">WRITE</span> = <span class="hljs-number">1</span> &lt;&lt; <span class="hljs-number">1</span>; <span class="hljs-comment">// 0b0010</span>
<span class="hljs-keyword">const</span> <span class="hljs-variable constant_">DELETE</span> = <span class="hljs-number">1</span> &lt;&lt; <span class="hljs-number">2</span>; <span class="hljs-comment">// 0b0100</span>
<span class="hljs-keyword">const</span> <span class="hljs-variable constant_">ADMIN</span> = <span class="hljs-number">1</span> &lt;&lt; <span class="hljs-number">3</span>; <span class="hljs-comment">// 0b1000</span>

<span class="hljs-keyword">const</span> <span class="hljs-title function_">has</span> = (<span class="hljs-params">perms, flag</span>) =&gt; (perms &amp; flag) !== <span class="hljs-number">0</span>;
<span class="hljs-keyword">const</span> <span class="hljs-title function_">add</span> = (<span class="hljs-params">perms, flag</span>) =&gt; perms | flag;
<span class="hljs-keyword">const</span> <span class="hljs-title function_">remove</span> = (<span class="hljs-params">perms, flag</span>) =&gt; perms &amp; ~flag;

<span class="hljs-keyword">let</span> perms = <span class="hljs-variable constant_">READ</span> | <span class="hljs-variable constant_">WRITE</span>;
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(perms, perms.<span class="hljs-title function_">toString</span>(<span class="hljs-number">2</span>)); <span class="hljs-comment">// 3 11</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">has</span>(perms, <span class="hljs-variable constant_">WRITE</span>), <span class="hljs-title function_">has</span>(perms, <span class="hljs-variable constant_">DELETE</span>)); <span class="hljs-comment">// true false</span>

perms = <span class="hljs-title function_">add</span>(perms, <span class="hljs-variable constant_">DELETE</span>);
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(perms.<span class="hljs-title function_">toString</span>(<span class="hljs-number">2</span>)); <span class="hljs-comment">// 111</span>
perms = <span class="hljs-title function_">remove</span>(perms, <span class="hljs-variable constant_">WRITE</span>);
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(perms.<span class="hljs-title function_">toString</span>(<span class="hljs-number">2</span>)); <span class="hljs-comment">// 101</span>
perms = <span class="hljs-title function_">remove</span>(perms, <span class="hljs-variable constant_">WRITE</span>); <span class="hljs-comment">// 移除一个本来就没有的权限</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(perms.<span class="hljs-title function_">toString</span>(<span class="hljs-number">2</span>)); <span class="hljs-comment">// 101</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">has</span>(<span class="hljs-number">0</span>, <span class="hljs-variable constant_">READ</span>), <span class="hljs-title function_">has</span>(<span class="hljs-variable constant_">READ</span> | <span class="hljs-variable constant_">WRITE</span> | <span class="hljs-variable constant_">DELETE</span> | <span class="hljs-variable constant_">ADMIN</span>, <span class="hljs-variable constant_">ADMIN</span>)); <span class="hljs-comment">// false true</span>
</code></pre></div>
<p>为什么移除要写 <code>&amp; ~flag</code>，而不是减法？<code>~WRITE</code> 把 <code>0b0010</code> 的每一位取反，只有第 1 位是 0，其他位都是 1，和它做 <code>&amp;</code> 就只清掉第 1 位，其他权限不变。减法在权限本来就没有时会出错：<code>0b101 - WRITE</code> 得到 <code>0b011</code>，平白多出写权限、丢了删除权限；而 <code>&amp; ~</code> 对没有的权限什么也不做，例子里重复移除仍是 <code>101</code>。</p>
<p>检查为什么写 <code>(perms &amp; flag) !== 0</code>？<code>&amp;</code> 的结果是数字，有这个位时等于 <code>flag</code> 本身，没有时是 0。加括号是因为 <code>!==</code> 的优先级比 <code>&amp;</code> 高，不加括号会先算 <code>flag !== 0</code>。</p>
<h2><code>| 0</code> 取整为什么会出错</h2>
<p>下面把同样的数分别用 <code>| 0</code> 和 <code>Math.trunc</code> 处理，看从哪里开始结果不一样。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-number">3.7</span> | <span class="hljs-number">0</span>, <span class="hljs-title class_">Math</span>.<span class="hljs-title function_">trunc</span>(<span class="hljs-number">3.7</span>)); <span class="hljs-comment">// 3 3</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(-<span class="hljs-number">3.7</span> | <span class="hljs-number">0</span>, <span class="hljs-title class_">Math</span>.<span class="hljs-title function_">trunc</span>(-<span class="hljs-number">3.7</span>)); <span class="hljs-comment">// -3 -3</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-number">2147483647</span> | <span class="hljs-number">0</span>); <span class="hljs-comment">// 2147483647</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-number">2147483648</span> | <span class="hljs-number">0</span>); <span class="hljs-comment">// -2147483648</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-number">3e9</span> | <span class="hljs-number">0</span>, <span class="hljs-title class_">Math</span>.<span class="hljs-title function_">trunc</span>(<span class="hljs-number">3e9</span>)); <span class="hljs-comment">// -1294967296 3000000000</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-number">2</span> ** <span class="hljs-number">32</span> + <span class="hljs-number">5</span> | <span class="hljs-number">0</span>); <span class="hljs-comment">// 5</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(~~<span class="hljs-number">3.7</span>); <span class="hljs-comment">// 3</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title class_">NaN</span> | <span class="hljs-number">0</span>, <span class="hljs-title class_">Infinity</span> | <span class="hljs-number">0</span>); <span class="hljs-comment">// 0 0</span>
</code></pre></div>
<p><code>2147483648 | 0</code> 为什么变成负数？32 位有符号整数能表示的最大值是 2³¹ - 1，也就是 2147483647。2³¹ 的二进制在第 31 位是 1，而第 31 位在有符号整数里是符号位，于是被解读为 -2³¹。<code>3e9</code> 也一样，它在 2³¹ 和 2³² 之间，结果是 <code>3e9 - 2³²</code>，即 -1294967296。</p>
<p><code>2 ** 32 + 5 | 0</code> 为什么是 5？超出 32 位的高位直接被丢掉，2³² 正好是第 32 位，丢掉以后只剩 5。这类错误不会报错，只会悄悄得到一个错的数，所以很难发现。</p>
<p><code>NaN</code> 和 <code>Infinity</code> 转成 32 位整数时都变成 0，<code>Math.trunc</code> 则会保留 <code>NaN</code> 和 <code>Infinity</code>。所以 <code>| 0</code> 和 <code>Math.trunc</code> 只在 32 位范围内的有限数上结果一致。</p>
<h2><code>&gt;&gt;&gt;</code> 和 <code>&gt;&gt;</code> 有什么区别</h2>
<p>两个都是右移，区别在左边补什么：<code>&gt;&gt;</code> 补符号位，负数右移仍是负数，相当于除以 2 向下取整；<code>&gt;&gt;&gt;</code> 总是补 0，结果按无符号整数解读。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-number">5</span> &gt;&gt; <span class="hljs-number">1</span>, -<span class="hljs-number">5</span> &gt;&gt; <span class="hljs-number">1</span>); <span class="hljs-comment">// 2 -3</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(-<span class="hljs-number">5</span> &gt;&gt;&gt; <span class="hljs-number">1</span>); <span class="hljs-comment">// 2147483645</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(-<span class="hljs-number">1</span> &gt;&gt;&gt; <span class="hljs-number">0</span>); <span class="hljs-comment">// 4294967295</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>((-<span class="hljs-number">1</span> &gt;&gt;&gt; <span class="hljs-number">0</span>).<span class="hljs-title function_">toString</span>(<span class="hljs-number">2</span>).<span class="hljs-property">length</span>); <span class="hljs-comment">// 32</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-number">1</span> &lt;&lt; <span class="hljs-number">31</span>); <span class="hljs-comment">// -2147483648</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-number">100</span> &gt;&gt;&gt; <span class="hljs-number">32</span>); <span class="hljs-comment">// 100</span>
</code></pre></div>
<p><code>-5 &gt;&gt; 1</code> 为什么是 -3 而不是 -2？<code>&gt;&gt;</code> 相当于除以 2 后向负无穷取整，-2.5 向下取整是 -3。<code>-5 &gt;&gt;&gt; 1</code> 左边补 0，原来的负数被当成很大的无符号数，所以结果是 2147483645。</p>
<p><code>100 &gt;&gt;&gt; 32</code> 为什么还是 100？右操作数会先转成无符号 32 位整数，再对 32 取模，所以移位位数只能是 0 到 31。移 32 位等于移 0 位，不是把数移成 0。</p>
<p><code>1 &lt;&lt; 31</code> 是负数，所以位掩码只用第 0 到 30 位时结果始终是正数；第 31 位也能用，但打印出来是负数，要用 <code>&gt;&gt;&gt; 0</code> 才能按无符号显示。</p>
<h2>常见追问</h2>
<p><strong>超过 32 个标志怎么办？</strong></p>
<blockquote>
<p>可以拆成几个数字各管 32 位，或者用 BigInt：<code>1n &lt;&lt; 40n</code> 这样的 BigInt 位运算没有 32 位限制，<code>|</code>、<code>&amp;</code>、<code>~</code> 都支持 BigInt。但两边必须都是 BigInt，混用 Number 会抛 TypeError，而且 <code>&gt;&gt;&gt;</code> 不能用于 BigInt。数字精度的其他边界见<a href="/questions/js-number-bigint/">《浮点精度、安全整数和 BigInt 有哪些边界？》</a>。</p>
</blockquote>
<p><strong>怎样判断一个正整数是不是 2 的幂？</strong></p>
<blockquote>
<p>2 的幂的二进制只有一个 1，比如 8 是 <code>1000</code>；减 1 以后是 <code>0111</code>，和原数没有共同的位。所以 <code>n &gt; 0 &amp;&amp; (n &amp; (n - 1)) === 0</code> 成立就是 2 的幂。这个写法同样受 32 位限制，只适用于 2³¹ 以内的正整数。</p>
</blockquote>
<p><strong>用异或交换两个变量还值得用吗？</strong></p>
<blockquote>
<p><code>a ^= b; b ^= a; a ^= b</code> 能不用临时变量交换整数，但只适用于 32 位整数，可读性也差。JS 里直接写解构赋值 <code>[a, b] = [b, a]</code> 更清楚，对任何类型的值都有效。</p>
</blockquote>`};export{e as default};