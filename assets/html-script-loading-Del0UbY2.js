var e={answerHtml:`<h2>简答</h2>
<ul>
<li>普通经典脚本会阻塞 HTML 解析并立即执行。</li>
<li><code>defer</code> 脚本并行下载，在文档解析完成后按文档顺序执行；<code>async</code> 下载完就执行，顺序不保证。</li>
<li>有依赖关系的经典脚本不能随意改成 async；内联经典脚本加 defer 或 async 没有效果。</li>
<li>执行顺序只保证脚本顶层执行，不保证里面启动的异步初始化已经完成。</li>
</ul>
<p>浏览器解析 HTML 时遇到脚本，需要决定：现在停下来执行，还是继续读后面的 HTML？脚本又可能依赖尚未出现的 DOM、另一个库，或者自己导入的模块。<code>async</code>、<code>defer</code> 和 <code>type=&quot;module&quot;</code> 会改变其中不同部分的规则。</p>
<p>先限定一个常见场景：<strong>直接写在 HTML 中、由解析器发现的脚本标签</strong>。动态插入的脚本要另外讨论，不能把两者全部混在同一张时间表里。</p>
<h2>经典脚本的三种常见方式</h2>
<table><thead><tr><th>写法</th><th>下载阶段</th><th>执行时机</th><th>多个同类脚本的顺序</th></tr></thead><tbody><tr><td><code>&lt;script src=&quot;a.js&quot;&gt;&lt;/script&gt;</code></td><td>解析器通常需要等待该脚本就绪</td><td>在当前位置执行，完成后才继续解析后续 HTML</td><td>按解析遇到的顺序执行</td></tr><tr><td><code>&lt;script defer src=&quot;a.js&quot;&gt;&lt;/script&gt;</code></td><td>可与解析并行</td><td>文档解析完成后执行</td><td>保持文档中的顺序</td></tr><tr><td><code>&lt;script async src=&quot;a.js&quot;&gt;&lt;/script&gt;</code></td><td>可与解析并行</td><td>就绪后尽早执行，不要求等解析完成</td><td>不保证文档顺序</td></tr></tbody></table>
<p>浏览器可能通过预加载扫描器提前发现后续资源，所以“解析暂停”不代表整个浏览器网络活动也全部停止。但经典脚本在执行期间通常会占用主线程，<code>async</code> 并没有把 JavaScript 代码自动放进后台线程。</p>
<p>普通内联经典脚本会在解析到它时执行。<code>defer</code> 对没有 <code>src</code> 的经典脚本没有延后效果，<code>async</code> 也不能用来改变这种内联经典脚本的执行时机。</p>
<h2>有依赖的经典脚本，不能随意加 async</h2>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-tag">&lt;<span class="hljs-name">script</span> <span class="hljs-attr">defer</span> <span class="hljs-attr">src</span>=<span class="hljs-string">&quot;/scripts/library.js&quot;</span>&gt;</span><span class="hljs-tag">&lt;/<span class="hljs-name">script</span>&gt;</span>
<span class="hljs-tag">&lt;<span class="hljs-name">script</span> <span class="hljs-attr">defer</span> <span class="hljs-attr">src</span>=<span class="hljs-string">&quot;/scripts/page.js&quot;</span>&gt;</span><span class="hljs-tag">&lt;/<span class="hljs-name">script</span>&gt;</span>
</code></pre></div>
<p>假设 <code>page.js</code> 需要 <code>library.js</code> 在顶层同步建立的全局接口，两个 <code>defer</code> 脚本既可以并行下载，又会按文档顺序执行。即使 <code>page.js</code> 下载更快，也要等前面的 deferred 脚本执行。</p>
<p>把二者改成 <code>async</code> 后，谁先就绪谁就可能先执行，<code>page.js</code> 就可能在库尚未初始化时访问它。只在自己电脑上“连续刷新都正常”，不能证明没有竞态。</p>
<p>此外，执行顺序只保证脚本的相应执行阶段，不保证里面启动的异步初始化已经完成。如果 <code>library.js</code> 只是发出了一个配置请求，<code>page.js</code> 仍然需要等待显式的 Promise 或其他就绪信号。</p>
<p>独立统计脚本、没有前后依赖的外部插件可以考虑 async；页面初始化需要访问解析完成的 DOM，或依赖前面的经典脚本时，defer 更容易表达意图。</p>
<h2>module 不只是更方便的 defer</h2>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-tag">&lt;<span class="hljs-name">script</span> <span class="hljs-attr">type</span>=<span class="hljs-string">&quot;module&quot;</span> <span class="hljs-attr">src</span>=<span class="hljs-string">&quot;/scripts/main.js&quot;</span>&gt;</span><span class="hljs-tag">&lt;/<span class="hljs-name">script</span>&gt;</span>
</code></pre></div>
<p>模块脚本默认具有类似 defer 的解析协调行为：加载入口和依赖图，通常在文档解析后开始执行，不需要再写 <code>defer</code>。内联模块脚本也有模块自己的执行规则，不等同于普通内联经典脚本。</p>
<p>模块更重要的变化是通过 <code>import</code>、<code>export</code> 表达依赖。入口中写 <code>import { init } from &#x27;./library.js&#x27;</code>，比在 HTML 中安排两个互相猜测全局变量的标签更明确。</p>
<p>模块默认处于严格模式，顶层 <code>this</code> 是 <code>undefined</code>，顶层声明不会自动变成 <code>window</code> 的属性。跨源模块加载需要符合 CORS 等检查，服务端还必须提供合适的 JavaScript MIME 类型。因此开发时通常通过 HTTP 服务访问，不能假设直接双击 <code>file://</code> 页面就能复现部署环境。</p>
<p>模块加 <code>async</code> 后，会在入口及相关依赖就绪时尽早开始执行，而不再等待默认的解析后阶段。模块内部的导入依赖仍需遵守模块求值规则；async 改变的是它相对文档解析的调度，不是让依赖可以随意乱序执行。</p>
<h2>DOMContentLoaded 到底等什么</h2>
<p><code>DOMContentLoaded</code> 在文档解析完成、相关 deferred 脚本与默认模块脚本的调度条件满足后触发。它不会等待所有图片，也不会等待任意 async 脚本或代码里发出的所有请求。deferred 脚本还可能受已经解析到的样式表加载影响，因此事件时间不只是 HTML 文件大小决定的。</p>
<p>带顶层 <code>await</code> 的模块，或脚本中的异步函数，会产生暂停与后续继续执行的阶段。不能把 <code>DOMContentLoaded</code> 当成“所有异步初始化都已完成”的承诺；需要等待配置、用户信息或模块的异步结果时，应使用对应的 Promise。</p>
<p>如果一段代码可能在事件之后才加载，例如动态导入或异步脚本，应先检查文档状态：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">setup</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">const</span> heading = <span class="hljs-variable language_">document</span>.<span class="hljs-title function_">querySelector</span>(<span class="hljs-string">&#x27;h1&#x27;</span>);
  <span class="hljs-keyword">if</span> (heading) heading.<span class="hljs-property">dataset</span>.<span class="hljs-property">ready</span> = <span class="hljs-string">&#x27;true&#x27;</span>;
}

<span class="hljs-keyword">if</span> (<span class="hljs-variable language_">document</span>.<span class="hljs-property">readyState</span> === <span class="hljs-string">&#x27;loading&#x27;</span>) {
  <span class="hljs-variable language_">document</span>.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;DOMContentLoaded&#x27;</span>, setup, { <span class="hljs-attr">once</span>: <span class="hljs-literal">true</span> });
} <span class="hljs-keyword">else</span> {
  <span class="hljs-title function_">setup</span>();
}
</code></pre></div>
<p>这样既能在解析未完成时等待，也不会在事件已经过去后才注册监听、从此等不到初始化。这里保证的是访问已解析的 DOM，不是等待其他脚本的业务状态。</p>
<h2>动态脚本与布尔属性的两个陷阱</h2>
<p>通过 <code>document.createElement(&#x27;script&#x27;)</code> 创建并插入的外部经典脚本，通常具有异步执行行为。不要以为给它写 <code>defer</code> 就能得到静态标签相同的排队方式。若确需让一组动态经典脚本保持插入顺序，可以在插入前将各自的 <code>script.async = false</code>，或者显式等待前一个脚本的加载结果；仍需处理加载错误。</p>
<p>HTML 中 <code>async</code>、<code>defer</code> 是布尔属性，存在就表示开启。<code>async=&quot;false&quot;</code> 并不是关闭 async。经典外部脚本同时带 async 和 defer 时，现代浏览器按 async 行为处理，不能得到“下载异步但又按 defer 排序”的组合。</p>
<p>最后，这些属性优化的是加载与执行的安排。一个执行 500 毫秒的初始化函数，即使用 defer 放到解析之后，仍然可能阻塞交互。减少首屏代码、拆分长任务和明确依赖，才是让页面真正更早可用的后续工作。</p>`};export{e as default};