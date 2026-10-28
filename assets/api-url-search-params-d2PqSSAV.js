var e={answerHtml:`<h2>简答</h2>
<ul>
<li>URL 处理完整地址，URLSearchParams 处理查询部分。</li>
<li>读取时要定义单值和多值规则，重复键用 getAll。</li>
<li>让 API 负责编码，不要先手动编码再 set，否则会二次编码。</li>
<li>更新筛选时明确保留哪些参数，并决定用 pushState 还是 replaceState。</li>
</ul>
<p>用户筛选“React + 组件库”，希望刷新后保持条件，也希望把链接分享给同事。URL 是适合保存可分享状态的位置，但不是可信的配置文件：参数可能缺失、重复、超长，甚至包含非法页码。正确做法是先解析，再按业务规则校验，而不是把 query 直接写进 store。</p>
<h2>URL 处理地址，URLSearchParams 处理查询部分</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> url = <span class="hljs-keyword">new</span> <span class="hljs-title function_">URL</span>(<span class="hljs-string">&#x27;/resources/?tag=react&amp;tag=ui&amp;page=2&#x27;</span>, <span class="hljs-string">&#x27;https://example.com&#x27;</span>);
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(url.<span class="hljs-property">searchParams</span>.<span class="hljs-title function_">get</span>(<span class="hljs-string">&#x27;tag&#x27;</span>)); <span class="hljs-comment">// react</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(url.<span class="hljs-property">searchParams</span>.<span class="hljs-title function_">getAll</span>(<span class="hljs-string">&#x27;tag&#x27;</span>)); <span class="hljs-comment">// [&#x27;react&#x27;, &#x27;ui&#x27;]</span>
url.<span class="hljs-property">searchParams</span>.<span class="hljs-title function_">set</span>(<span class="hljs-string">&#x27;page&#x27;</span>, <span class="hljs-string">&#x27;3&#x27;</span>);
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(url.<span class="hljs-property">pathname</span>); <span class="hljs-comment">// /resources/</span>
</code></pre></div>
<p>get 返回第一个匹配值，getAll 返回所有值。set 替换该键的值，并删除额外的同名值；append 则新增一项。查询参数是可重复的键值序列，不是天然的普通对象。Object.fromEntries 会丢失重复键，不能用于需要多选的参数而不说明规则。</p>
<p>new URLSearchParams 可以解析查询字符串，但不会像 new URL 一样解析完整地址。传入完整 https 地址可能把地址前半段当成参数名，应该先创建 URL，再使用 searchParams。</p>
<h2>读取时定义单值和多值规则</h2>
<p>下面约定 tag 允许多值，page 只能出现一次；不合法页码回退为 1，最多接受第 1000 页。实际是否存在这一页，还要根据查询结果的总页数调整。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">readFilters</span>(<span class="hljs-params">href</span>) {
  <span class="hljs-keyword">const</span> url = <span class="hljs-keyword">new</span> <span class="hljs-title function_">URL</span>(href, <span class="hljs-string">&#x27;https://example.com&#x27;</span>);
  <span class="hljs-keyword">const</span> allowedTags = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Set</span>([<span class="hljs-string">&#x27;react&#x27;</span>, <span class="hljs-string">&#x27;vue&#x27;</span>, <span class="hljs-string">&#x27;ui&#x27;</span>]);
  <span class="hljs-keyword">const</span> tags = [...<span class="hljs-keyword">new</span> <span class="hljs-title class_">Set</span>(url.<span class="hljs-property">searchParams</span>.<span class="hljs-title function_">getAll</span>(<span class="hljs-string">&#x27;tag&#x27;</span>))]
    .<span class="hljs-title function_">filter</span>(<span class="hljs-function">(<span class="hljs-params">tag</span>) =&gt;</span> allowedTags.<span class="hljs-title function_">has</span>(tag));
  <span class="hljs-keyword">const</span> pages = url.<span class="hljs-property">searchParams</span>.<span class="hljs-title function_">getAll</span>(<span class="hljs-string">&#x27;page&#x27;</span>);
  <span class="hljs-keyword">const</span> raw = pages.<span class="hljs-property">length</span> === <span class="hljs-number">1</span> ? pages[<span class="hljs-number">0</span>] : <span class="hljs-string">&#x27;&#x27;</span>;
  <span class="hljs-keyword">const</span> number = <span class="hljs-regexp">/^[1-9]\\d{0,3}$/</span>.<span class="hljs-title function_">test</span>(raw) ? <span class="hljs-title class_">Number</span>(raw) : <span class="hljs-title class_">NaN</span>;
  <span class="hljs-keyword">const</span> page = number &lt;= <span class="hljs-number">1000</span> ? number : <span class="hljs-number">1</span>;
  <span class="hljs-keyword">return</span> { tags, page };
}

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">readFilters</span>(<span class="hljs-string">&#x27;/?tag=react&amp;tag=react&amp;tag=unknown&amp;page=2&#x27;</span>));
<span class="hljs-comment">// { tags: [&#x27;react&#x27;], page: 2 }</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">readFilters</span>(<span class="hljs-string">&#x27;/?page=2&amp;page=3&#x27;</span>));
<span class="hljs-comment">// { tags: [], page: 1 }</span>
</code></pre></div>
<p>不能仅写 Number(raw)：空字符串会变成 0，科学计数法和空白也可能被接受。是否允许这些格式是业务选择，本例明确只接受无前导零的正整数字符串。对登录回调、签名和安全参数，应与服务端采用相同的重复键策略，避免前端取第一项、后端取最后一项产生歧义。</p>
<h2>让 API 编码，不要先编码再 set</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> params = <span class="hljs-keyword">new</span> <span class="hljs-title class_">URLSearchParams</span>();
params.<span class="hljs-title function_">set</span>(<span class="hljs-string">&#x27;q&#x27;</span>, <span class="hljs-string">&#x27;C++ 与 React&#x27;</span>);
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(params.<span class="hljs-title function_">get</span>(<span class="hljs-string">&#x27;q&#x27;</span>)); <span class="hljs-comment">// C++ 与 React</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(params.<span class="hljs-title function_">toString</span>()); <span class="hljs-comment">// q=C%2B%2B+%E4%B8%8E+React</span>
</code></pre></div>
<p>URLSearchParams 使用表单式查询编码：空格通常序列化为加号，字面加号编码为 %2B。解析 <code>q=C++</code> 得到的加号会作为空格处理，因此外部输入中的真实加号需要正确编码。set 接收未编码的文本；先 encodeURIComponent 再 set，会让百分号再次编码。get 的结果也已经解码，不应无条件再 decodeURIComponent。</p>
<p>编码只负责表示，不负责安全。搜索词仍应作为文本渲染，不能交给 innerHTML；跳转地址即使经过 URL 解析，也仍需限制协议与允许的目的地，不能据此接受 javascript: 或任意外站重定向。</p>
<h2>更新筛选时保留哪些参数</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">writeFilters</span>(<span class="hljs-params">href, tags, page</span>) {
  <span class="hljs-keyword">const</span> url = <span class="hljs-keyword">new</span> <span class="hljs-title function_">URL</span>(href, <span class="hljs-string">&#x27;https://example.com&#x27;</span>);
  url.<span class="hljs-property">searchParams</span>.<span class="hljs-title function_">delete</span>(<span class="hljs-string">&#x27;tag&#x27;</span>);
  <span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> tag <span class="hljs-keyword">of</span> tags) url.<span class="hljs-property">searchParams</span>.<span class="hljs-title function_">append</span>(<span class="hljs-string">&#x27;tag&#x27;</span>, tag);
  url.<span class="hljs-property">searchParams</span>.<span class="hljs-title function_">set</span>(<span class="hljs-string">&#x27;page&#x27;</span>, <span class="hljs-title class_">String</span>(page));
  <span class="hljs-keyword">return</span> url.<span class="hljs-property">pathname</span> + url.<span class="hljs-property">search</span> + url.<span class="hljs-property">hash</span>;
}
</code></pre></div>
<p>本例假定 tags 和 page 已通过同一业务校验，仅替换筛选键，保留其他参数与 hash。真实分享链接应额外去掉不应传播的追踪标识、令牌和私人状态。不要默认 sort 所有参数来生成“规范 URL”：顺序可能参与签名或业务解释，签名链接应按签名协议原样处理。</p>
<p>输入框每次按键都 pushState 会让后退按钮逐字回退。可以在连续编辑时 replaceState，用户明确提交筛选时再 pushState，并在 popstate 中恢复筛选；使用路由器时优先走其 API，避免绕过路由状态。pushState 本身不会触发 popstate，也不会替应用重新请求数据。</p>
<h2>性能和兼容性</h2>
<p>URL/URLSearchParams 在现代浏览器广泛可用，但解析和生成完整字符串仍与输入长度相关，不能无限接受外部参数。高频输入可合并更新，避免反复解析、渲染和请求。旧 WebView 应核对实际支持版本；示例只使用基础方法，不依赖较新的重载能力。</p>
<p>验证时覆盖重复键、未知标签、空字符串、中文、加号、百分号、无效页码和历史导航。纯解析函数可以在 Node.js 测试，前进后退、滚动恢复与路由器交互仍需要浏览器测试。</p>`};export{e as default};