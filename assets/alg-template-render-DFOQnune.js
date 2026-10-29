var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>题目是：实现 <code>render(&#x27;你好，{{ user.name }}，你有 {{ count }} 条消息&#x27;, data)</code>，把双大括号里的变量换成数据里的值。思路是用一个正则找出所有 <code>{{ ... }}</code>，把里面的变量名取出来，再去数据对象里查值替换上去。</p>
<p><code>String.prototype.replace</code> 的第二个参数可以是函数，每找到一处匹配就调用一次，函数的返回值就是替换后的内容，参数里能拿到正则的捕获组，也就是括号里的变量名。变量名可能带点号，比如 <code>user.name</code>，就按点号拆开，从数据对象一层层往下取。</p>
<p>有三处要处理。取不到值时，返回空字符串还是保留原样，要事先约定，不能把 <code>undefined</code> 直接拼进去；取值时只读对象自己的属性，否则 <code>{{ constructor }}</code> 这类写法会读出原型上的函数；结果要插进 HTML 时，必须把 <code>&lt;</code>、<code>&gt;</code>、<code>&amp;</code>、引号转义，不然用户名里写了 <code>&lt;img src=x onerror=...&gt;</code> 就会执行脚本。</p>
<p>要注意，这只是一个面试级别的简单实现，不支持循环、条件这些语法。真实项目里用框架自带的模板，它们默认会转义插值内容。</p>
</blockquote>
<h2>代码实现</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">render</span>(<span class="hljs-params">template, data, { <span class="hljs-built_in">escape</span> = <span class="hljs-literal">true</span> } = {}</span>) {
  <span class="hljs-keyword">return</span> template.<span class="hljs-title function_">replace</span>(<span class="hljs-regexp">/\\{\\{\\s*([\\w.]+)\\s*\\}\\}/g</span>, <span class="hljs-function">(<span class="hljs-params">match, path</span>) =&gt;</span> {
    <span class="hljs-keyword">let</span> value = data;
    <span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> key <span class="hljs-keyword">of</span> path.<span class="hljs-title function_">split</span>(<span class="hljs-string">&#x27;.&#x27;</span>)) {
      <span class="hljs-keyword">if</span> (value == <span class="hljs-literal">null</span> || !<span class="hljs-title class_">Object</span>.<span class="hljs-title function_">hasOwn</span>(<span class="hljs-title class_">Object</span>(value), key)) <span class="hljs-keyword">return</span> <span class="hljs-string">&#x27;&#x27;</span>;
      value = value[key];
    }
    <span class="hljs-keyword">const</span> text = <span class="hljs-title class_">String</span>(value ?? <span class="hljs-string">&#x27;&#x27;</span>);
    <span class="hljs-keyword">return</span> <span class="hljs-built_in">escape</span> ? <span class="hljs-title function_">escapeHtml</span>(text) : text;
  });
}

<span class="hljs-keyword">function</span> <span class="hljs-title function_">escapeHtml</span>(<span class="hljs-params">text</span>) {
  <span class="hljs-keyword">return</span> text.<span class="hljs-title function_">replace</span>(<span class="hljs-regexp">/[&amp;&lt;&gt;&quot;&#x27;]/g</span>, <span class="hljs-function">(<span class="hljs-params">char</span>) =&gt;</span> ({
    <span class="hljs-string">&#x27;&amp;&#x27;</span>: <span class="hljs-string">&#x27;&amp;amp;&#x27;</span>,
    <span class="hljs-string">&#x27;&lt;&#x27;</span>: <span class="hljs-string">&#x27;&amp;lt;&#x27;</span>,
    <span class="hljs-string">&#x27;&gt;&#x27;</span>: <span class="hljs-string">&#x27;&amp;gt;&#x27;</span>,
    <span class="hljs-string">&#x27;&quot;&#x27;</span>: <span class="hljs-string">&#x27;&amp;quot;&#x27;</span>,
    <span class="hljs-string">&quot;&#x27;&quot;</span>: <span class="hljs-string">&#x27;&amp;#39;&#x27;</span>,
  })[char]);
}

<span class="hljs-keyword">const</span> data = { <span class="hljs-attr">user</span>: { <span class="hljs-attr">name</span>: <span class="hljs-string">&#x27;小明&#x27;</span> }, <span class="hljs-attr">count</span>: <span class="hljs-number">3</span> };
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">render</span>(<span class="hljs-string">&#x27;你好，{{ user.name }}，你有 {{count}} 条消息&#x27;</span>, data)); <span class="hljs-comment">// 你好，小明，你有 3 条消息</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">render</span>(<span class="hljs-string">&#x27;{{ user.age }}|{{ missing.x }}&#x27;</span>, data)); <span class="hljs-comment">// |</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">render</span>(<span class="hljs-string">&#x27;{{ constructor }}&#x27;</span>, data)); <span class="hljs-comment">//</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">render</span>(<span class="hljs-string">&#x27;{{ name }}&#x27;</span>, { <span class="hljs-attr">name</span>: <span class="hljs-string">&#x27;&lt;b&gt;小明&lt;/b&gt;&#x27;</span> })); <span class="hljs-comment">// &amp;lt;b&amp;gt;小明&amp;lt;/b&amp;gt;</span>
</code></pre></div>
<p>正则 <code>\\{\\{\\s*([\\w.]+)\\s*\\}\\}</code> 怎么读？大括号在正则里有特殊含义，要用 <code>\\{</code> 转义。<code>\\s*</code> 允许变量名两边有空格，所以 <code>{{count}}</code> 和 <code>{{ count }}</code> 都能匹配。<code>([\\w.]+)</code> 是捕获组，匹配由字母、数字、下划线和点号组成的变量名，它的内容会作为回调的第二个参数 <code>path</code> 传进来。末尾的 <code>g</code> 表示替换所有匹配，没有它只会替换第一处。</p>
<p><code>{{ user.age }}</code> 和 <code>{{ missing.x }}</code> 都输出了空字符串。前者是 <code>user</code> 上没有 <code>age</code>，后者是 <code>missing</code> 本身就不存在，循环里 <code>value == null</code> 时直接返回空，避免读 <code>undefined.x</code> 报错。</p>
<p><code>{{ constructor }}</code> 为什么也是空？<code>data.constructor</code> 其实能读到值，就是原型上的 <code>Object</code> 函数。用 <code>Object.hasOwn</code> 只认对象自己的属性，原型上的就被挡住了。这和原型污染是同一类问题，见<a href="/questions/sec-prototype-pollution/">《原型污染为什么常出现在动态属性赋值和深合并中？》</a>。</p>
<p>最后一个例子里，<code>&lt;b&gt;</code> 被转义成了 <code>&amp;lt;b&amp;gt;</code>，插进页面后显示的是文字，不会被当成标签。<code>escape</code> 选项默认开启，只有确定输出不进 HTML、比如生成纯文本时才关掉。</p>
<h2>常见追问</h2>
<p><strong>为什么不用 <code>new Function</code> 或 <code>eval</code> 直接执行表达式？</strong></p>
<blockquote>
<p>那样能支持 <code>{{ a + b }}</code> 这种表达式，可是模板内容一旦来自用户，就等于让用户执行任意代码。只允许变量路径，是在功能和安全之间的取舍。</p>
</blockquote>
<p><strong>Vue 的模板编译也是这样替换字符串的吗？</strong></p>
<blockquote>
<p>不是。Vue 把模板解析成 AST，再生成渲染函数，插值变成对数据的读取，最后生成虚拟 DOM，而不是拼字符串。插值的文本会作为文本节点插入，所以默认不会被当成 HTML 执行，见<a href="/questions/vue-compiler-optimizations/">《Vue 模板编译如何减少运行时更新工作？》</a>。</p>
</blockquote>`};export{e as default};