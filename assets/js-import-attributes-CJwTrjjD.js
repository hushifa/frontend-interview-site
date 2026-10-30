var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>import attributes 是在 <code>import</code> 语句后面加一段 <code>with { ... }</code>，告诉运行时这个模块应该是什么类型。最常见的写法是 <code>import data from &#x27;./data.json&#x27; with { type: &#x27;json&#x27; }</code>，把一个 JSON 文件直接当模块导入。</p>
<p>之所以要写明类型，是因为浏览器不看文件扩展名，只按服务器返回的 MIME 类型决定怎么解析模块。如果服务器被篡改，把一个“JSON”文件返回成 <code>text/javascript</code>，里面的代码就会被执行。写了 <code>type: &#x27;json&#x27;</code>，返回的类型不是 <code>application/json</code> 时导入直接失败。</p>
<p>除了 JSON，浏览器还支持 <code>type: &#x27;css&#x27;</code>，导入得到一个 <code>CSSStyleSheet</code> 对象。动态导入写成 <code>import(&#x27;./data.json&#x27;, { with: { type: &#x27;json&#x27; } })</code>。</p>
<p>要注意，早期提案用的是 <code>assert</code> 关键字，现在这种写法已经不是标准，新代码应该用 <code>with</code>。另外 JSON 模块只有默认导出，不能按字段做具名导入。</p>
</blockquote>
<h2>写法长什么样</h2>
<p>静态导入和重新导出都把属性写在模块路径后面：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">import</span> config <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;./config.json&#x27;</span> <span class="hljs-keyword">with</span> { <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;json&#x27;</span> };
<span class="hljs-keyword">export</span> { <span class="hljs-keyword">default</span> <span class="hljs-keyword">as</span> theme } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;./theme.json&#x27;</span> <span class="hljs-keyword">with</span> { <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;json&#x27;</span> };
</code></pre></div>
<p><code>with</code> 后面是一个对象。键可以是标识符或字符串，必须是运行时认识的键，值必须是字符串字面量。静态导入写了运行时不认识的键会报 <code>SyntaxError</code>，动态导入里写了不认识的键会报 <code>TypeError</code>。</p>
<p>动态导入时，属性放在第二个参数的 <code>with</code> 字段里：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> { <span class="hljs-attr">default</span>: config } = <span class="hljs-keyword">await</span> <span class="hljs-keyword">import</span>(<span class="hljs-string">&#x27;./config.json&#x27;</span>, {
  <span class="hljs-attr">with</span>: { <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;json&#x27;</span> },
});
</code></pre></div>
<p>拿到的是模块命名空间对象，JSON 内容在 <code>default</code> 上。因为 JSON 模块只有一个默认导出，<code>import { name } from &#x27;./config.json&#x27; with { type: &#x27;json&#x27; }</code> 这种具名导入是不行的。</p>
<h2>为什么不能看扩展名就决定类型</h2>
<p>很多人会问：文件叫 <code>config.json</code>，浏览器为什么还要我再声明一遍类型？</p>
<p>原因是浏览器加载模块时只看服务器响应里的媒体类型（MIME 类型），URL 里的扩展名不起作用。假设服务器出了问题，把这个文件的类型返回成 <code>text/javascript</code>，而文件内容又被换成了恶意代码，没有声明类型时它会被当成脚本执行。导入方本来只想读一份数据，结果执行了外部代码。</p>
<p>写了 <code>with { type: &#x27;json&#x27; }</code> 以后，运行时会核对类型。服务器返回的不是 <code>application/json</code>，导入就失败。浏览器发请求时还会带上 <code>Accept: application/json</code>。所以这个属性改变的是怎样获取和校验模块，不会改变 JSON 本身怎样解析。</p>
<p>反过来，不写 <code>type</code> 直接导入 JSON，浏览器会报错，提示期望的是 JavaScript 模块，服务器却返回了 <code>application/json</code>。MDN 也说明 Node 和 Deno 跟浏览器保持一致，导入 JSON 模块同样要求写 <code>type</code>。</p>
<h2>CSS 模块怎样用</h2>
<p>浏览器还支持 <code>type: &#x27;css&#x27;</code>，导入的结果是一个 <code>CSSStyleSheet</code> 对象，可以直接加到文档或 Shadow DOM 上：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">import</span> sheet <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;./card.css&#x27;</span> <span class="hljs-keyword">with</span> { <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;css&#x27;</span> };
<span class="hljs-variable language_">document</span>.<span class="hljs-property">adoptedStyleSheets</span>.<span class="hljs-title function_">push</span>(sheet);
</code></pre></div>
<p>同样的规则也适用：服务器返回的不是 <code>text/css</code>，导入就失败。<code>CSSStyleSheet</code> 只在 window 环境里提供，所以 Worker 里通常不能导入 CSS 模块。</p>
<h2>和旧的 assert 有什么区别</h2>
<p>这个特性早期叫 import assertions，写法是 <code>import data from &#x27;./data.json&#x27; assert { type: &#x27;json&#x27; }</code>。后来提案改成了 <code>with</code> 关键字，MDN 明确说 <code>assert</code> 现在是非标准写法。</p>
<p>所以老教程、老项目里看到 <code>assert</code>，迁移时改成 <code>with</code> 即可，花括号里的内容不用变。新代码不要再写 <code>assert</code>。</p>
<h2>常见追问</h2>
<p><strong>同一个路径写不同的属性，会是同一个模块吗？</strong></p>
<blockquote>
<p>不一定。MDN 说明属性是模块说明符的一部分，同样的路径带上不同的属性，可能加载出完全不同的模块。</p>
</blockquote>
<p><strong>导入的 JSON 后来在服务器上改了，页面能读到新内容吗？</strong></p>
<blockquote>
<p>读不到。动态导入的模块在整个页面或 Worker 的生命周期里都会被缓存，同一个模块只加载一次。数据会变化的话，应该用 <code>fetch</code> 去请求，而不是用 import。</p>
</blockquote>
<p><strong>ESM 和 CommonJS 的其他区别呢？</strong></p>
<blockquote>
<p>加载时机、导出的是值还是绑定这些差别，见<a href="/questions/js-esm-cjs/">《ES Modules 和 CommonJS 有哪些关键区别？》</a>。</p>
</blockquote>`};export{e as default};