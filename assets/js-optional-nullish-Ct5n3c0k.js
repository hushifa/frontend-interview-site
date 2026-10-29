var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>区别在于什么算“没有值”。<code>a ?? b</code> 只在 <code>a</code> 是 <code>null</code> 或 <code>undefined</code> 时才用 <code>b</code>；<code>a || b</code> 只要 <code>a</code> 是假值就用 <code>b</code>，<code>0</code>、空字符串、<code>false</code> 都算。</p>
<p>可选链也一样。<code>a?.b</code> 在 <code>a</code> 是 <code>null</code> 或 <code>undefined</code> 时，整条链停下来，返回 <code>undefined</code>；而 <code>a &amp;&amp; a.b</code> 在 <code>a</code> 是 <code>0</code> 或空字符串时，返回的是这个假值本身。<code>?.</code> 还能用在函数调用和方括号取值上，比如 <code>fn?.()</code>、<code>obj?.[key]</code>。</p>
<p>有两点要注意。第一，短路会跳过整条链后面的所有部分，连函数参数都不会求值。第二，<code>??</code> 不能直接和 <code>||</code>、<code>&amp;&amp;</code> 混在一起写，必须加括号。</p>
<p>另外它们都不会吞掉异常，属性读取或函数调用里真的抛了错，照样会抛出来。</p>
</blockquote>
<h2>为什么用 || 设默认值会出错</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-number">0</span> ?? <span class="hljs-number">10</span>); <span class="hljs-comment">// 0</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-number">0</span> || <span class="hljs-number">10</span>); <span class="hljs-comment">// 10</span>
<span class="hljs-keyword">const</span> user = <span class="hljs-literal">null</span>;
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(user?.<span class="hljs-property">profile</span>?.<span class="hljs-property">name</span> ?? <span class="hljs-string">&#x27;匿名&#x27;</span>); <span class="hljs-comment">// 匿名</span>
</code></pre></div>
<p>同样是 <code>0</code> 后面跟默认值 10，<code>??</code> 保留了 0，<code>||</code> 却换成了 10。</p>
<p><code>||</code> 判断的是真假，<code>0</code> 是假值，所以被当成“没有”。可是数量、页码、开关这些字段，合法值本来就可能是 <code>0</code> 或 <code>false</code>，用 <code>||</code> 设默认值就会把它们覆盖掉。<code>??</code> 只关心是不是 <code>null</code> 或 <code>undefined</code>，正好符合“没传就用默认值”的意思。</p>
<p>最后一行是两者配合的常见写法：<code>user</code> 是 <code>null</code>，<code>?.</code> 让整条链返回 <code>undefined</code>，再由 <code>??</code> 换成“匿名”。</p>
<h2>可选链能管到哪一步</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> data = { <span class="hljs-attr">list</span>: [] };
data.<span class="hljs-property">list</span>?.[<span class="hljs-number">0</span>]?.<span class="hljs-property">name</span>;  <span class="hljs-comment">// undefined</span>
data.<span class="hljs-property">callback</span>?.();     <span class="hljs-comment">// undefined，不会抛 &quot;not a function&quot;</span>
data.<span class="hljs-property">missing</span>.<span class="hljs-property">deep</span>;     <span class="hljs-comment">// TypeError，没有写 ?.</span>

<span class="hljs-keyword">let</span> count = <span class="hljs-number">0</span>;
<span class="hljs-literal">null</span>?.<span class="hljs-title function_">method</span>(count++);
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(count); <span class="hljs-comment">// 0，参数没有求值</span>
</code></pre></div>
<p><code>data.callback?.()</code> 没有报错，因为 <code>callback</code> 是 <code>undefined</code>，调用被跳过了。可是 <code>data.missing.deep</code> 报了 <code>TypeError</code>，因为没有写 <code>?.</code>，从 <code>undefined</code> 上读 <code>deep</code> 当然报错。</p>
<p>最后一段可以看出短路有多彻底。<code>null?.method(count++)</code> 不光没调用 <code>method</code>，连参数 <code>count++</code> 都没执行，<code>count</code> 还是 0。</p>
<p>使用时要清楚它的范围。<code>?.</code> 只检查它左边紧挨着的那个值。<code>a?.b.c</code> 里，如果 <code>a</code> 存在而 <code>b</code> 是 <code>undefined</code>，读 <code>.c</code> 照样报错，要写成 <code>a?.b?.c</code>。<code>fn?.()</code> 也只在 <code>fn</code> 是 <code>null</code> 或 <code>undefined</code> 时跳过，<code>fn</code> 是数字这种别的非函数值，还是会抛 <code>TypeError</code>。可选链不能放在赋值左边，<code>obj?.a = 1</code> 是语法错误。另外 getter 或函数内部抛出的异常，也不会被吞掉。</p>
<h2>?? 和 || 为什么不能直接混写</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> value = (a || b) ?? c; <span class="hljs-comment">// 必须加括号</span>
</code></pre></div>
<p>直接写 <code>a ?? b || c</code> 是语法错误。因为很难一眼看出到底先算哪个，规范干脆要求加括号，把意思写明白。</p>
<h2>??= 这类赋值运算符怎样用</h2>
<p><code>a ??= b</code> 表示 <code>a</code> 是 <code>null</code> 或 <code>undefined</code> 时才把 <code>b</code> 赋给它。<code>a ||= b</code> 是 <code>a</code> 为假值时才赋值，<code>a &amp;&amp;= b</code> 是 <code>a</code> 为真值时才赋值。</p>
<p>它们也是短路的。条件不满足时，不只是值没变，而是根本没有对 <code>a</code> 做写入操作，所以如果 <code>a</code> 是一个带 setter 的属性，setter 也不会被触发。</p>
<h2>常见追问</h2>
<p><strong>可选链会掩盖 bug 吗？</strong></p>
<blockquote>
<p>会。本来一定该有的数据，如果也加上 <code>?.</code>，它缺失时不会马上报错，而是变成 <code>undefined</code> 一路传下去，到很远的地方才出问题，更难查。所以必须存在的数据不要加 <code>?.</code>。</p>
</blockquote>
<p><strong><code>document.all ?? 1</code> 返回什么？</strong></p>
<blockquote>
<p>返回 <code>document.all</code> 本身。它是一个历史遗留的特殊对象，<code>typeof</code> 结果是 <code>&#x27;undefined&#x27;</code>，但它并不真的是 <code>undefined</code>，所以 <code>??</code> 不会换成 1。</p>
</blockquote>`};export{e as default};