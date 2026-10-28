var e={answerHtml:`<h2>简答</h2>
<ul>
<li>Tree shaking 移除确认不影响行为的未使用代码，不只是没被调用的导出。</li>
<li>静态的 import/export 让工具容易分析用到了哪些绑定，ESM 因此更有利于优化。</li>
<li>模块顶层副作用、动态属性访问和 CommonJS 的动态 require 会阻止或削弱移除。</li>
<li><code>sideEffects</code> 声明要如实填写，写错会让必要的副作用代码被删掉。</li>
</ul>
<p>一个工具模块导出了十个函数，应用只使用其中一个，理想情况下不必把其余九个函数都发给用户。Tree shaking 利用模块与代码分析，移除确认不影响程序行为的部分。</p>
<p>关键是“确认不影响行为”，而不只是“这个导出没有被直接调用”。模块顶层可能注册事件、安装补丁或加载样式，即使没有使用它的导出，执行模块本身仍可能有意义。</p>
<h2>ESM 为什么有利于分析</h2>
<p>静态 import/export 让工具更容易知道模块导出了什么、哪个入口使用了哪个绑定。相比很多运行时拼装的导出对象，这提供了更清楚的使用关系。</p>
<p>例如应用只导入 add：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// math.js</span>
<span class="hljs-keyword">export</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">add</span>(<span class="hljs-params">a, b</span>) {
  <span class="hljs-keyword">return</span> a + b;
}

<span class="hljs-keyword">export</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">unusedMessage</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">return</span> <span class="hljs-string">&#x27;不需要进入当前页面的功能&#x27;</span>;
}
</code></pre></div>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// main.js</span>
<span class="hljs-keyword">import</span> { add } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;./math.js&#x27;</span>;

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">add</span>(<span class="hljs-number">1</span>, <span class="hljs-number">2</span>));
</code></pre></div>
<p>在支持且正确配置的生产优化中，unusedMessage 可以成为可移除对象。但如果使用动态属性访问整个模块命名空间，工具可能无法证明哪些导出永远不用。</p>
<p>CommonJS 并非绝对不能优化，某些模式可以被工具分析；但动态 require、条件导出或运行时修改对象会增加不确定性。不能只改成一个 ESM 文件后缀，就认定整条依赖链都具备相同的可分析性。</p>
<h2>未使用导出与未使用模块是不同问题</h2>
<p>考虑一个模块顶层写了 <code>globalThis.registered = true</code>，同时还导出一个没有被使用的函数。删除那个函数可能安全，删除整个模块却会丢掉顶层初始化。</p>
<p>CSS、polyfill、全局事件注册和自动安装的插件，都可能依赖这种执行效果。工具保留相关内容，有时是在正确保护行为，不一定是优化失效。</p>
<h2>sideEffects 是作者提供的文件级信息</h2>
<p>包清单中的 sideEffects=false 声明这个包的相关模块在未使用时可以被安全跳过。它不是“里面的所有函数都没有副作用”，也不是强制工具删除任意未调用代码的开关。</p>
<p>错误声明可能让样式或初始化被移除。例如库入口导入 setup.js 完成注册，但包声称所有文件都无副作用，生产构建就可能跳过这次初始化。</p>
<p>如果只有部分文件需要保留执行，可以按打包器支持的规则列出它们。在这个由 index.js 入口承担初始化的例子里，还应保留相应入口执行：</p>
<div class="not-prose code-block"><div class="code-language">json</div><pre><code class="hljs language-json">{
  &quot;sideEffects&quot;: [
    &quot;./index.js&quot;,
    &quot;./setup.js&quot;,
    &quot;**/*.css&quot;
  ]
}
</code></pre></div>
<p>路径模式应与实际发布文件对应。把源码路径列进去，而归档里只有另一套 dist 路径，可能达不到预期。也要检查触发副作用的导入链：只标记最底层文件，不保证上游入口被跳过时它仍会执行；具体清单应以实际职责和构建结果为准。</p>
<h2>纯调用标注也有具体范围</h2>
<p>某些工具理解 <code>/*#__PURE__*/</code> 等标注，用来说明特定调用在结果未使用时可以移除。这是对某个表达式的提示，不是给整个函数或模块颁发“永远安全删除”的证明。</p>
<p>如果被标注的调用实际上修改全局状态，错误标注就可能改变行为。应由了解该调用语义的工具或作者使用，不要为了让报告更小就到处添加 PURE。</p>
<h2>为什么开发输出里还看得到未用代码</h2>
<p>开发构建可能保留更多可读内容，导出使用分析与最终删除也可能由不同阶段完成。某个工具识别了未用导出，不代表你查看的那份中间代码已经被压缩器删除。</p>
<p>应检查真正部署的生产产物和相应配置。只在源码中搜索函数名，或者只看 node_modules 中包的总大小，不能判断最终发送了多少代码。</p>
<p>转译过程也要配合。如果在打包器分析之前就把 ESM 结构转换成不利于分析的形式，可能削弱后续优化；插件、包入口和条件导出也会影响选中了哪份代码。</p>
<h2>优化结果需要同时检查体积和功能</h2>
<p>可以建立一个最小消费者，只导入确定使用的 API，构建后检查未用内容是否移除，再验证必要初始化、样式和运行结果仍存在。包自身开发示例正常，不代表独立消费者的生产优化也正常。</p>
<p>Tree shaking 关注可移除代码；代码分割则决定代码分到哪个块、何时获取。一个导出确实要使用，可以被懒加载而不是删除，两种技术解决的问题不同。</p>
<p>目标是减少不必要的传输和执行，同时保留正确行为。产物更小但主题、注册或补丁失效，并不是成功的优化。</p>`};export{e as default};