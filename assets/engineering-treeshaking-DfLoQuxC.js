var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>Tree shaking 就是构建时找出没被用到的代码并删掉。它依赖 ES 模块的静态 <code>import</code> 和 <code>export</code>，因为这种写法在不运行代码的情况下就能看出谁用了谁。</p>
<p>一段代码能删，要同时满足两个条件：它的导出没人用，而且执行它没有副作用。副作用指执行时会影响外部，比如改全局变量、打印日志、引入 CSS。</p>
<p>库可以帮打包工具做判断。<code>package.json</code> 里写 <code>sideEffects: false</code>，表示“整个模块没人用时可以跳过”；<code>/*#__PURE__*/</code> 标注单个调用没有副作用。CommonJS 的导出是运行时才确定的，通常没法精确摇树。</p>
<p>要注意，只有生产构建才会真正删除代码，效果要看产物验证，不能光凭源码判断。</p>
</blockquote>
<h2>两类分析：导出级和模块级</h2>
<p>先看一个工具模块，它有两个导出，顶层还有一行打印。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// utils.js</span>
<span class="hljs-keyword">export</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">used</span>(<span class="hljs-params"></span>) { <span class="hljs-keyword">return</span> <span class="hljs-number">1</span>; }
<span class="hljs-keyword">export</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">unused</span>(<span class="hljs-params"></span>) { <span class="hljs-keyword">return</span> <span class="hljs-number">2</span>; }
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-string">&#x27;utils loaded&#x27;</span>); <span class="hljs-comment">// 副作用</span>
</code></pre></div>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// main.js</span>
<span class="hljs-keyword">import</span> { used } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;./utils.js&#x27;</span>;
<span class="hljs-title function_">used</span>();
</code></pre></div>
<p>第一类是导出级的分析。<code>unused</code> 没被任何地方导入，所以可以删掉。</p>
<p>第二类是模块级的分析。假如 main.js 一个导出都不用，整个 utils.js 能不能跳过？不能，因为顶层的 <code>console.log</code> 是副作用，删掉模块就少了这行输出。所以打包工具默认会保留这个模块。</p>
<h2>为什么有些代码删不掉</h2>
<p>最常见的是顶层副作用，比如修改全局对象、注册 polyfill、给原型加方法、引入 CSS。打包工具没法确认删了是否安全，只能留着。</p>
<p>其次是看不出纯不纯的函数调用。比如 <code>export const Button = styled.button(...)</code> 是一次函数调用，工具不知道它会不会改外部状态。库可以在调用前加 <code>/*#__PURE__*/</code>，告诉工具“返回值没人用时，这次调用可以删”。</p>
<p>CommonJS 也是一个原因。<code>module.exports = {...}</code> 和动态 <code>require</code> 让工具没法静态确定用到了哪些导出。所以选依赖时优先用提供 ESM 入口的版本，比如 <code>lodash-es</code>。</p>
<p>还有整体导入后动态访问。写了 <code>import * as utils</code> 再调用 <code>utils[name]()</code>，工具不知道 <code>name</code> 是什么，只能全部保留。</p>
<p>最后是类和对象的方法。一个类只要被用到，它的方法通常都会保留。</p>
<h2>sideEffects 字段怎样写</h2>
<div class="not-prose code-block"><div class="code-language">json</div><pre><code class="hljs language-json">{
  &quot;name&quot;: &quot;my-lib&quot;,
  &quot;sideEffects&quot;: [&quot;*.css&quot;, &quot;./src/polyfill.js&quot;]
}
</code></pre></div>
<p>写成 <code>false</code>，表示所有模块都没有副作用，没被用到的模块可以整个跳过。写成数组，就是列出确实有副作用的文件，其余的可以跳过。</p>
<p>声明错了会出问题。比如 CSS 文件被标成无副作用，<code>import &#x27;./style.css&#x27;</code> 这种不取任何导出的导入就可能被删掉，样式就丢了。所以上面的例子把 <code>*.css</code> 列了进去。</p>
<h2>怎样验证效果</h2>
<p>要运行生产构建，因为开发模式通常不删代码。然后用产物分析工具，看某个库最后占了多少体积。</p>
<p>也可以直接在产物里搜索本应被删掉的函数名或字符串。webpack 的 <code>optimization.usedExports</code> 会在产物里留下 <code>unused harmony export</code> 注释，能帮你定位。</p>
<h2>常见追问</h2>
<p><strong>Tree shaking 和压缩是什么关系？</strong></p>
<blockquote>
<p>打包工具负责标记哪些导出没被使用，真正把代码删掉，通常是压缩器做的，比如 Terser、esbuild、Oxc。</p>
</blockquote>
<p><strong>为什么还需要按需引入插件？</strong></p>
<blockquote>
<p>有些旧库只提供 CommonJS，或者靠副作用注册组件，tree shaking 处理不了。按需插件会把整体导入改写成单个文件的导入，绕开这个问题。</p>
</blockquote>`};export{e as default};