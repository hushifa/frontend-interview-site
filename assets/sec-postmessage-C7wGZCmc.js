var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p><code>postMessage</code> 是两个窗口之间传消息的接口，比如父页面和它嵌的 iframe。它本身允许跨源，所以发的一方和收的一方都要确认对方是谁。</p>
<p>发送时，第二个参数 <code>targetOrigin</code> 写准确的源，比如 <code>&#x27;https://app.example.com&#x27;</code>。如果目标窗口已经跳到了别的源，浏览器就不投递，数据不会落到错误的页面手里。写成 <code>&#x27;*&#x27;</code> 就等于放弃了这层保护，敏感数据绝不能这样发。</p>
<p>接收时，先完整比较 <code>event.origin</code>，不能用 <code>includes</code> 或 <code>endsWith</code> 做模糊匹配；再比较 <code>event.source</code> 是不是预期的那个窗口。</p>
<p>要注意，来源对了也不代表内容可信。还要校验消息的结构和取值范围，不能把内容交给 <code>eval</code>、<code>innerHTML</code>，或者直接拿来当跳转地址。</p>
</blockquote>
<h2>发送：写清楚发给谁</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js">iframe.<span class="hljs-property">contentWindow</span>.<span class="hljs-title function_">postMessage</span>(
  { <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;theme:set&#x27;</span>, <span class="hljs-attr">version</span>: <span class="hljs-number">1</span>, <span class="hljs-attr">theme</span>: <span class="hljs-string">&#x27;dark&#x27;</span> },
  <span class="hljs-string">&#x27;https://charts.example.com&#x27;</span>,
);
</code></pre></div>
<p>第二个参数为什么这么重要？因为 <code>iframe.contentWindow</code> 只是一个窗口的引用，窗口里现在装的是哪个页面，发送方并不知道。iframe 可能已经被导航到了别的网站。写了具体的源，浏览器会在投递前核对，对不上就丢弃。</p>
<h2>接收：先看是谁发的，再看发了什么</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> frame = <span class="hljs-variable language_">document</span>.<span class="hljs-title function_">querySelector</span>(<span class="hljs-string">&#x27;#chart-frame&#x27;</span>);
<span class="hljs-keyword">const</span> <span class="hljs-variable constant_">CHART_ORIGIN</span> = <span class="hljs-string">&#x27;https://charts.example.com&#x27;</span>;

<span class="hljs-keyword">function</span> <span class="hljs-title function_">onMessage</span>(<span class="hljs-params">event</span>) {
  <span class="hljs-keyword">if</span> (event.<span class="hljs-property">origin</span> !== <span class="hljs-variable constant_">CHART_ORIGIN</span>) <span class="hljs-keyword">return</span>;
  <span class="hljs-keyword">if</span> (event.<span class="hljs-property">source</span> !== frame.<span class="hljs-property">contentWindow</span>) <span class="hljs-keyword">return</span>;

  <span class="hljs-keyword">const</span> data = event.<span class="hljs-property">data</span>;
  <span class="hljs-keyword">if</span> (data?.<span class="hljs-property">type</span> !== <span class="hljs-string">&#x27;chart:resize&#x27;</span> || data.<span class="hljs-property">version</span> !== <span class="hljs-number">1</span>) <span class="hljs-keyword">return</span>;
  <span class="hljs-keyword">if</span> (!<span class="hljs-title class_">Number</span>.<span class="hljs-title function_">isInteger</span>(data.<span class="hljs-property">height</span>) || data.<span class="hljs-property">height</span> &lt; <span class="hljs-number">100</span> || data.<span class="hljs-property">height</span> &gt; <span class="hljs-number">1200</span>) <span class="hljs-keyword">return</span>;

  frame.<span class="hljs-property">style</span>.<span class="hljs-property">height</span> = <span class="hljs-string">\`<span class="hljs-subst">\${data.height}</span>px\`</span>;
}

<span class="hljs-variable language_">window</span>.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;message&#x27;</span>, onMessage);
</code></pre></div>
<p>这里检查了三层。<code>origin</code> 是发送方的源，只包含协议、主机和端口，不含路径。可是同一个源下可能开着好几个窗口，所以再用 <code>source</code> 确认是不是我们嵌的那个 iframe。最后检查消息本身，类型、版本、数字范围都要对。</p>
<p>还有一点是设计上的：这个接收方只允许对方调整高度，不提供“执行任意命令”这类接口。能做的事越少，被利用的空间就越小。</p>
<h2>为什么不能用 includes 判断来源</h2>
<p>下面这个例子可以直接在 Node 里运行，看看模糊匹配会放过什么：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> origin = <span class="hljs-string">&#x27;https://example.com.attacker.test&#x27;</span>;
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(origin.<span class="hljs-title function_">includes</span>(<span class="hljs-string">&#x27;example.com&#x27;</span>)); <span class="hljs-comment">// true</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(origin === <span class="hljs-string">&#x27;https://example.com&#x27;</span>); <span class="hljs-comment">// false</span>
</code></pre></div>
<p><code>example.com.attacker.test</code> 是攻击者自己注册的域名，可它包含 <code>example.com</code> 这几个字，<code>includes</code> 就判断为通过了。所以来源必须用完整的字符串精确比较，或者和一个白名单集合比较。</p>
<h2>还有哪些常见漏洞</h2>
<p>收到消息就执行 <code>location.href = data.url</code>，攻击者可以把它变成开放重定向，或者传一个 <code>javascript:</code> 地址执行脚本。把 <code>data.html</code> 直接写进 <code>innerHTML</code>，就形成了 DOM 型 XSS。回复消息时用 <code>&#x27;*&#x27;</code>，用户数据可能发给了一个已经跳到别处的窗口。</p>
<h2>需要长期双向通信时</h2>
<p>如果两个窗口要频繁来回传消息，可以用 <code>MessageChannel</code> 建一条专用通道。握手时校验一次来源，之后通过 <code>port</code> 收发，不用每条消息都在全局的 <code>message</code> 事件上重新匹配。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> { port1, port2 } = <span class="hljs-keyword">new</span> <span class="hljs-title class_">MessageChannel</span>();
frame.<span class="hljs-property">contentWindow</span>.<span class="hljs-title function_">postMessage</span>({ <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;connect&#x27;</span> }, <span class="hljs-variable constant_">CHART_ORIGIN</span>, [port2]);
port1.<span class="hljs-property">onmessage</span> = <span class="hljs-function">(<span class="hljs-params">event</span>) =&gt;</span> <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-string">&#x27;来自图表&#x27;</span>, event.<span class="hljs-property">data</span>);
</code></pre></div>
<p><code>port2</code> 作为第三个参数被转交给 iframe，之后只有拿到它的那一方能往 <code>port1</code> 发消息。</p>
<h2>常见追问</h2>
<p><strong>同源页面之间也要校验吗？</strong></p>
<blockquote>
<p>要。同源窗口之间确实可以直接访问彼此，但 <code>message</code> 事件可能来自任何持有你窗口引用的页面，不一定是同源的。</p>
</blockquote>
<p><strong><code>postMessage</code> 能传哪些数据？</strong></p>
<blockquote>
<p>结构化克隆算法支持的类型都可以，比如普通对象、数组、<code>Date</code>、<code>Map</code>。函数和 DOM 节点不能传。</p>
</blockquote>`};export{e as default};