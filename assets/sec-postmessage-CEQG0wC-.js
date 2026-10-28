var e={answerHtml:`<h2>简答</h2>
<ul>
<li><code>targetOrigin</code> 写准确的源，例如 <code>&#x27;https://app.example.com&#x27;</code>。目标窗口已导航到别的源时，浏览器不会投递，防止数据泄露给错误的页面。</li>
<li>用 <code>&#x27;*&#x27;</code> 等于放弃这层保护，敏感数据绝不能这样发送。</li>
<li>接收方完整比较 <code>event.origin</code>，不能用 <code>includes</code> 或 <code>endsWith</code> 做模糊匹配；再比较 <code>event.source</code> 是否是预期的窗口。</li>
<li>来源正确也要校验消息结构和取值范围，不把内容交给 <code>eval</code>、<code>innerHTML</code> 或用作跳转地址。</li>
</ul>
<h2>发送</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js">iframe.<span class="hljs-property">contentWindow</span>.<span class="hljs-title function_">postMessage</span>(
  { <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;theme:set&#x27;</span>, <span class="hljs-attr">version</span>: <span class="hljs-number">1</span>, <span class="hljs-attr">theme</span>: <span class="hljs-string">&#x27;dark&#x27;</span> },
  <span class="hljs-string">&#x27;https://charts.example.com&#x27;</span>,
);
</code></pre></div>
<h2>接收</h2>
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
<ul>
<li><code>origin</code> 只是源（协议、主机、端口），不含路径。</li>
<li>同一源可能有多个窗口，<code>source</code> 用来确认是哪一个。</li>
<li>消息只允许调整高度，不提供&quot;执行任意命令&quot;这类接口。</li>
</ul>
<h2>常见漏洞</h2>
<ul>
<li>用 <code>event.origin.includes(&#x27;example.com&#x27;)</code> 判断，<code>example.com.attacker.test</code> 也能通过。</li>
<li>收到消息就跳转 <code>location.href = data.url</code>，可被利用成开放重定向或 <code>javascript:</code> 执行。</li>
<li>把 <code>data.html</code> 写进 <code>innerHTML</code>，形成 DOM 型 XSS。</li>
<li>回复时用 <code>&#x27;*&#x27;</code>，把用户数据发给了已经导航到别处的窗口。</li>
</ul>
<h2>需要双向长期通信时</h2>
<p>用 <code>MessageChannel</code> 建立专用通道：握手时校验一次来源，之后通过 <code>port</code> 收发，避免每条消息都在全局 <code>message</code> 事件上匹配。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> { port1, port2 } = <span class="hljs-keyword">new</span> <span class="hljs-title class_">MessageChannel</span>();
frame.<span class="hljs-property">contentWindow</span>.<span class="hljs-title function_">postMessage</span>({ <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;connect&#x27;</span> }, <span class="hljs-variable constant_">CHART_ORIGIN</span>, [port2]);
port1.<span class="hljs-property">onmessage</span> = <span class="hljs-function">(<span class="hljs-params">event</span>) =&gt;</span> <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-string">&#x27;来自图表&#x27;</span>, event.<span class="hljs-property">data</span>);
</code></pre></div>
<h2>常见追问</h2>
<ul>
<li>同源页面之间也要校验吗？要。同源窗口可以直接访问彼此，但 <code>message</code> 事件可能来自任何持有窗口引用的页面。</li>
<li>能传哪些数据？结构化克隆支持的类型，函数和 DOM 节点不能传。</li>
</ul>`};export{e as default};