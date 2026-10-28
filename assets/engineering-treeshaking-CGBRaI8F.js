var e={answerHtml:`<h2>简答</h2>
<ul>
<li>Tree shaking 依赖 ES 模块的静态 <code>import</code>/<code>export</code>，在构建时找出没被使用的导出并删除。</li>
<li>删除一段代码有两个前提：它的导出没人用，并且执行它没有副作用。</li>
<li><code>package.json</code> 的 <code>sideEffects: false</code> 告诉打包工具&quot;整个模块没人用时可以跳过&quot;；<code>/*#__PURE__*/</code> 标注单个调用没有副作用。</li>
<li>CommonJS（<code>require</code>、<code>module.exports</code>）的导出是运行时决定的，通常无法精确摇树。</li>
<li>只有生产构建才会真正删除，结果要看产物验证，不能只凭源码判断。</li>
</ul>
<h2>两类分析</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// utils.js</span>
<span class="hljs-keyword">export</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">used</span>(<span class="hljs-params"></span>) { <span class="hljs-keyword">return</span> <span class="hljs-number">1</span>; }
<span class="hljs-keyword">export</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">unused</span>(<span class="hljs-params"></span>) { <span class="hljs-keyword">return</span> <span class="hljs-number">2</span>; }
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-string">&#x27;utils loaded&#x27;</span>); <span class="hljs-comment">// 副作用</span>
</code></pre></div>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// main.js</span>
<span class="hljs-keyword">import</span> { used } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;./utils.js&#x27;</span>;
<span class="hljs-title function_">used</span>();
</code></pre></div>
<ul>
<li><strong>导出级</strong>：<code>unused</code> 没被导入，可以删除。</li>
<li><strong>模块级</strong>：如果 main.js 一个导出都不用，整个 utils.js 能否跳过？顶层的 <code>console.log</code> 是副作用，打包工具默认会保留这个模块。</li>
</ul>
<h2>为什么有些代码删不掉</h2>
<ol>
<li><strong>顶层副作用</strong>：修改全局对象、注册 polyfill、给原型添加方法、引入 CSS。打包工具无法确认删除后是否安全，只能保留。</li>
<li><strong>无法判断纯度的调用</strong>：<code>export const Button = styled.button(...)</code> 是函数调用，工具不知道它是否修改外部状态。库可以在调用前加 <code>/*#__PURE__*/</code> 标注，返回值没被使用时就能删掉。</li>
<li><strong>CommonJS</strong>：<code>module.exports = {...}</code> 和动态 <code>require</code> 让工具无法静态确定用到了哪些导出。选择依赖时优先使用提供 ESM 入口的版本（如 <code>lodash-es</code>）。</li>
<li><strong>整体导入后动态访问</strong>：<code>import * as utils</code> 后写 <code>utils[name]()</code>，工具无法知道用到了哪个，只能全部保留。</li>
<li><strong>类和对象的方法</strong>：一个类被使用，它的所有方法通常都会保留。</li>
</ol>
<h2>sideEffects 字段</h2>
<div class="not-prose code-block"><div class="code-language">json</div><pre><code class="hljs language-json">{
  &quot;name&quot;: &quot;my-lib&quot;,
  &quot;sideEffects&quot;: [&quot;*.css&quot;, &quot;./src/polyfill.js&quot;]
}
</code></pre></div>
<ul>
<li><code>false</code>：所有模块都没有副作用，未使用的模块可以整个跳过。</li>
<li>数组：列出确实有副作用的文件，其余可以跳过。</li>
<li>声明错误会出问题：CSS 文件被标成无副作用后，<code>import &#x27;./style.css&#x27;</code> 可能被删掉，样式丢失。</li>
</ul>
<h2>怎样验证</h2>
<ul>
<li>运行生产构建（开发模式通常不删代码），用产物分析工具查看某个库最终占了多少体积。</li>
<li>在产物中搜索应被删除的函数名或字符串。</li>
<li>webpack 的 <code>optimization.usedExports</code> 会在产物中留下 <code>unused harmony export</code> 注释，可以帮助定位。</li>
</ul>
<h2>常见追问</h2>
<ul>
<li>Tree shaking 和压缩是什么关系？标记未使用的导出由打包工具完成，真正删除代码通常由压缩器（Terser、esbuild、Oxc）完成。</li>
<li>为什么按需引入插件还有必要？有些旧库只提供 CommonJS 或依赖副作用注册，按需插件把整体导入改写成单文件导入。</li>
</ul>`};export{e as default};